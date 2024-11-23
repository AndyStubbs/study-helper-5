#topics/services

import random
import re
import os
from django import conf
from django.core.files.storage import default_storage
from PyPDF2 import PdfReader
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from apps.topics import models
from services import ai_services, sanity


def get_next_question( topic_id ):

	# Load topic from database
	topic = models.Topic.objects.get( id=topic_id )

	# Pick a random concept associated with the topic
	concept_ids = topic.concepts.values_list( "id", flat=True )
	if not concept_ids:
		raise ValueError( "No concepts found for the topic." )
	selected_concept_id  = random.choice( concept_ids )
	selected_concept = models.Concept.objects.get( id=selected_concept_id )
	print( f"Selected concept: {selected_concept.name}" )

	# Load all questions from database
	all_questions = models.Question.objects.filter( topic=topic, concepts=selected_concept )
	unasked_questions = all_questions.filter( last_asked__isnull=True )
	question_count = all_questions.count()
	unasked_question_count = unasked_questions.count()

	# Either generate new question or use question from database based on random chance
	q_scale = 20
	generate_new_chance = max( 1, q_scale - question_count )
	if unasked_question_count == 0 and random.randint( 0, q_scale ) <= generate_new_chance:
		print( "GENERATING NEW QUESTIONS" )

		# Get previously asked questions text
		previously_asked_questions = list(
			models.Question.objects.filter( topic=topic, concepts=selected_concept ).values_list(
				"text", flat=True
			)
		)

		q_type = get_question_type( topic.topic_data )
		print( f"Question Type: {q_type}" )
		q_src = get_question_source( topic )
		print( f"Question Source Length: {len( q_src )}" )

		# Generate the new questions
		questions_data = ai_services.create_questions(
			topic.name,
			topic.description,
			selected_concept.name,
			previously_asked_questions,
			q_type,
			q_src
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
				print( f"Warning: No concepts matched for question {i}" )
				continue
			
			print( f"New Question: {question_data.text}" )

			# Get concept instances and associate them with the question
			question_concepts = questions_concepts[ i ]
			concept_instances = []
			for concept_name in question_concepts:
				normalized_name = normalize_name( concept_name )
				concept = models.Concept.objects.filter( normalized_name=normalized_name ).first()
				if concept:
					concept_instances.append( concept )
				else:
					print( f"Warning: Concept '{concept_name}' not found." )

			# Create the question database record
			if isinstance( question_data, ai_services.AI_TF_Question ):
				if question_data.is_true:
					correct = "true"
				else:
					correct = "false"
				question = models.Question.objects.create(
					topic = topic,
					text = question_data.text,
					details = getattr( question_data, "details", "" ),
					is_open = False,
					is_code = False,
					language_class = "",
					boilerplate = "",
					source = q_src,
					answers = [ "true", "false" ],
					correct = correct,
					main_concept = selected_concept
				)
			elif isinstance( question_data, ai_services.AI_OpenQuestion ):
				question = models.Question.objects.create(
					topic = topic,
					text = question_data.text,
					details = getattr( question_data, "details", "" ),
					is_open = True,
					is_code = question_data.is_code,
					language_class = question_data.language_class,
					boilerplate = question_data.boilerplate,
					answers = "",
					correct = "",
					main_concept = selected_concept
				)
			else:
				question = models.Question.objects.create(
					topic = topic,
					text = question_data.text,
					details = getattr( question_data, "details", "" ),
					is_open = False,
					is_code = False,
					language_class = "",
					boilerplate = "",
					answers = question_data.answers,
					correct = question_data.correct,
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
			"is_open": question.is_open,
			"is_code": question.is_code,
			"language_class": question.language_class,
			"boilerplate": question.boilerplate,
			"answers": question.answers,
			"concepts": [ concept.name for concept in question.concepts.all() ]
		}
		return question_response
	
	# Return a random question from the database
	else:
		print( "LOADING RANDOM QUESITON FROM DB" )
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
			"is_open": question.is_open,
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
		[ "mcq" ] * mcq_frequency +
		[ "tf" ] * tf_frequency +
		[ "open_text" ] * open_text_frequency
	)

	# If the list is empty, default to 'mcq'
	if not question_types:
		return "mcq"

	# Randomly select a question type based on the weights
	return random.choice( question_types )

