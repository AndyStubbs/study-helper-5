# topics/models.py

from django.db import models
from apps.users.models import CustomUser
from django.utils import timezone

class Topic( models.Model ):
	name = models.CharField( max_length=100 )
	description = models.TextField( max_length=1000, blank=True, null=True )
	user = models.ForeignKey( CustomUser, on_delete=models.SET_NULL, null=True, blank=True )
	last_studied = models.DateTimeField( null=True, blank=True )

	def __str__(self):
		return self.name

class Question( models.Model ):
	topic = models.ForeignKey( Topic, on_delete=models.CASCADE, related_name="questions" )
	text = models.CharField( max_length=500 )
	answers = models.JSONField( help_text="Store answers as a JSON array" )
	correct = models.CharField( max_length=100, help_text="Text of the correct answer" )
	concepts = models.CharField(
		max_length=300,
		help_text="Comma-separated list of core concepts related to the question"
	)
	correct_count = models.PositiveIntegerField(
		default=0,
		help_text="Number of times the user has correctly answered this question"
	)
	wrong_count = models.PositiveIntegerField(
		default=0,
		help_text="Number of times user answered this question wrongly"
	)
	skip_count = models.PositiveIntegerField(
		default=0,
		help_text="Number of times the skipped this question"
	)
	last_asked = models.DateTimeField(
		null=True,
		blank=True,
		help_text="The last time this question was answered"
	)

	def question_rank( self ):
		"""Calculates a weighted score for prioritizing question selection."""
		
		# Weighting for question rank
		base_score = 100
		recency_factor = 1
		wrong_answer_weight = 2
		skip_weight = 1.5

		if self.correct_count > 0:
			base_score /= ( self.correct_count + 1 )
		if self.wrong_count > 0:
			base_score *= ( self.wrong_count * wrong_answer_weight )
		if self.skip_count > 0:
			base_score *= ( self.skip_count * skip_weight )

		if self.last_asked:
			days_since_asked = ( timezone.now() - self.last_asked ).days + 1
			recency_factor = 1 / days_since_asked

		return base_score * recency_factor

	def __str__( self ):
		return f"{self.text} - Topic: {self.topic.name}"
