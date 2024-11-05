from django.shortcuts import render

# Create your views here.

def topic_prompt( request ):
	context = {
		"prompt_message": "What would you like to study today?"
	}
	return render( request, "topics/topic_prompt.html", context )
