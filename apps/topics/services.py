#topics/services


import random
import re
import os
import logging
from pypdf import PdfReader
from django.db.models import F, Value, FloatField, IntegerField, Prefetch
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from apps.topics import models
from services import ai_services, sanity
from utils.globals import QuestionType

logger = logging.getLogger( __name__ )

def get_next_question( topic_id ):

	logger.info( f"Getting next question for {topic_id}" )

	# Load topic from database
	topic = models.Topic.objects.get( id=topic_id )

	# Pick a random concept associated with the topic
	concept_ids = topic.concepts.values_list( "id", flat=True )
	if not concept_ids:
		raise ValueError( "No concepts found for the topic." )
	selected_concept_id  = random.choice( concept_ids )
	selected_concept = models.Concept.objects.get( id=selected_concept_id )

	logger.debug( f"Selected concept: {selected_concept.name}" )

	# Pick question type
	q_type = get_question_type( topic.topic_data )
	logger.debug( f"Question Type: {q_type}" )

	# Pick question source
	source_chunk = get_random_question_source( topic )

	if source_chunk is not None:
		logger.debug( f"Question Source: {source_chunk.id}" )

	# Load all questions from database
	all_questions = models.Question.objects.filter(
		topic=topic, concepts=selected_concept, type=q_type, source_chunk=source_chunk
	)
	unasked_questions = all_questions.filter( last_asked__isnull=True )
	question_count = all_questions.count()
	unasked_question_count = unasked_questions.count()

	# Either generate new question or use question from database based on random chance
	q_scale = 20
	generate_new_chance = max( 1, q_scale - question_count )
	if unasked_question_count == 0 and random.randint( 0, q_scale ) <= generate_new_chance:
		logger.debug( "GENERATING NEW QUESTIONS" )

		# Get previously asked questions text
		previously_asked_questions = list(
			models.Question.objects.filter( topic=topic, concepts=selected_concept ).values_list(
				"text", flat=True
			)
		)

		# Generate the new questions
		if source_chunk is not None:
			src_text = source_chunk.text
		else:
			src_text = ""
		
		questions_data = ai_services.create_questions(
			topic.name,
			topic.description,
			selected_concept.name,
			previously_asked_questions,
			q_type,
			src_text
		)

		# Check if there are any questions generated
		if not questions_data.questions:
			raise ValueError( "No questions generated by the AI." )

		# Create list of concepts from the topic
		concepts_str = ",".join( [ concept.name for concept in topic.concepts.all() ] )
		
		# Create a list of question text
		questions_str = "\n".join( [ q.text for q in questions_data.questions ] )
		
		# Generate filtered question concepts
		gen_questions_concepts = ai_services.filter_question_concepts( concepts_str, questions_str )
		questions_concepts = gen_questions_concepts.questions_concepts
		
		# Save all the generated questions
		saved_questions = []
		for i, question_data in enumerate( questions_data.questions ):
			if not questions_concepts[ i ]:
				logger.debug( f"Warning: No concepts matched for question {i}" )
				continue
			
			logger.debug( f"New Question: {question_data.text}" )

			# Get concept instances and associate them with the question
			question_concepts = questions_concepts[ i ]
			concept_instances = []
			for concept_name in question_concepts:
				normalized_name = normalize_name( concept_name )
				concept = models.Concept.objects.filter( normalized_name=normalized_name ).first()
				if concept:
					concept_instances.append( concept )
				else:
					logger.warning( f"Warning: Concept '{concept_name}' not found." )

			# Set the defaults for question
			correct = ""
			answers = ""
			is_code = False
			language_class = ""
			boilerplate = ""

			# True/False Question
			if isinstance( question_data, ai_services.AI_TF_Question ):
				if question_data.is_true:
					correct = "true"
				else:
					correct = "false"
				answers = [ "true", "false" ]
			
			# Open Text Question
			elif isinstance( question_data, ai_services.AI_OpenQuestion ):
				is_code = question_data.is_code
				language_class = question_data.language_class
				boilerplate = question_data.boilerplate
			
			# Multiple Choice Question
			else:
				answers = question_data.answers
				correct = question_data.correct

			# Create the question database record
			question = models.Question.objects.create(
				topic = topic,
				text = question_data.text,
				details = getattr( question_data, "details", "" ),
				type = q_type,
				is_code = is_code,
				language_class = language_class,
				boilerplate = boilerplate,
				source_chunk = source_chunk,
				answers = answers,
				correct = correct,
				main_concept = selected_concept
			)

			# Set qeustion concepts
			question.concepts.set( concept_instances )

			# Store all saved questions for picking random one
			saved_questions.append( question )

		# Return a random question from new questions
		question = saved_questions[
			random.randint( 0, len( saved_questions ) - 1 )
		]
		question_response = {
			"id": question.id,
			"text": question.text,
			"details": question.details,
			"is_open": question.type == QuestionType.open,
			"is_code": question.is_code,
			"language_class": question.language_class,
			"boilerplate": question.boilerplate,
			"answers": question.answers,
			"concepts": [ concept.name for concept in question.concepts.all() ]
		}
		return question_response
	
	# Return a random question from the database
	else:
		logger.debug( "LOADING RANDOM QUESITON FROM DB" )
		if unasked_question_count > 0:
			question = models.Question.objects.filter(
				topic=topic, concepts=selected_concept, last_asked__isnull=True
			).first()
		else:
			questions = list(
				models.Question.objects.filter( topic=topic, concepts=selected_concept )
			)
			questions.sort( key=lambda q: q.question_rank() )
			choices = []
			for question in questions:
				rank = question.question_rank()
				num_copies = max( round( rank / 100 ), 1 )
				for _ in range( num_copies ):
					choices.append( question )
			question = choices[ random.randint( 0, len( choices ) - 1 ) ]
		
		if not question:
			raise ValueError( "No questions available." )
		
		# Set the question response
		question_response = {
			"id": question.id,
			"text": question.text,
			"details": question.details,
			"is_open": question.type == QuestionType.open,
			"is_code": question.is_code,
			"language_class": question.language_class,
			"boilerplate": question.boilerplate,
			"answers": question.answers,
			"concepts": [ concept.name for concept in question.concepts.all() ]
		}
		return question_response

