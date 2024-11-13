# services/ai_services.py
from pydantic import BaseModel
from openai import OpenAI
from . import ai_prompts

class AI_TopicInfo( BaseModel ):
	summary: str
	suggestions: list[ str ]

class AI_TopicSummary( BaseModel ):
	summary: str

class AI_TopicSuggestions( BaseModel ):
	suggestions: list[ str ]

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

class AI_QuestionExplanation( BaseModel ):
	explanation: str


def evaluate_topic( topic ):
	"""Evaluates the topic and offer suggestions."""
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.topic_evaluator_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.topic_evaluator_user_prompt( topic )
			}
		],
		response_format=AI_TopicInfo
	)

def summarize_topic( topic ):
	"""Summarize topic"""
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.topic_summary_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.topic_summary_user_prompt( topic )
			}
		],
		response_format=AI_TopicSummary
	)

def suggest_topics( topic_name ):
	"""Offer suggestions based on topic name."""
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.topic_suggestions_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.topic_suggestions_user_prompt( topic_name )
			}
		],
		response_format=AI_TopicSuggestions
	)

def generate_concepts( topic_name, topic_description ):
	print( f"Creating concepts for topic: {topic_name} - {topic_description}" )
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.topic_concepts_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.topic_concepts_user_prompt( topic_name, topic_description )
			}
		],
		response_format=AI_Concepts
	)

def create_questions( topic_name, topic_description, concept_name, previous_questions ):
	print( f"Creating question for topic: {topic_name}" )
	messages = []
	messages.append( {
		"role": "system",
		"content": ai_prompts.question_generator_system_prompt()
	} )
	for question in previous_questions:
		messages.append( {
			"role": "assistant",
			"content": f"Previously generated question: {question}"
		} )
	messages.append( {
		"role": "user",
		"content": ai_prompts.question_generator_user_prompt( topic_name, topic_description, concept_name )
	} )
	return run_chat(
		model="gpt-4o-mini",
		messages=messages,
		response_format=AI_GenQuestions
	)

def generate_question_concepts( concepts, questions ):
	print( f"Creating concepts for questions" )
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.concept_filter_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.concept_filter_user_prompt( concepts, questions )
			}
		],
		response_format=AI_QuestionsConcepts
	)

def explain_question( question, answer ):
	print( f"Creating explanation for question" )
	return run_chat(
		model="gpt-4o-mini",
		messages=[
			{
				"role": "system",
				"content": ai_prompts.explain_question_system_prompt()
			},
			{
				"role": "user",
				"content": ai_prompts.explain_question_user_prompt( question, answer )
			}
		],
		response_format=AI_QuestionExplanation
	)

def run_chat( model, messages, response_format ):
	try:
		client = OpenAI()
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
	except Exception as e:
		print( f"Error evaluating topic: {e}" )
		return {
			"status": "error",
			"message": "An error occurred while processing the message."
		}
