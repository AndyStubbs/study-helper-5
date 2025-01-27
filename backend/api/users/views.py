from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from users.utils import add_security_headers
from users.services import (
	register_user_service,
	login_user_service,
	check_auth_service,
	refresh_token_service,
	logout_user_service,
	delete_user_service,
)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
	response = add_security_headers(register_user_service(request))
	return add_security_headers(response)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
	response = login_user_service(request)
	return add_security_headers(response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
	response = check_auth_service(request)
	return add_security_headers(response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
	response = logout_user_service(request)
	return add_security_headers(response)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
	response = refresh_token_service(request)
	return add_security_headers(response)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request):
	response = delete_user_service(request)
	return add_security_headers(response)
