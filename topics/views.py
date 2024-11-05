# topics/views.py
import json
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from utils.decorators import restrict_to_view

# Create your views here.

@restrict_to_view( "topics:prompt" )
def prompt( request ):
	context = {
		"prompt_message": "What would you like to study today?"
	}
	return render( request, "topics/prompt.html", context )

@csrf_exempt
def process( request ):
	if request.method == "POST":
		data = json.loads( request.body )
		topic = data.get( "topic", "" )
		msg = f"Topic: {topic} recieved"
		return JsonResponse( { "response": msg } )
	else:
		return JsonResponse( { "error": "Invalid request" }, status=400 )