def get_question_type( topic_data ):
	settings = topic_data.get( "settings", {} )
	mcq_frequency = settings.get( "mcq-frequency", 70 )
	tf_frequency = settings.get( "tf-frequency", 20 )
	open_text_frequency = settings.get( "open-text-frequency", 10 )

	# Create a weighted list of question types
	question_types = (
		[ QuestionType.mcq ] * mcq_frequency +
		[ QuestionType.tf ] * tf_frequency +
		[ QuestionType.open ] * open_text_frequency
	)

	# If the list is empty, default to 'mcq'
	if not question_types:
		return "mcq"

	# Randomly select a question type based on the weights
	return random.choice( question_types )

def get_random_question_source( topic ):
	"""
	Determine the source of the question: an attachment filename or an empty string for the topic 
	description. Ensures the document exists in the user's data before selecting it.

	Args:
		topic (Topic): The Topic object containing the user and topic_data.

	Returns:
		str: Document text (if it exists) or an empty string.
	"""
	topic_data = topic.topic_data or {}
	settings = topic_data.get( "settings", {} )
	attachments = topic_data.get( "attachments", [] )

	# Get frequencies for document-based and description-based sources
	doc_frequency = settings.get( "document-frequency", 50 )
	non_doc_frequency = settings.get( "non-document-frequency", 50 )

	# Create a weighted list of sources
	sources = (
		[ "document" ] * doc_frequency +
		[ "description" ] * non_doc_frequency
	)

	# If no weights are provided or list is empty, default to 'description'
	if not sources:
		return None

	# Choose source type
	selected_source = random.choice( sources )

	if selected_source == "document" and attachments:

		# Get all user documents
		documents = models.Document.objects.filter( user=topic.user, name__in=attachments )

		if documents.exists():
			document = documents.order_by( "?" ).first()
			chunks = document.chunks.all()
			if chunks.exists():
				chunk = chunks.order_by( "?" ).first()
				return chunk

	# Return empty string for topic description or if no valid documents are found
	return None

def get_question_by_id( question_id ):
	question = models.Question.objects.get( id=question_id )
	question_response = {
		"id": question.id,
		"text": question.text,
		"details": question.details,
		"is_open": question.type == QuestionType.open,
		"is_code": question.is_code,
		"language_class": question.language_class,
		"boilerplate": question.boilerplate,
		"answers": question.answers,
		"concepts": [ concept.name for concept in question.concepts.all() ]
	}
	return question_response

