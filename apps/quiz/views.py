# apps/quiz/views.py

from django.shortcuts import render
from utils.decorators import restrict_to_view

# Create your views here.

@restrict_to_view( "quiz" )
def quiz( request ):
	return render( request, "quiz/quiz.html" )
