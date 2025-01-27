from django.urls import path
from . import views

urlpatterns = [
	path("register/", views.register_user, name="register-user"),
	path("login/", views.login_user, name="cookie_token_obtain_pair"),
	path("check-auth/", views.check_auth, name="check-auth"),
	path("token-refresh/", views.refresh_token, name="token_refresh"),
	path("logout/", views.logout_user, name="logout"),
	path("delete-user/", views.delete_user, name="delete-user"),
]
