# topics/views.py
import json
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from utils.decorators import restrict_to_view
from services.ai_services import evaluate_topic, summarize_topic
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
	return render( request, "topics/topics.html", context )

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

