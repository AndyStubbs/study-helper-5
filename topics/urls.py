# topics/urls.py

from django.urls import path
from . import views

app_name = "topics"

urlpatterns = [
	path( "start/", views.topic_prompt, name="start_study_session"),
]
