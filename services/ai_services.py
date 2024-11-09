# services/ai_services.py

import json
from openai import OpenAI
from .ai_prompts import (
	topic_evaluator_system_prompt,
	topic_evaluator_user_prompt,
	topic_summary_system_prompt,
	topic_summary_user_prompt,
	question_generator_user_prompt,
	question_generator_system_prompt,
	json_validator_system_prompt,
	json_validator_user_prompt
)


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
		validator=lambda ai_response: validate_topic_response( ai_response )
	)

def validate_topic_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response.get("summary"), str ):
		raise ValueError( "The 'summary' field must be a string." )
	if (
		not isinstance( ai_response.get( "suggestions" ), list ) or
		not all( isinstance( item, str ) for item in ai_response[ "suggestions" ] )
	):
		raise ValueError( "The 'suggestions' field must be a list of strings." )

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
		validator=lambda ai_response: validate_summary_response( ai_response )
	)

def create_question( topic_name, topic_description ):
	return run_chat_json(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": question_generator_system_prompt()
			},
			{
				"role": "user",
				"content": question_generator_user_prompt( topic_name, topic_description )
			}
		],
		validator=lambda ai_response: validate_question_generator_response( ai_response )
	)

def validate_question_generator_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response.get( "text" ), str ):
		raise ValueError( "The 'text' field must be a string." )
	if (
		not isinstance( ai_response.get( "concepts" ), list ) or
		not all( isinstance( item, str ) for item in ai_response[ "concepts" ] )
	):
		raise ValueError( "The 'concepts' field must be a list of strings." )
	if (
		not isinstance( ai_response.get( "answers" ), list ) or
		not all( isinstance( item, str ) for item in ai_response[ "answers" ] )
	):
		raise ValueError( "The 'answers' field must be a list of strings." )
	if not isinstance( ai_response.get( "correct" ), str ):
		raise ValueError( "The 'correct' field must be a string." )

def validate_summary_response( ai_response ):
	"""Validates the structure of the AI response."""
	if not isinstance( ai_response.get("summary"), str ):
		raise ValueError( "The 'summary' field must be a string." )

def run_chat_json( model, messages, validator, retry_json=True ):
	try:
		client = OpenAI()
		completion = client.chat.completions.create(
			model=model,
			messages=messages
		)
		message = completion.choices[ 0 ].message.content
		
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
			"message": "An error occurred while processing the topic."
		}
