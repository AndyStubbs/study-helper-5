# topics/views.py

import json
import logging
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from utils.decorators import restrict_to_view
from apps.topics import models
from apps.topics import services
from services import sanity

##################
# Globals
##################

MAX_FILE_SIZE_MB = 30
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

# Set up logger
logger = logging.getLogger( __name__ )

##################
# HTML COMPONENTS
##################

@restrict_to_view( "topics:generate" )
def generate( request ):
	"""Render the HTML for the Topic Generator tab"""
	return render( request, "topics/generate.html" )

@restrict_to_view( "topics:topics" )
def topics( request ):
	"""Render the HTML for the Topics tab"""
	return render( request, "topics/topics.html" )

@restrict_to_view( "topics:quiz" )
def quiz( request ):
	"""Render the HTML for the quiz modal popup"""
	return render( request, "topics/quiz.html" )

@restrict_to_view( "topics:explanation" )
def explanation( request ):
	"""Render the HTML for the explanation modal popup"""
	return render( request, "topics/explain.html" )

@restrict_to_view( "topics:historytab" )
def historytab( request ):
	"""Render the HTML for the history tab"""
	return render( request, "topics/history.html" )

@restrict_to_view( "topics:qd" )
def qd( request ):
	"""Render the HTML for the question-details modal popup"""
	return render( request, "topics/question-details.html" )

@restrict_to_view( "topics:documentselector" )
def documentselector( request ):
	"""Render the HTML for the document-selector modal popup"""
	return render( request, "topics/document-selector.html" )

@restrict_to_view( "topics:topicsettings" )
def topicsettings( request ):
	"""Render the HTML for the topic-settings modal popup"""
	return render( request, "topics/topic-settings.html" )


##################
# AJAX API'S
##################

