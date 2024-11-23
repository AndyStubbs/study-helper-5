# topics/models.py

import re
from django.db import models
from apps.users.models import CustomUser
from django.utils import timezone


class Topic( models.Model ):
	name = models.CharField( max_length=100 )
	description = models.TextField( max_length=1000, blank=True, null=True )
	# User is linked to the topic because if we were to share topics amonts users than another
	# user could potentially change the description
	user = models.ForeignKey( CustomUser, on_delete=models.SET_NULL, null=True, blank=True )
	concepts = models.ManyToManyField( "Concept", related_name="topics", blank=True )
	last_studied = models.DateTimeField( null=True, blank=True )
	topic_data = models.JSONField(
		default=dict,
		help_text="Store custom settings like question type and source frequencies as JSON."
	)
	def __str__( self ):
		return self.name

class Concept( models.Model ):
	name = models.CharField( max_length=300 )
	normalized_name = models.CharField( max_length=300, editable=False )

	def save( self, *args, **kwargs ):
		self.normalized_name = self.normalize_concept_name( self.name )
		super().save( *args, **kwargs )
	
	@staticmethod
	def normalize_concept_name( name ):
		return re.sub( r"[^a-zA-Z]", "", name ).lower()
	
	def __str__( self ):
		return self.name

class Question( models.Model ):
	topic = models.ForeignKey( Topic, on_delete=models.CASCADE, related_name="questions" )
	text = models.CharField( max_length=300 )
	details = models.TextField( max_length=1000, blank=True, null=True )
	is_open = models.BooleanField(
		default=False,
		help_text="Indicates if the question is an open-ended question (not multiple choice)."
	)
	is_code = models.BooleanField(
		default=False,
		help_text="Indicates if the question involves coding."
	)
	language_class = models.CharField(
		max_length=50,
		blank=True,
		help_text="Programming language class for code highlighting, e.g., 'language-python'."
	)
	boilerplate = models.TextField(
		blank=True,
		help_text="Boilerplate code provided as a starting point if this is a coding question."
	)
	source = models.TextField(
		max_length=1000,
		blank=True,
		help_text="Additional details added for the source of the question."
	)
	answers = models.JSONField( help_text="Store answers as a JSON array" )
	correct = models.CharField( max_length=100, help_text="Text of the correct answer" )
	concepts = models.ManyToManyField( "Concept", related_name="questions", blank=True )
	main_concept = models.ForeignKey(
		"Concept",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="main_concept_questions",
		help_text="The main concept on which this question was generated"
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

class Explanation( models.Model ):
	question = models.OneToOneField(
		Question,
		on_delete=models.CASCADE,
		related_name="explanation",
		help_text="The question that this explanation is linked to."
	)
	text = models.TextField( help_text="Detailed explanation for the question." )

	def __str__(self):
		return f"Explanation for Question ID: {self.question.id}"

class UserKnowledge( models.Model ):
	user = models.ForeignKey(
		CustomUser,
		on_delete=models.CASCADE,
		related_name="knowledge_records"
	)
	topic = models.ForeignKey(
		Topic,
		on_delete=models.CASCADE,
		related_name="knowledge_records"
	)
	concept = models.ForeignKey(
		Concept,
		on_delete=models.CASCADE,
		related_name="knowledge_records"
	)
	correct_points = models.PositiveIntegerField(
		default=0,
		help_text="Points awarded for correct answers"
	)
	wrong_points = models.PositiveIntegerField(
		default=0,
		help_text="Points deducted for wrong answers"
	)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=[ "user", "topic", "concept" ],
				name="unique_user_topic_concept"
			)
		]

	def __str__( self ):
		return (
			f"{self.user} - {self.topic} - {self.concept} "
			f"(Correct Points: {self.correct_points}, Wrong Points: {self.wrong_points})"
		)

class Document( models.Model ):
	name = models.CharField( max_length=256 )
	user = models.ForeignKey( CustomUser, on_delete=models.SET_NULL, null=True, blank=True )
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ( "name", "user" )
	
	def __str__(self):
		return f"Document: {self.name} (User: {self.user})"

class Chunk( models.Model ):
	document = models.ForeignKey( Document, on_delete=models.CASCADE, related_name="chunks" )
	text = models.TextField( max_length=1000, blank=True, null=True )

	def __str__(self):
		return f"Chunk: {self.text[:30]}... (Document: {self.document.name})"
