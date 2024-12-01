import json
import os
import logging
from django.contrib.auth import logout
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.contrib.auth import authenticate, login
from django.shortcuts import render
from django.http import JsonResponse
from utils.decorators import restrict_to_view
from .models import CustomUser

logger = logging.getLogger( __name__ )

@restrict_to_view( "users:loginmodal" )
def loginmodal( request ):
	"""Render the HTML for the Login Modal"""
	context = {
		"test_user_email": os.getenv( "TEST_USER_EMAIL", "" ),
		"test_user_password": os.getenv( "TEST_USER_PASSWORD", "" )
	}
	logger.warning( f"Creating test user: {context}" )
	return render( request, "users/login.html", context )

##################
# AJAX API'S
##################

def userdata( request ):
	if request.user.is_authenticated:
		return JsonResponse( {
			"is_authenticated": True,
			"user": {
				"email": request.user.email
			},
		} )
	else:
		return JsonResponse( {
			"is_authenticated": False,
			"user": {
				"email": ""
			},
		} )

def register( request ):
	try:
		if request.method == "POST":
			data = json.loads( request.body )
			email = data.get( "email", None )
			password = data.get( "password", None )
			
			# Validate input
			if not validate_email_format( email ) or not validate_password_format( password ):
				return JsonResponse( { "data": { "success": False } }, status=400 )
			
			logger.debug( f"Creating user, Email: {email}" )

			# Make sure email doesn't already exists
			if CustomUser.objects.filter( email=email ).exists():
				logger.warning( "User already exists" )
				return JsonResponse( { "data": { "success": False } }, status=400 )
			
			# Create a new user
			user = CustomUser.objects.create_user( username=email, email=email, password=password )
			user.save()

			logger.debug( f"User: {user.email} created!" )

			# Login User
			user = authenticate( username=email, password=password )

			logger.debug( "User Logged In" )
			if user is not None:
				login( request, user )
				return JsonResponse( { 
					"data": {
						"success": True,
						"userdata": {
							"is_authenticated": True,
							"user": {
								"email": email
							}
						}
					}
				} )
			logger.error( "Unable to Authenticate User" )
		return JsonResponse( { "data": { "success": False } }, status=400 )
	except Exception as e:
		logger.error( f"Error Logging In: {e}" )
		return JsonResponse( { "error": str( e ) }, status=500 )

def loginuser( request ):
	try:
		if request.method == "POST":
			data = json.loads( request.body )
			email = data.get( "email", None )
			password = data.get( "password", None )

			# Validate input
			if not validate_email_format( email ) or not validate_password_format( password ):
				return JsonResponse( { "data": { "success": False } }, status=400 )
			
			user = authenticate( username=email, password=password )
			if user is not None:
				login( request, user )
				return JsonResponse( { 
					"data": {
						"success": True,
						"userdata": {
							"is_authenticated": True,
							"user": {
								"email": email
							}
						}
					}
				} )
		return JsonResponse( { "data": { "success": False } }, status=400 )
	except Exception as e:
		logger.error( f"Error Logging In: {e}" )
		return JsonResponse( { "error": str( e ) }, status=500 )

def logoutuser( request ):
	if request.method == "POST":
		logout( request )
		return JsonResponse( { "data": { "success": True } } )
	logger.error( f"Error Logging Out" )
	return JsonResponse( { "data": { "success": False } }, status=400 )


##################
# Helper Methods
##################

def validate_password_format( password ):
	try:
		validate_password( password )
		return True
	except Exception:
		return False

def validate_email_format( email ):
	validator = EmailValidator()
	try:
		validator( email )
		return True
	except Exception:
		return False