def get_topic_evaluation( topic_name ):
	ai_response = ai_services.evaluate_topic( topic_name )
	response_data = {
		"description": ai_response.summary,
		"suggestions": ai_response.suggestions
	}
	return response_data

def get_topic_suggestions( topic_name ):
	ai_response = ai_services.suggest_topics( topic_name )
	response_data = {
		"suggestions": ai_response.suggestions
	}
	return response_data

def save_topic( topic_name, topic_description, user, topic_data=None ):
		logger.info( f"Saving topic {topic_name} to database." )
		logger.debug( f"Topic Description: {topic_description}" )
		logger.debug( f"Topic Data: {topic_data}" )

		# Validate topic_data
		topic_data = sanity.sanitize_topic_data( topic_data )
		
		# Check if the topic already exists
		existing_topic = models.Topic.objects.filter( name=topic_name ).first()

		if existing_topic:
			logger.debug( "Updating exisiting topic" )
			is_changed = False
			if ( existing_topic.description != topic_description ):
				is_changed = True
				logger.debug( "Topic description has changed" )
			else:
				logger.debug( "Topic description has not changed" )

			existing_topic.description = topic_description
			existing_topic.topic_data = topic_data
			existing_topic.save()
			response_data = {
				"id": existing_topic.id,
				"name": existing_topic.name,
				"description": existing_topic.description,
				"data": topic_data
			}
			logger.debug( f"Topic: {existing_topic.id} updated" )

			# Generate the concepts for the topic
			if is_changed:
				generate_topic_concepts( existing_topic.id )

			return response_data
		else:
			logger.debug( "Creating Topic" )
			# If the topic does not exist, create a new topic
			topic = models.Topic.objects.create(
				name=topic_name,
				description=topic_description,
				topic_data=topic_data,
				user=user
			)
			logger.debug( f"Topic: {topic.id} created" )

			# Generate the concepts for the topic
			generate_topic_concepts( topic.id )

			response_data = {
				"id": topic.id,
				"name": topic.name,
				"description": topic.description,
				"data": topic_data
			}
			return response_data

def delete_topic( topic_id, user ):
	# Retrieve the topic
	topic = models.Topic.objects.get( id=topic_id )

	# Check if the topic belongs to the user
	if topic.user != user:
		raise PermissionDenied( "You do not have permission to delete this topic." )
	
	# Delete all associated questions for the topic
	topic.questions.all().delete()
	
	# Delete all user knowledge records associated with the topic
	models.UserKnowledge.objects.filter( topic=topic ).delete()
	
	# Finally, delete the topic itself
	topic.delete()
	
	return {
		"message": f"Topic '{topic.name}' and its related data have been deleted."
	}

def generate_topic_concepts( topic_id ):
	logger.info( f"Generating topic info for {topic_id}" )
	logger.debug( f"Topic: {topic_id}" )
	topic = models.Topic.objects.get( id=topic_id )

	# Clear any existing concepts associated with this topic
	# This is necessary because the description could be changed which may make some concepts
	# not applicable anymore for this topic
	topic.concepts.clear()

	# Generate new concepts using AI
	ai_response = ai_services.generate_concepts( topic.name, topic.description )

	for concept_name in ai_response.concepts:

		# Normalize the name for searching
		normalized_name = normalize_name( concept_name )

		logger.debug( f"Normalized name: {normalized_name}" )

		# Find a similar concept name
		similar_concept = models.Concept.objects.filter(
			normalized_name=normalized_name
		).first()

		# Set the concept
		if similar_concept:
			concept = similar_concept
			created = False
		else:
			concept = models.Concept.objects.create(
				name=concept_name,
				normalized_name=normalized_name
			)
			created = True

		# Add the concept to the topic's concepts if it's not already linked
		if not topic.concepts.filter( id=concept.id ).exists():
			topic.concepts.add( concept )
		
		logger.debug(
			f"Concept '{concept_name}' {'created' if created else 'found'} and added to the topic."
		)

def normalize_name( name ):
	return re.sub( r"[^a-zA-Z]", "", name ).lower()

def get_topic_description( topic_name ):
	ai_response = ai_services.summarize_topic( topic_name )
	response_data = {
		"description": ai_response.summary
	}
	return response_data

