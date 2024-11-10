import random
import json
from datetime import datetime
from django.db.models import F, ExpressionWrapper, fields
from apps.topics.models import Topic, Question
from services.ai_services import create_questions

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
