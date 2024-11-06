# services/ai_services.py

import json
from openai import OpenAI
from .ai_prompts import topic_evaluator_system_prompt, topic_evaluator_user_prompt


def evaluate_topic( topic ):
	"""Evaluates the topic and offer suggestions."""
	try:
		client = OpenAI()
		completion = client.chat.completions.create(
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
			]
		)
		message = completion.choices[ 0 ].message.content
		ai_response = json.loads( message )

		# Validate ai_response json is formatted correctly
		if not isinstance( ai_response.get("summary"), str ):
			raise ValueError( "The 'summary' field must be a string." )
		if (
			not isinstance( ai_response.get( "suggestions" ), list ) or
			not all( isinstance( item, str ) for item in ai_response[ "suggestions" ] )
		):
			raise ValueError( "The 'suggestions' field must be a list of strings." )

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