def set_answer( user, question_id, answer ):
	try:
		question = models.Question.objects.select_related( "topic" ).get( id=question_id )
	except ObjectDoesNotExist:
		raise ValueError( f"Question id: {question_id} not found." )
	
	# Check if the topic belongs to the user
	if question.topic.user != user:
		raise PermissionDenied(
			f"User '{user.id}', attempted to access other question '{question_id}'."
		)

	# User skipped question
	if answer == "":
		#question.skip_count += 1
		#question.last_asked = timezone.now()
		#question.save()
		question.delete()
		return { "is_skipped": True }

	# Evaluate if answer is correct
	if question.type == QuestionType.open:
		if question.source_chunk is None:
			src = ""
		else:
			src = question.source_chunk.text
		# question, answer, topic_name, topic_description, concept_name
		ai_response = ai_services.submit_open_answer(
			question.text, question.details, answer, question.topic.name,
			question.topic.description, question.main_concept.name, src
		)
		is_correct = ai_response.is_correct
		correct = ai_response.explanation
	else:
		is_correct = answer == question.correct
		correct = question.correct

	# Increment question score
	if is_correct:
		question.correct_count += 1
	else:
		question.wrong_count += 1
	
	# Save question
	question.last_asked = timezone.now()
	question.save()

	# Update user knowledge for main concept
	update_user_knowledge( user, question.topic, question.main_concept, is_correct, True )

	# Update user knowledge for other concepts
	for concept in question.concepts.exclude( id=question.main_concept.id ):
		update_user_knowledge( user, question.topic, concept, is_correct, False )
	
	return {
		"correct": correct,
		"is_correct": is_correct,
		"is_skipped": False,
		"is_open": question.type == QuestionType.open
	}

def update_user_knowledge( user, topic, concept, is_correct, is_main_concept ):

	# Get or create the UserKnowledge instance for this combination
	user_knowledge, _ = models.UserKnowledge.objects.get_or_create(
		user=user, topic=topic, concept=concept
	)
	
	# Define point values
	points = 1
	if is_main_concept:
		points = 5
	
	# Update the points based on whether the answer was correct
	if is_correct:
		user_knowledge.correct_points += points
	else:
		user_knowledge.wrong_points += points

	# Save the updated record
	user_knowledge.save()

def explain_topic( question_id, user ):
	logger.info( f"Explaining topic for question {question_id}" )
	try:
		question = models.Question.objects.select_related( "topic" ).get( id=question_id )
	except ObjectDoesNotExist:
		raise ValueError( f"Question id: {question_id} not found." )
	
	# Check if the question belongs to the user
	if question.topic.user != user:
		raise PermissionDenied(
			f"User '{user.id}', attempted to access other question '{question_id}'."
		)
	
	# Load or create a new explanation instance
	explanation, created = models.Explanation.objects.get_or_create(
		question=question,
		defaults={"text": ""}
	)

	# Create a new explanation for question
	if created:
		logger.debug( "Creating new explanation for question/answer" )
		topic_name = question.topic.name
		topic_description = question.topic.description
		concept_name = question.main_concept
		if question.source_chunk is None:
			src = ""
		else:
			src = question.source_chunk.text
		ai_response = ai_services.explain_question(
			question.text, question.correct,  topic_name, topic_description, concept_name, src
		)
		explanation.text = ai_response.explanation
		explanation.save()
		response_data = {
			"question": question.text,
			"answer": question.correct,
			"explanation": ai_response.explanation
		}
	else:
		logger.debug( "Loaded explanation for question" )
		response_data = {
			"question": question.text,
			"answer": question.correct,
			"explanation": explanation.text
		}
	
	return  response_data

def get_question_history2( user ):
	
	# Fetch questions with selected fields
	questions = (
		models.Question.objects.filter( topic__user=user, last_asked__isnull=False )
		.values(
			"id",
			"topic__id",
			"topic__name",
			"text",
			"correct_count",
			"wrong_count",
			"skip_count",
			"last_asked",
			"main_concept__name"
		)
	)
	questions_data = []
	for question in questions:

		# Calculate average score
		total = question[ "correct_count" ] + question[ "wrong_count" ]
		if total > 0:
			average_score = round( question[ "correct_count" ] / total, 2 )
		else:
			average_score = 0
		
		# Get related concepts for each question
		concepts = list(
			models.Question.objects.get( id=question[ "id" ] ).concepts.values_list( 
				"name", flat=True
			)
		)

		# Set last asked date
		if question[ "last_asked" ]:
			last_asked = question[ "last_asked" ].strftime( "%Y-%m-%d %H:%M:%S" )
		questions_data.append( {
			"id": question[ "id" ],
			"topic_id": question[ "topic__id" ],
			"topic": question[ "topic__name" ],
			"text": question[ "text" ],
			"correct": question[ "correct_count" ],
			"wrong": question[ "wrong_count" ],
			"average": average_score,
			"concepts": concepts,
			"main_concept": question[ "main_concept__name" ],
			"last_asked": last_asked
		} )
	
	return questions_data


