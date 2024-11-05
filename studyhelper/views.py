# studyhelper_project/views.py
from django.shortcuts import render


def homepage(request):
	# Fetch recent topics, proficiency data, and AI insights
	welcome_message = "Hello User!"

	context = {
		"welcome_message": welcome_message,
	}

	return render( request, "homepage.html", context )
