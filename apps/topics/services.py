#topics/services

import random
import re
from datetime import datetime
from django.db.models import Func, Q, F
from apps.topics.models import Topic, Question, Concept
from services.ai_services import (
	create_questions,
	evaluate_topic,
	summarize_topic,
	generate_concepts
)

def get_next_question( topic_id ):
	topic = Topic.objects.get( id=topic_id )
	question_count = topic.questions.count()
	generate_new_chance = max( 1, 100 - question_count )
	if random.randint( 0, 100 ) <= generate_new_chance:
		#print( "GENERATING NEW QUESTIONS" )
		questions_data = create_questions( topic.name, topic.description )
		# Save all the generated questions
		for question in questions_data.questions:
			#print( question )
			Question.objects.create(
				topic=topic,
				text=question.text,
				answers=question.answers,
				correct=question.correct,
				concepts=question.concepts
			)
		
		# Return a random question from new questions
		question = questions_data.questions[ random.randint( 0, len( questions_data.questions ) ) ]
		question_response = {
			"text": question.text,
			"answers": question.answers,
			"correct": question.correct,
			"concepts": question.concepts
		}
		return {
			"status": "success",
			"data": question_response
		}
	
	# Return a random question from the database
	else:
		#print( "LOADING RANDOM QUESITON FROM DB" )
		questions = list( Question.objects.filter( topic=topic ) )
		questions.sort( key=lambda q: q.question_rank() )
		choices = []
		for question in questions:
			rank = question.question_rank()
			#print( question.text, rank )
			num_copies = max( round( rank / 100 ), 1 )
			for _ in range( num_copies ):
				choices.append( question )
		#print( "CHOICES", len( choices ) )
		question = choices[ random.randint( 0, len( choices ) ) ]
		question_response = {
			"text": question.text,
			"answers": question.answers,
			"correct": question.correct,
			"concepts": question.concepts
		}
		return {
			"status": "success",
			"data": question_response
		}

def get_topic_evaluation( topic_name ):
	ai_response = evaluate_topic( topic_name )
	response_data = {
		"description": ai_response.summary,
		"suggestions": ai_response.suggestions
	}
	return {
		"status": "success",
		"data": response_data
	}

def save_topic( topic_name, topic_description, user ):
		print( "SAVING TOPIC IN SERVICE" )
		print( topic_name )

		# Check if the topic already exists
		existing_topic = Topic.objects.filter( name=topic_name ).first()

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

			return {
				"status": "success",
				"data": response_data
			}
		else:
			print( "CREATING TOPIC" )
			# If the topic does not exist, create a new topic
			topic = Topic.objects.create(
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
			return {
				"status": "success",
				"data": response_data
			}

def generate_topic_concepts( topic_id ):
	print("GENERATING CONCEPTS")
	topic = Topic.objects.get( id=topic_id )

	# Clear any existing concepts associated with this topic
	# This is necessary because the description could be changed which may make some concepts
	# not applicable anymore for this topic
	topic.concepts.clear()

	# Generate new concepts using AI
	ai_response = generate_concepts( topic.name, topic.description )

	for concept_name in ai_response.concepts:

		# Normalize the name for searching
		normalized_name = normalize_concept_name( concept_name )

		print( f"Normalized name: {normalized_name}" )

		# Find a similar concept name
		similar_concept = Concept.objects.filter(
			normalized_name=normalized_name
		).first()

		# Set the concept
		if similar_concept:
			concept = similar_concept
			created = False
		else:
			concept = Concept.objects.create( name=concept_name, normalized_name=normalized_name )
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
	ai_response = summarize_topic( topic_name )
	response_data = {
		"description": ai_response.summary
	}
	return {
		"status": "success",
		"data": response_data
	}