def get_question_history(user):
	# Fetch questions with annotations and prefetch related concepts
	questions = (
		models.Question.objects.filter(topic__user=user, last_asked__isnull=False)
		.annotate(
			topic_name=F("topic__name"),
			main_concept_name=F("main_concept__name"),
			total_attempts=Coalesce(
				F("correct_count") + F("wrong_count"),
				Value(0),
				output_field=IntegerField(),
			),
			average_score=Coalesce(
				F("correct_count") * 1.0 / (F("correct_count") + F("wrong_count")),
				Value(0.0),
				output_field=FloatField(),
			),
		)
		.select_related("topic", "main_concept")
		.prefetch_related(Prefetch("concepts"))
	)

	# Process and format questions data
	questions_data = []
	for question in questions:
		# Use attribute access for model fields
		concepts = [concept.name for concept in question.concepts.all()]
		last_asked = (
			question.last_asked.strftime("%Y-%m-%d %H:%M:%S")
			if question.last_asked
			else None
		)

		# Append formatted data
		questions_data.append(
			{
				"id": question.id,
				"topic_id": question.topic.id,
				"topic": question.topic_name,
				"text": question.text,
				"correct": question.correct_count,
				"wrong": question.wrong_count,
				"average": round(question.average_score, 2) if question.average_score else 0,
				"concepts": concepts,
				"main_concept": question.main_concept_name,
				"last_asked": last_asked,
			}
		)

	return questions_data

def store_document( user, name, file_content ):

	content = ""

	# Determine file extension
	file_extension = os.path.splitext( name )[ 1 ].lower()

	# Parse content for files
	if file_extension in [ ".txt", ".csv", ".json" ]:
		content = file_content.read().decode( "utf-8" )

	# Parse content for pdf
	elif file_extension == ".pdf":
		reader = PdfReader( file_content )
		for page in reader.pages:
			page_text = page.extract_text() or ""
			content += page_text.strip() + "\n"
	else:
		raise ValueError( f"Unsupported file type: {file_extension}" )

	if len( content ) == 0:
		raise ValueError( "Document cannot be blank" )
	
	# Delete document if it already exists
	document = models.Document.objects.filter(user=user, name=name).first()
	if document:
		document.delete()

	# Store the document chunks
	store_document_chunks( user, name, content )

def store_document_chunks( user, name, content ):
	document = models.Document.objects.create( name=name, user=user )
	chunk_overlap = 250
	optimal_chunk_size = 750
	max_chunk_size = 1000

	# Convert to linux line feeds
	content = content.replace( "\r\n", "\n" )

	# Start Chunking
	chunk_start = 0
	i = optimal_chunk_size
	while i < len( content ):
		chunk_index = i - chunk_start

		# Store the optimal sized chunk
		if chunk_index > optimal_chunk_size and content[ i ] == "\n":
			chunk_text = content[ chunk_start : i ]
			models.Chunk.objects.create( document=document, text=chunk_text )
			chunk_start = i + 1
			i = chunk_start + optimal_chunk_size
			continue
		
		# If passed the max size split in half with some overlap
		if chunk_index > max_chunk_size:
			chunk_text = content[ chunk_start : i ]
			models.Chunk.objects.create( document=document, text=chunk_text )

			# Move the chunk start back even further to get the overlap
			chunk_start = i - chunk_overlap
			i = chunk_start + optimal_chunk_size
			continue
		
		# Increment the i index
		i += 1

	# Check if we reached the end
	if chunk_start >= len( content ) - 1:
		return

	# Handle last remaining chunk
	remaining_length = len( content) - chunk_start
	
	# Include overlap to make the last chunk at least optimal size
	if remaining_length < optimal_chunk_size:
		chunk_start = max( 0, chunk_start - ( optimal_chunk_size - remaining_length ) )

	chunk_text = content[ chunk_start: ]
	models.Chunk.objects.create( document=document, text=chunk_text )
