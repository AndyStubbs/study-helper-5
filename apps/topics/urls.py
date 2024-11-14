# topics/urls.py

from django.urls import path
from . import views

app_name = "topics"

urlpatterns = [
	path( "generate/", views.generate, name="generate" ),
	path( "topics/", views.topics, name="topics" ),
	path( "quiz/", views.quiz, name="quiz" ),
	path( "qd/", views.qd, name="qd" ),
	path( "question/", views.question, name="question" ),
	path( "question2/", views.question2, name="question2" ),
	path( "answer/", views.answer, name="answer" ),
	path( "evaluate/", views.evaluate, name="evaluate" ),
	path( "summarize/", views.summarize, name="summarize" ),
	path( "suggest/", views.suggest, name="suggest" ),
	path( "save/", views.save, name="save" ),
	path( "delete/", views.delete, name="delete" ),
	path( "explain/", views.explain, name="explain" ),
	path( "explanation/", views.explanation, name="explanation" ),
	path( "history/", views.history, name="history" ),
	path( "historytab/", views.historytab, name="historytab" ),
]
