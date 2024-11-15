#topics/services

import random
import re

from datetime import datetime
from django.db.models import Func, Q, F
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from apps.topics import models
from services import ai_services

def get_next_question( topic_id ):
	topic = models.Topic.objects.get( id=topic_id )

	# Pick a random concept associated with the topic
	concept_ids = topic.concepts.values_list( "id", flat=True )
	if not concept_ids:
		raise ValueError( "No concepts found for the topic." )
	selected_concept_id  = random.choice( concept_ids )
	selected_concept = models.Concept.objects.get( id=selected_concept_id )
	print( f"Selected concept: {selected_concept.name}" )

	 # Count the number of questions linked to the selected concept
	question_count = models.Question.objects.filter(
		topic=topic,
		concepts=selected_concept
	).count()
	
	# TODO: if there are unasked questions for the selected topic, ask those before generating new
	# ones.
	# Either generate new question or use question from database based on random chance
	q_scale = 20
	generate_new_chance = max( 1, q_scale - question_count )
	if random.randint( 0, q_scale ) <= generate_new_chance:
		print( "GENERATING NEW QUESTIONS" )

		# Get previously asked questions text
		previously_asked_questions = list(
			models.Question.objects.filter( topic=topic, concepts=selected_concept ).values_list(
				"text", flat=True
			)
		)

		# Generate the new questions
		questions_data = ai_services.create_questions(
			topic.name,
			topic.description,
			selected_concept.name,
			previously_asked_questions
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
			print( f"New Question: {question_data.text}" )

			# Get concept instances and associate them with the question
			question_concepts = questions_concepts[ i ]
			concept_instances = []
			for concept_name in question_concepts:
				normalized_name = normalize_concept_name( concept_name )
				concept = models.Concept.objects.filter( normalized_name=normalized_name ).first()
				if concept:
					concept_instances.append( concept )
				else:
					print( f"Warning: Concept '{concept_name}' not found." )

			# Create the question database record
			if isinstance( question_data, ai_services.AI_OpenQuestion ):
				question = models.Question.objects.create(
					topic = topic,
					text = question_data.text,
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
		questions = list( models.Question.objects.filter( topic=topic ) )
		questions.sort( key=lambda q: q.question_rank() )
		choices = []
		for question in questions:
			rank = question.question_rank()
			num_copies = max( round( rank / 100 ), 1 )
			for _ in range( num_copies ):
				choices.append( question )
		question = choices[ random.randint( 0, len( choices ) - 1 ) ]
		question_response = {
			"id": question.id,
			"text": question.text,
			"is_open": question.is_open,
			"is_code": question.is_code,
			"language_class": question.language_class,
			"boilerplate": question.boilerplate,
			"answers": question.answers,
			"concepts": [ concept.name for concept in question.concepts.all() ]
		}
		return question_response

def get_question_by_id( question_id ):
	question = models.Question.objects.get( id=question_id )
	question_response = {
		"id": question.id,
		"text": question.text,
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

def save_topic( topic_name, topic_description, user ):
		print( "SAVING TOPIC IN SERVICE" )
		print( topic_name )

		# Check if the topic already exists
		existing_topic = models.Topic.objects.filter( name=topic_name ).first()

		if existing_topic:
			print( "UPDATING TOPIC" )
			existing_topic.description = topic_description
			existing_topic.save()
			response_data = {
				"id": existing_topic.id,
				"name": existing_topic.name,
				"description": existing_topic.description
			}
			print( f"Topic: {existing_topic.id} updated" )

			# Generate the concepts for the topic
			generate_topic_concepts( existing_topic.id )

			return response_data
		else:
			print( "CREATING TOPIC" )
			# If the topic does not exist, create a new topic
			topic = models.Topic.objects.create(
				name=topic_name,
				description=topic_description,
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
		normalized_name = normalize_concept_name( concept_name )

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

def normalize_concept_name( name ):
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
		question.skip_count += 1
		question.last_asked = timezone.now()
		question.save()
		return { "is_skipped": True }

	# Evaluate if answer is correct
	if question.is_open:
		# question, answer, topic_name, topic_description, concept_name
		ai_response = ai_services.submit_open_answer(
			question.text, answer, question.topic.name, question.topic.description,
			question.main_concept.name
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
		ai_response = ai_services.explain_question(
			question.text, question.correct,  topic_name, topic_description, concept_name
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
