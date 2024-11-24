from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.shortcuts import render
from django.http import JsonResponse
from utils.decorators import restrict_to_view


@restrict_to_view( "users:loginmodal" )
def loginmodal( request ):
	"""Render the HTML for the Login Modal"""
	return render( request, "users/login.html" )


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
	if request.method == "POST":
		email = request.POST.get( "email" )
		password = request.POST.get( "password" )

		# Make sure email doesn't already exists
		if User.objects.filter( email=email ).exists():
			return JsonResponse( { "data": { "success": False } }, status=400 )
		
		# Create a new user
		user = User.objects.create_user( username=email, email=email, password=password )
		user.save()

		# Login User
		user = authenticate( request, email=email, password=password )
		if user is not None:
			login( request, user )
			return JsonResponse( { 
				"data": {
					"success": True,
					"userdata": userdata( request )
				}
			 } )
	return JsonResponse( { "data": { "success": False } }, status=400 )

def login( request ):
	if request.method == "POST":
		email = request.POST.get("email")
		password = request.POST.get("password")

		user = authenticate( request, email=email, password=password )
		if user is not None:
			login( request, user )
			return JsonResponse( { 
				"data": {
					"success": True,
					"userdata": userdata( request )
				}
			 } )
	return JsonResponse( { "data": { "success": False } }, status=400 )
