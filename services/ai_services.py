# services/ai_services.py
from pydantic import BaseModel
import json
from openai import OpenAI
from .ai_prompts import (
	topic_evaluator_system_prompt,
	topic_evaluator_user_prompt,
	topic_summary_system_prompt,
	topic_summary_user_prompt,
	topic_concepts_system_prompt,
	topic_concepts_user_prompt,
	question_generator_user_prompt,
	question_generator_system_prompt,
	json_validator_system_prompt,
	json_validator_user_prompt,
	concept_filter_system_prompt,
	concept_filter_user_prompt
)

class AI_TopicInfo( BaseModel ):
	summary: str
	suggestions: list[ str ]

class AI_TopicSummary( BaseModel ):
	summary: str

class AI_Concepts( BaseModel ):
	concepts: list[ str ]

class AI_Question( BaseModel ):
	text: str
	answers: list[ str ]
	correct: str

class AI_GenQuestions( BaseModel ):
	questions: list[ AI_Question ]

class AI_QuestionsConcepts( BaseModel ):
	questions_concepts: list[ list[ str ] ]

def evaluate_topic( topic ):
	"""Evaluates the topic and offer suggestions."""
	return run_chat_json(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": topic_evaluator_system_prompt()
			},
			{
				"role": "user",
				"content": topic_evaluator_user_prompt( topic )
			}
		],
		validator=lambda ai_response: validate_topic_response( ai_response ),
		response_format=AI_TopicInfo
	)

def validate_topic_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response, AI_TopicInfo ):
		raise ValueError( "Invalid response for AI_TopicInfo" )

def summarize_topic( topic ):
	"""Summarize topic"""
	return run_chat_json(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": topic_summary_system_prompt()
			},
			{
				"role": "user",
				"content": topic_summary_user_prompt( topic )
			}
		],
		validator=lambda ai_response: validate_summary_response( ai_response ),
		response_format=AI_TopicSummary
	)

def validate_summary_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response, AI_TopicSummary ):
		raise ValueError( "Invalid response for AI_TopicSummary" )

def generate_concepts( topic_name, topic_description ):
	print( f"Creating concepts for topic: {topic_name} - {topic_description}" )
	return run_chat_json(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": topic_concepts_system_prompt()
			},
			{
				"role": "user",
				"content": topic_concepts_user_prompt( topic_name, topic_description )
			}
		],
		validator=lambda ai_response: validate_topic_generator_response( ai_response ),
		response_format=AI_Concepts
	)

def validate_topic_generator_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response, AI_Concepts ):
		raise ValueError( "Invalid response for AI_Concepts" )

def create_questions( topic_name, topic_description, concept_name, previous_questions ):
	print( f"Creating question for topic: {topic_name}" )
	messages = []
	messages.append( {
		"role": "system",
		"content": question_generator_system_prompt()
	} )
	for question in previous_questions:
		messages.append( {
			"role": "assistant",
			"content": f"Previously generated question: {question}"
		} )
	messages.append( {
		"role": "user",
		"content": question_generator_user_prompt( topic_name, topic_description, concept_name )
	} )
	return run_chat_json(
		model="gpt-4o-mini",
		messages=messages,
		validator=lambda ai_response: validate_question_generator_response( ai_response ),
		response_format=AI_GenQuestions
	)

def validate_question_generator_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response, AI_GenQuestions ):
		raise ValueError( "Invalid response for AI_GenQuestions" )

def generate_question_concepts( concepts, questions ):
	print( f"Creating concepts for questions" )
	return run_chat_json(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": concept_filter_system_prompt()
			},
			{
				"role": "user",
				"content": concept_filter_user_prompt( concepts, questions )
			}
		],
		validator=lambda ai_response: validate_topic_generator_response( ai_response ),
		response_format=AI_QuestionsConcepts
	)

def run_chat_json( model, messages, validator, response_format=None, retry_json=True ):
	try:
		client = OpenAI()
		if response_format is None:
			completion = client.chat.completions.create(
				model=model,
				messages=messages,
				#temperature=1.2
			)
			message = completion.choices[ 0 ].message.content
		else:
			completion = client.beta.chat.completions.parse(
				model=model,
				messages=messages,
				response_format=response_format
			)
			message = completion.choices[ 0 ].message
			print( "*****************************" )
			if( message.refusal ):
				raise ValueError( message.refusal )
			else:
				return message.parsed
		try:
			ai_response = json.loads( message )
		except json.JSONDecodeError as e:
			print( "****** JSON ERROR ********" )
			print( "Model:", model )
			print( "Messages:", messages )
			print( "Raw AI response:", message )
			if retry_json:
				corrected_response = run_chat_json(
					model="gpt-4o",
					messages=[
						{
							"role": "system",
							"content": json_validator_system_prompt()
						},
						{
							"role": "user",
							"content": json_validator_user_prompt( message )
						}
					],
					validator=validator,
					retry_json=False
				)
				return corrected_response
			raise ValueError( "The AI response is not valid JSON: " + str( e ) )
		
		validator( ai_response )
		ai_response[ "status" ] = "success"
		
		return ai_response

	except ( json.JSONDecodeError, ValueError ) as e:
		print( f"Error: {e}" )
		return {
			"status": "error",
			"message": str( e )
		}
	except Exception as e:
		print( f"Error evaluating topic: {e}" )
		return {
			"status": "error",
			"message": "An error occurred while processing the message."
		}
