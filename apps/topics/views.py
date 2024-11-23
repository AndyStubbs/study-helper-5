# topics/views.py

# TODOS:
# 1. Switch use GET instead of POST for all getters.
# 2. Use Django’s logging module for better error logging.

import json
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

##################
# HTML COMPONENTS
##################

@restrict_to_view( "topics:generate" )
@login_required
def generate( request ):
	"""Render the HTML for the Topic Generator tab"""
	context = {
		"prompt_message": "What topic would you like to study?"
	}
	return render( request, "topics/generate.html", context )

@restrict_to_view( "topics:topics" )
@login_required
def topics( request ):
	"""Render the HTML for the Topics tab"""
	topics = models.Topic.objects.filter( user=request.user ).order_by( "name" )
	context = {
		"topics": topics
	}
	return render( request, "topics/topics.html", context )

@restrict_to_view( "topics:quiz" )
@login_required
def quiz( request ):
	"""Render the HTML for the quiz modal popup"""
	return render( request, "topics/quiz.html" )

@restrict_to_view( "topics:explanation" )
@login_required
def explanation( request ):
	"""Render the HTML for the explanation modal popup"""
	return render( request, "topics/explain.html" )

@restrict_to_view( "topics:historytab" )
@login_required
def historytab( request ):
	"""Render the HTML for the history tab"""
	return render( request, "topics/history.html" )

@restrict_to_view( "topics:qd" )
@login_required
def qd( request ):
	"""Render the HTML for the question-details modal popup"""
	return render( request, "topics/question-details.html" )

@restrict_to_view( "topics:documentselector" )
@login_required
def documentselector( request ):
	"""Render the HTML for the document-selector modal popup"""
	return render( request, "topics/document-selector.html" )

@restrict_to_view( "topics:topicsettings" )
@login_required
def topicsettings( request ):
	"""Render the HTML for the topic-settings modal popup"""
	return render( request, "topics/topic-settings.html" )


##################
# AJAX API'S
##################

@login_required
def question( request ):
	"""Gets a question for the quiz modal popup"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", -1 )
			if not isinstance( topic_id, int ) or topic_id == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			topic_id = int( topic_id )
			response = services.get_next_question( topic_id )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error generating question topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def question2( request ):
	"""Gets a question for the quiz modal popup by questionId"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			if not isinstance( question_id, int ) or question_id == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			question_id = int( question_id )
			response = services.get_question_by_id( question_id )
			return JsonResponse( {
				"status": "success",
				"data": response
			} )
		except Exception as e:
			print( f"Error generating question topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def answer( request ):
	"""Submit an answer from from the user"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			answer = data.get( "answer", "" )
			if( question_id == -1 ):
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.set_answer( request.user, question_id, answer )
			print( "************************" )
			print( response )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error setting answer: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error generating question: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def evaluate( request ):
	"""Gets topic title suggestions and topic description"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" )
			if topic_name == "":
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.get_topic_evaluation( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error evaluating topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error evaluating topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def summarize( request ):
	"""Get a topic description"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" ).strip()
			if topic_name == "":
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.get_topic_description( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error summarizing topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error summarizing topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def suggest( request ):
	"""Get a topic suggestions"""
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			topic_name = data.get( "topic_name", "" ).strip()
			if topic_name == "":
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.get_topic_suggestions( topic_name )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error suggesting topics: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error suggesting topics: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def save( request ):
	"""Save a topic to the database"""
	if request.method == "POST":
		try:
			print( "SAVING TOPIC" )
			data = json.loads( request.body )
			
			# Extract and validate inputs
			topic_name = data.get( "topic_name", "" ).strip()
			topic_description = data.get( "topic_description", "" ).strip()
			topic_data = data.get( "topic_data", {} )
			
			if not topic_name or not topic_description:
				return JsonResponse( {
					"error": "Invalid request. Both topic name and description are required."
				}, status=400 )

			if not isinstance( topic_data, dict ):
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
				return JsonResponse( {
					"error": f"Invalid keys in topic_data: {', '.join(invalid_keys)}"
				}, status=400 )

			# Save topic using the service
			response = services.save_topic(
				topic_name,
				topic_description,
				request.user,
				topic_data
			)

			return JsonResponse( {"status": "success", "data": response} )
		except Exception as e:
			print(f"Error saving topic: {e}")
			return JsonResponse({"error": str(e)}, status=500)
	else:
		print(f"Error saving topic: Wrong request method: {request.method}")
		return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def delete( request ):
	"""Delete a topic to the database"""
	if request.method == "POST":
		try:
			print( "DELETING TOPIC" )
			data = json.loads( request.body )
			topic_id = data.get( "topic_id", -1 )
			if not isinstance( topic_id, int ) or topic_id == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.delete_topic( topic_id, request.user )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error deleting topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error deleting topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def explain( request ):
	"""Explain a topic"""
	if request.method == "POST":
		try:
			print( "EXPLAIN TOPIC" )
			data = json.loads( request.body )
			question_id = data.get( "question_id", -1 )
			if not isinstance( question_id, int ) or question_id == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			response = services.explain_topic( question_id, request.user )
			return JsonResponse( { "status": "success", "data": response } )
		except Exception as e:
			print( f"Error explaining topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error explaining topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def history( request ):
	"""Fetch all questions answered by the user"""
	if request.method == "POST":
		try:
			print( "GETTING HISTORY FOR USER" )
			questions_data = services.get_question_history( request.user )
			return JsonResponse( { "status": "success", "data": questions_data } )
		except Exception as e:
			print( f"Error getting history: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error getting history: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def uploaddoc( request ):
	if request.method == "POST":
		if not request.FILES.get( "file" ):
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
		print( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def getalldocs( request ):
	if request.method == "POST":
		try:
			document_names = []
			docs = models.Document.objects.filter( user=request.user ).order_by( "name" )
			for doc in docs:
				document_names.append( doc.name )
			return JsonResponse( { "data": document_names } )
		except Exception as e:
			print( f"Error retrieving documents: {e}" )
			return JsonResponse( {"error": str(e)}, status=500 )
	else:
		print( f"Error retrieving documents: Wrong request method: {request.method}" )
		return JsonResponse( {"error": "Invalid request"}, status=400 )

@login_required
def previewdoc( request ):
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
			print( f"Error uploading doc: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

@login_required
def deletedoc( request ):
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
		print( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )
