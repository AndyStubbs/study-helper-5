# topics/urls.py

from django.urls import path
from . import views

app_name = "topics"

urlpatterns = [
	path( "generate/", views.generate, name="generate" ),
	path( "topics/", views.topics, name="topics" ),
	path( "quiz/", views.quiz, name="quiz" ),
	path( "question/", views.question, name="question" ),
	path( "process/", views.process, name="process" ),
	path( "summarize/", views.summarize, name="summarize" ),
	path( "save/", views.save, name="save" ),
]
