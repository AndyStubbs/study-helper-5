# studyhelper_project/views.py
from django.shortcuts import render


def homepage(request):
	welcome_message = "Your AI-assisted study companion"
	context = {
		"welcome_message": welcome_message,
	}

	return render( request, "homepage.html", context )
