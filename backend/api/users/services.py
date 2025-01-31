import logging
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.response import Response
from django.conf import settings
from users.utils import generate_random_username

logger = logging.getLogger(__name__)

def register_user_service(request):
	data = request.data
	try:
		email = data.get("email")
		password = data.get("password")

		if not email or not password:
			return Response({"error": "Email and password are required."}, status=400)

		try:
			EmailValidator()(email)
			validate_password(password)
		except ValidationError as e:
			return Response({"error": str(e)}, status=400)

		if User.objects.filter(email=email).exists():
			return Response({"error": "Email is already registered."}, status=400)

		# Generate a unique random username
		username = generate_random_username()
		while User.objects.filter(username=username).exists():
			username = generate_random_username()
		
		User.objects.create_user(username=username, email=email, password=password)
		return Response({"message": "Registration successful."}, status=201)
	except Exception as e:
		logger.error(f"Error registering user: {str(e)}")
		return Response({"error": "An error occurred during registration."}, status=500)

def login_user_service(request):
	email = request.data.get('email')
	password = request.data.get('password')

	print(f"Email: {email} Password: {password}")
	if not email or not password:
		return Response({"error": "Email and password are required."}, status=400)

	try:
		user = User.objects.get(email=email)
	except User.DoesNotExist:
		return Response({"error": "Invalid email or password."}, status=401)

	user = authenticate(username=user.username, password=password)
	if not user:
		return Response({"error": "Invalid email or password."}, status=401)

	refresh = RefreshToken.for_user(user)
	access = refresh.access_token

	response = Response({"message": "Login successful"})
	response.set_cookie(
		settings.SIMPLE_JWT['AUTH_COOKIE'],
		str(access),
		httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
		secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
		samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
		max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
	)
	response.set_cookie(
		settings.SIMPLE_JWT['REFRESH_COOKIE'],
		str(refresh),
		httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
		secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
		samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
		max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
	)
	return response

def check_auth_service(request):
	token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
	if not token:
		return Response({"is_authenticated": False, "error": "No token found."}, status=401)

	try:
		validated_token = AccessToken(token)
		return Response({
			"is_authenticated": True,
			"username": request.user.username,
			"email": request.user.email,
			"token_exp": validated_token.get("exp"),
		})
	except Exception as e:
		logger.error(f"Authentication error: {str(e)}")
		return Response({"is_authenticated": False, "error": "Invalid or expired token."}, status=401)

def refresh_token_service(request):
	refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_COOKIE'])
	if not refresh_token:
		return Response({"error": "Refresh token not found in cookies."}, status=400)

	try:
		# Decode and refresh the token
		token = RefreshToken(refresh_token)
		access_token = str(token.access_token)

		# If ROTATE_REFRESH_TOKENS=True, issue a new refresh token
		new_refresh_token = str(token)

		# Create response with new access token
		response = Response({"message": "Token refreshed successfully"})
		response.data['access'] = access_token
		response.data['token_exp'] = AccessToken(access_token).get("exp")

		# Set access token in cookie
		response.set_cookie(
			settings.SIMPLE_JWT['AUTH_COOKIE'],
			access_token,
			httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
			secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
			samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
			max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
		)

		# Set new refresh token in cookie
		response.set_cookie(
			settings.SIMPLE_JWT['REFRESH_COOKIE'],
			new_refresh_token,
			httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
			secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
			samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
			max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
		)

		return response
	except Exception as e:
		logger.error(f"Error refreshing token: {str(e)}")
		return Response({"error": "Invalid or expired refresh token."}, status=401)

def logout_user_service(request):
	response = Response({"message": "Logout successful"})
	response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
	response.delete_cookie(settings.SIMPLE_JWT['REFRESH_COOKIE'])
	return response

def delete_user_service(request):
	user = request.user
	try:
		user.delete()
		response = Response(status=204)
		response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
		response.delete_cookie(settings.SIMPLE_JWT['REFRESH_COOKIE'])
		return response
	except Exception as e:
		logger.error(f"Error deleting user: {str(e)}")
		return Response({"error": "An error occurred during account deletion."}, status=500)
