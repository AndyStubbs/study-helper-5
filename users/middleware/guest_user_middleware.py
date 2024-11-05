# users/middleware/guest_user_middleware.py

from django.contrib.auth import login
from django.utils.deprecation import MiddlewareMixin
from users.models import CustomUser

# This middleware automatically logs in a user as a guest account
class GuestUserMiddleware( MiddlewareMixin ):
	def process_request( self, request ):
		if not request.user.is_authenticated:

			# Generate session key if it doesn't exist
			if not request.session.session_key:
				request.session.create()
			
			# Create a new guest user
			guest_username = f"guest_{request.session.session_key}"
			guest_user, created = CustomUser.objects.get_or_create(
				username=guest_username,
				defaults={
					"is_guest": True,
					"first_name": "Guest"
				}
			)

			# Prevents login with this account's password
			if created:
				guest_user.set_unusable_password()
				guest_user.save()
			
			# Log the guest user in
			login( request, guest_user )