def get_question_source( topic ):
	"""
	Determine the source of the question: an attachment filename or an empty string for the topic 
	description. Ensures the file exists in the user's directory before selecting it.

	Args:
		topic (Topic): The Topic object containing the user and topic_data.

	Returns:
		str: Attachment filename (if it exists) or an empty string for topic description.
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
		return ""

	# Choose source type
	selected_source = random.choice( sources )

	if selected_source == "document" and attachments:
		# User folder path
		user_folder = os.path.join( conf.settings.MEDIA_ROOT, "uploads", str( topic.user.id ) )

		# Filter attachments to only include files that exist
		existing_files = []
		for file in attachments:
			file_path = os.path.join( user_folder, file )
			if os.path.exists( file_path ):
				existing_files.append( file_path )
		
		# Randomly select an existing file if any exist
		if existing_files:
			file_path = random.choice( existing_files )
			print( f"File: {file_path}" )
			chunk = get_file_preview( file_path, None, 500 )
			print( f"Chunk Size: {len(chunk)}" )
			return chunk

	# Return empty string for topic description or if no valid files are found
	return ""

def get_question_by_id( question_id ):
	question = models.Question.objects.get( id=question_id )
	question_response = {
		"id": question.id,
		"text": question.text,
		"details": question.details,
		"is_open": question.is_open,
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
		print( "SAVING TOPIC IN SERVICE" )
		print( topic_name )
		print( topic_data )

		# Validate topic_data
		topic_data = sanity.sanitize_topic_data( topic_data )
		
		# Check if the topic already exists
		existing_topic = models.Topic.objects.filter( name=topic_name ).first()

		if existing_topic:
			print( "UPDATING TOPIC" )
			is_changed = False
			if (
				existing_topic.description != topic_description or
				existing_topic.topic_data != topic_data
			):
				is_changed = True
			existing_topic.description = topic_description
			existing_topic.topic_data = topic_data
			existing_topic.save()
			response_data = {
				"id": existing_topic.id,
				"name": existing_topic.name,
				"description": existing_topic.description,
				"data": topic_data
			}
			print( f"Topic: {existing_topic.id} updated" )

			# Generate the concepts for the topic
			if is_changed:
				generate_topic_concepts( existing_topic.id )

			return response_data
		else:
			print( "CREATING TOPIC" )
			# If the topic does not exist, create a new topic
			topic = models.Topic.objects.create(
				name=topic_name,
				description=topic_description,
				topic_data=topic_data,
				user=user
			)
			print( f"Topic: {topic.id} created" )

			# Generate the concepts for the topic
			generate_topic_concepts( topic.id )

			response_data = {
				"id": topic.id,
				"name": topic.name,
				"description": topic.description
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
	print( "GENERATING CONCEPTS" )
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

		print( f"Normalized name: {normalized_name}" )

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
		
		print(
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
	if question.is_open:
		if question.source is None:
			src = ""
		else:
			src = question.source
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
		"is_open": question.is_open
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
	try:
		question = models.Question.objects.select_related( "topic" ).get( id=question_id )
	except ObjectDoesNotExist:
		raise ValueError( f"Question id: {question_id} not found." )
	
	# Check if the question belongs to the user
	if question.topic.user != user:
		raise PermissionDenied(
			f"User '{user.id}', attempted to access other question '{question_id}'."
		)
	
	print( "LOADING FROM DATABASE" )
	# Load or create a new explanation instance
	explanation, created = models.Explanation.objects.get_or_create(
		question=question,
		defaults={"text": ""}
	)
	print( "LOADED" )

	# Create a new explanation for question
	if created:
		print( "CREATING NEW EXPLANATION" )
		topic_name = question.topic.name
		topic_description = question.topic.description
		concept_name = question.main_concept
		if question.source is None:
			src = ""
		else:
			src = question.source
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
		print( "LOADED EXPLANATION" )
		response_data = {
			"question": question.text,
			"answer": question.correct,
			"explanation": explanation.text
		}
	
	return  response_data

def get_question_history( user ):
	
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

def get_file_preview( file_path, chunk_start=0, chunk_size=500 ):
	"""
	Generate a preview for the given file based on its type.

	Args:
		file_path (str): Path to the file in the storage system.

	Returns:
		str: A preview string or base64-encoded data for the file.
	"""
	# Determine file extension
	file_extension = os.path.splitext( file_path )[ 1 ].lower()

	# Generate preview for plain text files
	if file_extension in [ ".txt", ".csv", ".json" ]:
		file_content = default_storage.open( file_path ).read().decode( "utf-8" )
		return get_content_chunk( file_content, chunk_start, chunk_size )

	# Generate preview for PDF files
	elif file_extension == ".pdf":
		pdf_file = default_storage.open( file_path )
		reader = PdfReader( pdf_file )
		if reader.pages:
			return get_content_chunk( reader.pages[ 0 ].extract_text(), chunk_start, chunk_size )
	else:
		return ""

def get_content_chunk( content, chunk_start=0, chunk_size=500 ):

	print( f"Chunk Start: {chunk_start}, Chunk Size: {chunk_size}" )
	if chunk_start is None:
		print( len( content ) )

		chunk_start = max( random.randint( 0, len( content ) ) - chunk_size, 0 )
		print( f"Random Chunk Start: {chunk_start}" )

	# Move chunk-start to nearset new line or beginning of file
	while chunk_start > 0 and content[ chunk_start ] != "\n":
		chunk_start -= 1
	
	print( f"Final Chunk Start: {chunk_start}" )

	# Set chunk end to end of chunk size
	chunk_end = min( chunk_start + chunk_size, len( content ) - 1 )

	print( f"Start Chunk End: {chunk_end}" )

	# If not at end of the file
	if chunk_end < len( content ) - 1:

		# Move chunk-end to nearest paragraph or a minimum size
		chunk_end_start = chunk_end
		chunk_min = chunk_size - 100
		while chunk_end > chunk_start + chunk_min and content[ chunk_end ] != "\n":
			chunk_end -= 1
		
		if content[ chunk_end ] != "\n":
			chunk_end = chunk_end_start

	
	print( f"Final Chunk End: {chunk_end}" )
	print( f"Final Chunk Size: {chunk_end - chunk_start}" )

	chunk = content[ chunk_start : chunk_end ]
	return chunk
