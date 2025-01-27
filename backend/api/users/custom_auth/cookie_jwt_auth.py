from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
	def authenticate(self, request):
		header = self.get_header(request)
		raw_token = None

		# Attempt to extract the token from the cookie
		if 'access_token' in request.COOKIES:
			raw_token = request.COOKIES['access_token']
		elif header:
			raw_token = self.get_raw_token(header)

		if raw_token is None:
			return None

		validated_token = self.get_validated_token(raw_token)
		return self.get_user(validated_token), validated_token
