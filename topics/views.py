# topics/views.py
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render

# Create your views here.

def prompt( request ):
	if not request.headers.get( "X-Requested-View" ) == "topics:prompt":
		return HttpResponseForbidden( "This view can only be accessed via AJAX." )
	
	context = {
		"prompt_message": "What would you like to study today?"
	}
	return render( request, "topics/prompt.html", context )
