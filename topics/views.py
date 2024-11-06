# topics/views.py
import json
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from utils.decorators import restrict_to_view
from services.ai_services import evaluate_topic, summarize_topic

# Create your views here.

@restrict_to_view( "topics:prompt" )
def prompt( request ):
	context = {
		"prompt_message": "What topic would you like to study?"
	}
	return render( request, "topics/prompt.html", context )

@csrf_exempt
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
def summarize( request ):
	if request.method == "POST":
		data = json.loads( request.body )
		topic = data.get( "topic", "" )
		if topic == "":
			return JsonResponse( { "error": "Invalid request" }, status=400 )
		ai_response = summarize_topic( topic )
		if ai_response[ "status" ] == "error":
			return JsonResponse( { "error": "Internal Server Error" }, status=500 )
		return JsonResponse( ai_response )
	else:
		return JsonResponse( { "error": "Invalid request" }, status=400 )
