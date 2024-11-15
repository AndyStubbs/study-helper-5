# topics/views.py

import json
from django.db.models import F, Value
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from utils.decorators import restrict_to_view
from apps.topics.models import Topic, Question
from apps.topics import services


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
	for topic in topics:
		topic.truncated = " ".join( topic.description.split()[ :60 ] ).strip()
		topic.is_truncated = False
		if len( topic.truncated ) < len( topic.description ):
			topic.truncated += "..."
			topic.is_truncated = True
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

##################
# AJAX API'S
##################

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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

@csrf_exempt
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
