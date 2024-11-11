# topics/views.py

import json
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from utils.decorators import restrict_to_view
from apps.topics.models import Topic
from apps.topics.services import (
	get_next_question,
	get_topic_evaluation,
	save_topic,
	get_topic_description
)

# Create your views here.

@restrict_to_view( "topics:generate" )
@login_required
def generate( request ):
	"""Render the HTML for the Topic Generator tab"""
	context = {
		"prompt_message": "What topic would you like to study?"
	}
	return render( request, "topics/generate.html", context )

@restrict_to_view( "topics:topics" )
@login_required
def topics( request ):
	"""Render the HTML for the Topics tab"""
	topics = Topic.objects.filter( user=request.user )
	context = {
		"topics": topics
	}
	for topic in topics:
		topic.truncated = " ".join( topic.description.split()[ :60 ] ).strip()
		topic.is_truncated = False
		if len( topic.truncated ) < len( topic.description ):
			topic.truncated += "..."
			topic.is_truncated = True
	return render( request, "topics/topics.html", context )

@restrict_to_view( "topics:quiz" )
@login_required
def quiz( request ):
	"""Render the HTML for the quiz modal popup"""
	return render( request, "topics/quiz.html" )

@csrf_exempt
@login_required
def question( request ):
	"""Gets a question for the quiz modal popup"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", "" )
			if topic_id == "" or not topic_id.isdigit():
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			topic_id = int( topic_id )
			question_data = get_next_question( topic_id )
			if question_data[ "status" ] == "error":
				return JsonResponse( { "error": "Internal Server Error" }, status=500 )
			return JsonResponse( question_data )
		except Exception as e:
			print( f"Error generating question topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@csrf_exempt
@login_required
def evaluate( request ):
	"""Gets topic title suggestions and topic description"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" )
			if topic_name == "":
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = get_topic_evaluation( topic_name )
			if response[ "status" ] == "error":
				return JsonResponse( { "error": "Internal Server Error" }, status=500 )
			return JsonResponse( response )
		except Exception as e:
			print( f"Error evaluating topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error evaluating topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@csrf_exempt
@login_required
def summarize( request ):
	"""Get a topic description"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic", "" ).strip()
			if topic_name == "":
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = get_topic_description( topic_name )
			if response[ "status" ] == "error":
				return JsonResponse( { "error": "Internal Server Error" }, status=500 )
			return JsonResponse( response )
		except Exception as e:
			print( f"Error summarizing topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error summarizing topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@csrf_exempt
@login_required
def save( request ):
	"""Save a topic to the database"""
	if request.method == "POST":
		try:
			print( "SAVING TOPIC" )
			data = json.loads( request.body )
			topic_name = data.get( "name", "" ).strip()
			topic_description = data.get( "description", "" ).strip()
			if not topic_name or not topic_description:
				return JsonResponse( {
					"error": "Invalid request. Both topic and description are required."
				}, status=400 )

			topic_response = save_topic( topic_name, topic_description, request.user )
			return JsonResponse( topic_response )
		
		except json.JSONDecodeError as e:
			print( f"Error saving topic: {e}" )
			return JsonResponse( { "error": "Invalid JSON format" }, status=400 )
		except Exception as e:
			print( f"Error saving topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error saving topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

