# topics/views.py

import os
import json
import mimetypes
from django.http import JsonResponse, FileResponse, HttpResponseForbidden
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from utils.decorators import restrict_to_view
from apps.topics.models import Topic
from apps.topics import services
from services import sanity

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
	topics = Topic.objects.filter( user=request.user ).order_by( "name" )
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
			topic_name = data.get( "topic_name", "" ).strip()
			topic_description = data.get( "topic_description", "" ).strip()
			if not topic_name or not topic_description:
				return JsonResponse( {
					"error": "Invalid request. Both topic and description are required."
				}, status=400 )
			response = services.save_topic( topic_name, topic_description, request.user )
			return JsonResponse( { "status": "success",	"data": response } )
		except Exception as e:
			print( f"Error saving topic: {e}" )
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error saving topic: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

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

			# Make sure the users folder exists
			user_folder = os.path.join( settings.MEDIA_ROOT, "uploads", str( request.user.id ) )
			os.makedirs( user_folder, exist_ok=True )

			# Get the filename
			file_name = sanity.sanitize_filename( uploaded_file.name )
			file_path = os.path.join( "uploads", str( request.user.id ), file_name )

			# If the file already exists, delete it to override
			if default_storage.exists( file_path ):
				default_storage.delete( file_path )
			
			# Save the file to storage
			saved_path = default_storage.save( file_path, ContentFile( uploaded_file.read() ) )

			return JsonResponse( {
				"name": uploaded_file.name,
				"path": saved_path,
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
			# Path to the user's upload directory
			user_folder = os.path.join( settings.MEDIA_ROOT, "uploads", str( request.user.id ) )

			# Ensure the directory exists
			if not os.path.exists( user_folder ):
				return JsonResponse( { "data": [] } )

			# Get all file names in the user's directory
			document_names = []
			docs = os.listdir( user_folder )
			for doc in docs:
				if os.path.isfile( os.path.join( user_folder, doc ) ):
					document_names.append( doc )

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
			data = json.loads( request.body )
			name = data.get( "name", -1 )
			if not isinstance( name, str ) or name == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			
			# Get the filename
			file_name = sanity.sanitize_filename( name )
			file_path = os.path.join( "uploads", str( request.user.id ), file_name )

			# Get the preview
			preview = services.get_file_preview( file_path )

			response = {
				"name": name,
				"preview": preview
			}
			print( response )
			return JsonResponse( { "data": response } )
		except Exception as e:
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )


@login_required
def deletedoc( request ):
	if request.method == "POST":
		try:
			data = json.loads( request.body )
			file_name = data.get( "name", -1 )
			print( file_name )
			if not isinstance( file_name, str ) or file_name == -1:
				return JsonResponse( { "error": "Invalid request" }, status=400 )
			
			# Get the filename
			file_name = sanity.sanitize_filename( file_name )
			file_path = os.path.join( "uploads", str( request.user.id ), file_name )
			if default_storage.exists( file_path ):
				default_storage.delete( file_path )
			
			return JsonResponse( {
				"status": "success"
			} )
		except Exception as e:
			return JsonResponse( { "error": str( e ) }, status=500 )
	else:
		print( f"Error uploading doc: Wrong request method: {request.method}" )
		return JsonResponse( { "error": "Invalid request" }, status=400 )

##################
# USER FILES
##################

@login_required
def serve_user_file( request, user_id, file_name ):

	# Make sure user is owner of this file - return file not found if not owner
	if request.user.id != int( user_id ):
		return JsonResponse( { "error": "File not found" }, status=404 )

	# Get the file
	file_path = os.path.join( settings.MEDIA_ROOT, "uploads", user_id, file_name )
	if not os.path.exists( file_path ):
		return JsonResponse( { "error": "File not found" }, status=404 )

	mime_type, _ = mimetypes.guess_type( file_path )
	return FileResponse( open( file_path, "rb" ), content_type=mime_type )