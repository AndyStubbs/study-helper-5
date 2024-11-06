# topics/urls.py

from django.urls import path
from . import views

app_name = "topics"

urlpatterns = [
	path( "prompt/", views.prompt, name="prompt" ),
	path( "process/", views.process, name="process" ),
	path( "summarize/", views.summarize, name="summarize" ),
]