def getalltopics( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to getalltopics." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	logger.info( "Fetching topics for user." )
	if request.method == "POST":
		try:
			topics = []
			topics_data = models.Topic.objects.filter( user=request.user ).order_by( "name" )
			for topic in topics_data:
				topics.append( {
					"id": topic.id,
					"name": topic.name,
					"description": topic.description
				} )
			logger.debug( f"Retrieved {len(topics)} topics for user {request.user.id}." )
			return JsonResponse( { "status": "success", "data": topics } )
		except Exception as e:
			logger.error( f"Error getting topics: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error getting topics: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def getsettings( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to getsettings." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	logger.info( "Fetching settings for topic." )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", -1 )
			if not isinstance( topic_id, int ) or topic_id == -1:
				logger.error( f"Get topic by id missing for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			
			# Fetch the topic
			topic = get_object_or_404(models.Topic, id=topic_id, user=request.user)

			# Return the topic_data
			logger.info( f"Successfully fetched settings for topic {topic.name}." )
			return JsonResponse( { "status": "success", "data": topic.topic_data } )
		except Exception as e:
			logger.error( f"Error getting settings: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error getting settings: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def question( request ):
	"""Gets a question for the quiz modal popup"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to question endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", -1 )
			if not isinstance( topic_id, int ) or topic_id == -1:
				logger.error( f"Create question missing topic_id for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			topic_id = int( topic_id )
			logger.debug( f"Create question for topic ID {topic_id} for user {request.user.id}." )
			response = services.get_next_question( topic_id )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error generating question topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.warning( f"Invalid request method for question: {request.method}." )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def question2( request ):
	"""Gets a question by id for the quiz modal popup by questionId"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to question2 endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			if not isinstance( question_id, int ) or question_id == -1:
				logger.error( f"Get question by id missing for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			question_id = int( question_id )
			logger.debug(
				f"Get question by id for question ID {question_id} for user {request.user.id}."
			)
			response = services.get_question_by_id( question_id )
			return JsonResponse( {
				"status": "success",
				"data": response
			} )
		except Exception as e:
			logger.error( f"Error generating question topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.warning( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def answer( request ):
	"""Submit an answer from from the user"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to answer endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			answer = data.get( "answer", "" )
			if( question_id == -1 ):
				logger.error( f"Submit answer missing question id for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Submit answer for quetion {question_id} for user {request.user.id}." )
			response = services.set_answer( request.user, question_id, answer )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error setting answer: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def evaluate( request ):
	"""Gets topic title suggestions and topic description"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to evaluate endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" )
			if topic_name == "":
				logger.error( f"Evaluate topic missing topic_name for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Evaluate topic for {topic_name} for user {request.user.id}." )
			response = services.get_topic_evaluation( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error evaluating topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error evaluating topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def summarize( request ):
	"""Get a topic description"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to summarize endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" ).strip()
			if topic_name == "":
				logger.error( f"Summarize topic missing topic_name for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Get topic description for {topic_name} for user {request.user.id}." )
			response = services.get_topic_description( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error summarizing topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error summarizing topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def suggest( request ):
	"""Get a topic suggestions"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to suggest endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" ).strip()
			if topic_name == "":
				logger.error( f"Suggest topic missing topic_name for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Suggest for {topic_name} for user {request.user.id}." )
			response = services.get_topic_suggestions( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error suggesting topics: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error suggesting topics: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def save( request ):
	"""Save a topic to the database"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to save endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			
			# Extract and validate inputs
			topic_name = data.get( "topic_name", "" ).strip()
			topic_description = data.get( "topic_description", "" ).strip()
			topic_data = data.get( "topic_data", {} )
			
			if not topic_name or not topic_description:
				logger.error( f"Save topic missing topic details for user {request.user.id}." )
				return JsonResponse( {
					"error": "Invalid request. Both topic name and description are required."
				}, status=400 )

			if not isinstance( topic_data, dict ):
				logger.error( f"Save topic topic_data is invalid for user {request.user.id}." )
				return JsonResponse( {
					"error": "Invalid request. 'topic_data' must be a dictionary."
				}, status=400 )

			# Optional: Validate specific keys in topic_data
			data_keys = [ "attachments", "settings" ]
			invalid_keys = [
				key for key in topic_data.keys()
				if key not in data_keys
			]

			if invalid_keys:
				logger.error( f"Save topic data_keys is invalid for user {request.user.id}." )
				return JsonResponse( {
					"error": f"Invalid keys in topic_data: {', '.join(invalid_keys)}"
				}, status=400 )

			logger.debug( f"Saving topic for {topic_name} for user {request.user.id}." )

			# Save topic using the service
			response = services.save_topic(
				topic_name,
				topic_description,
				request.user,
				topic_data
			)

			# Sanitize and format response data
			response_data = {
				"id": response[ "id" ],
				"name": response[ "name" ],
				"description": response[ "description" ],
				"data": response[ "data" ]
			}

			return JsonResponse( { "status": "success", "data": response_data } )
		except Exception as e:
			logger.error( f"Error saving topic: {e}" )
			return JsonResponse( {"error": str(e)}, status=500 )
	else:
		logger.error( f"Error saving topic: Wrong request method: {request.method}" )
		return JsonResponse( {"error": "Invalid request"}, status=400 )

def delete( request ):
	"""Delete a topic to the database"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to delete endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", -1 )
			if not isinstance( topic_id, int ) or topic_id == -1:
				logger.error( f"Delete topic missing topic_id for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Deleting topic {topic_id} for user {request.user.id}." )
			response = services.delete_topic( topic_id, request.user )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			logger.error( f"Error deleting topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error deleting topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def explain( request ):
	"""Explain a question and answer"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to explain endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			if not isinstance( question_id, int ) or question_id == -1:
				logger.error( f"Explain question missing question for user {request.user.id}." )
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			logger.debug( f"Explain question {question_id} for user {request.user.id}." )
			response = services.explain_topic( question_id, request.user )
			return JsonResponse( { "status": "success", "data": response } )
		except Exception as e:
			logger.error( f"Error explaining topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error explaining topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def history( request ):
	"""Fetch all questions answered by the user"""
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to history endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			questions_data = services.get_question_history( request.user )
			logger.debug( f"Getting question history for user {request.user.id}." )
			return JsonResponse( { "status": "success", "data": questions_data } )
		except Exception as e:
			logger.error( f"Error getting history: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error getting history: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def uploaddoc( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to uploaddoc endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		if not request.FILES.get( "file" ):
			logger.error( f"Upload doc missing doc for user {request.user.id}." )
			return JsonResponse( { "error": "Invalid request" }, status=400 )
		try:
			
			uploaded_file = request.FILES[ "file" ]
			if uploaded_file.size > MAX_FILE_SIZE:
				raise ValueError( f"File size exceeds {MAX_FILE_SIZE_MB} MB limit" )
			file_name = sanity.sanitize_filename( uploaded_file.name )
			services.store_document( request.user, file_name, uploaded_file )
			return JsonResponse( {
				"name": file_name
			} )
		except Exception as e:
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def getalldocs( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to getalldocs endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			document_names = []
			docs = models.Document.objects.filter( user=request.user ).order_by( "name" )
			for doc in docs:
				document_names.append( doc.name )
			return JsonResponse( { "data": document_names } )
		except Exception as e:
			logger.error( f"Error retrieving documents: {e}" )
			return JsonResponse( {"error": str(e)}, status=500 )
	else:
		logger.error( f"Error retrieving documents: Wrong request method: {request.method}" )
		return JsonResponse( {"error": "Invalid request"}, status=400 )

def previewdoc( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to previewdoc endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			# Parse user request and get the filename
			data = json.loads( request.body )
			name = data.get( "name", -1 )
			if not isinstance( name, str ) or name == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			file_name = sanity.sanitize_filename( name )

			# Get the preview
			document = get_object_or_404( models.Document, name=file_name, user=request.user )
			preview = document.chunks.order_by( "id" ).first()
			if preview:
				preview_text = preview.text
			else:
				preview_text = "No preview vailable"

			# Return the respons
			response = {
				"name": name,
				"preview": preview_text
			}
			return JsonResponse( { "data": response } )
		except Exception as e:
			logger.error( f"Error uploading doc: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

def deletedoc( request ):
	if not request.user.is_authenticated:
		logger.warning( "Unauthenticated access to deletedoc endpoint." )
		return JsonResponse( {"error": "Authentication required"}, status=403 )
	if request.method == "POST":
		try:
			# Parse user request and get the filename
			data = json.loads( request.body )
			name = data.get( "name", -1 )
			if not isinstance( name, str ) or name == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			file_name = sanity.sanitize_filename( name )

			# Delete the document
			document = get_object_or_404( models.Document, name=file_name, user=request.user )
			document.delete()
			
			return JsonResponse( {
				"status": "success"
			} )
		except Exception as e:
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		logger.error( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )
