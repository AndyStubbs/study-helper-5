from django.shortcuts import render

# Create your views here.

def prompt( request ):
	context = {
		"prompt_message": "What would you like to study today?"
	}
	return render( request, "topics/prompt.html", context )
