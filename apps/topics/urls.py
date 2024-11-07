# topics/urls.py

from django.urls import path
from . import views

app_name = "topics"

urlpatterns = [
	path( "generate/", views.generate, name="generate" ),
	path( "process/", views.process, name="process" ),
	path( "summarize/", views.summarize, name="summarize" ),
]
