# users/urls.py

from django.urls import path
from . import views


urlpatterns = [

	# HTML Templates
	path( "loginmodal/", views.loginmodal, name="loginmodal" ),

	# AJAX Requests
	path( "userdata/", views.userdata, name="userdata" ),
	path( "register/", views.register, name="register" ),
	path( "login/", views.loginuser, name="login" ),

]
