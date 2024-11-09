# topics/views.py
import json
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from utils.decorators import restrict_to_view
from services.ai_services import (
	evaluate_topic,
	summarize_topic,
	create_question
)
from apps.topics.models import Topic

# Create your views here.

@restrict_to_view( "topics:generate" )
@login_required
def generate( request ):
	context = {
		"prompt_message": "What topic would you like to study?"
	}
	return render( request, "topics/generate.html", context )

@restrict_to_view( "topics:topics" )
@login_required
def topics( request ):
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
	return render( request, "topics/quiz.html" )

@csrf_exempt
@login_required
def question( request ):
	if request.method == "POST":
		data = json.loads( request.body )
		topic_id = data.get( "topic_id", "" )
		if topic_id == "" or not topic_id.isdigit():
			return JsonResponse( { "error": "Invalid request" }, status=400 )
		topic_id = int( topic_id )
		topic = Topic.objects.filter( id=topic_id ).first()
		question_data = create_question( topic.name, topic.description )
		if question_data[ "status" ] == "error":
			return JsonResponse( { "error": "Internal Server Error" }, status=500 )
		return JsonResponse( question_data )
"""
{
	"text": "What is 1 + 2?",
	"concepts": [ "addition" ],
	"answers": [ "1", "2", "3", "4" ],
	"correct": "3"
}
"""

@csrf_exempt
@login_required
def process( request ):
	if request.method == "POST":
		data = json.loads( request.body )
		topic = data.get( "topic", "" )
		if topic == "":
			return JsonResponse( { "error": "Invalid request" }, status=400 )
		ai_response = evaluate_topic( topic )
		if ai_response[ "status" ] == "error":
			return JsonResponse( { "error": "Internal Server Error" }, status=500 )
		return JsonResponse( ai_response )
	else:
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@csrf_exempt
@login_required
def summarize( request ):
	if request.method == "POST":
		data = json.loads( request.body )
		topic = data.get( "topic", "" ).strip()
		if topic == "":
			return JsonResponse( { "error": "Invalid request" }, status=400 )
		ai_response = summarize_topic( topic )
		if ai_response[ "status" ] == "error":
			return JsonResponse( { "error": "Internal Server Error" }, status=500 )
		return JsonResponse( ai_response )
	else:
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@csrf_exempt
@login_required
def save( request ):
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic", "" ).strip()
			description = data.get( "description", "" ).strip()

			if not topic_name or not description:
				return JsonResponse( {
					"error": "Invalid request. Both topic and description are required."
				}, status=400 )

			# Check if the topic already exists
			existing_topic = Topic.objects.filter( name=topic_name ).first()

			if existing_topic:
				existing_topic.description = description
				existing_topic.save()
				return JsonResponse( {
					"status": "success",
					"message": "Topic description updated successfully",
					"topic_id": existing_topic.id
				} )
			else:
				# If the topic does not exist, create a new topic
				topic = Topic.objects.create(
					name=topic_name,
					description=description,
					user=request.user if request.user.is_authenticated else None
				)
				return JsonResponse( {
					"status": "success",
					"message": "Topic saved successfully",
					"topic_id": topic.id
				} )

		except json.JSONDecodeError:
			return JsonResponse( { "error": "Invalid JSON format" }, status=400 )
		except Exception as e:
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		return JsonResponse( { "error": "Invalid request" }, status=400 )

