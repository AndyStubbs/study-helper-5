import random
import string
import os

def generate_random_username():
	return "user_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=8))

def add_security_headers(response):
	response["X-Content-Type-Options"] = "nosniff"
	if os.environ.get("DJANGO_ENV") == "production":
		response["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
	response["Referrer-Policy"] = "no-referrer"
	return response