from django.test import TestCase, Client
from django.contrib.auth.models import User
import json


class RegisterUserTests( TestCase ):
	def setUp( self ):
		# Set up a test client
		self.client = Client()
		self.register_url = "/api/users/register/"
	
	def test_register_user_success( self ):
		"""Test registering a user with valid data"""
		payload = {
			"email": "testuser@example.com",
			"password": "StrongPass123!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 201 )
		self.assertEqual( response.json()[ "message" ], "User registered successfully." )
		self.assertTrue( User.objects.filter( email = "testuser@example.com" ).exists() )
	
	def test_register_user_missing_fields( self ):
		"""Test registering a user with missing fields"""
		payload = {
			"email": "testuser@example.com"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertEqual( response.json()[ "error" ], "All fields are required." )
	
	def test_register_user_duplicate_email( self ):
		"""Test registering a user with a duplicate username"""
		User.objects.create_user(
			username = "testabcuser", email = "test@example.com", password = "Password123!"
		)
		payload = {
			"email": "test@example.com",
			"password": "StrongPass123!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertEqual( response.json()[ "error" ], "Email is already registered." )
	
	def test_register_user_invalid_email( self ):
		"""Test registering a user with an invalid email"""
		payload = {
			"email": "invalidemail",
			"password": "StrongPass123!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertEqual( response.json()[ "error" ], "Invalid email format." )
	
	def test_register_user_weak_password_no_lowercase( self ):
		"""Test registering a user with a password missing a lowercase letter"""
		payload = {
			"email": "testuser@example.com",
			"password": "STRONGPASS123!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Missing lowercase letter.", response.json()[ "error" ] )
	
	
	def test_register_user_weak_password_no_uppercase( self ):
		"""Test registering a user with a password missing an uppercase letter"""
		payload = {
			"email": "testuser@example.com",
			"password": "weakpass123!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Missing uppercase letter.", response.json()[ "error" ] )
	
	
	def test_register_user_weak_password_no_number( self ):
		"""Test registering a user with a password missing a number"""
		payload = {
			"email": "testuser@example.com",
			"password": "WeakPass!!!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Missing number.", response.json()[ "error" ] )
	
	
	def test_register_user_weak_password_no_special_character( self ):
		"""Test registering a user with a password missing a special character"""
		payload = {
			"email": "testuser@example.com",
			"password": "WeakPass123"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Missing special character.", response.json()[ "error" ] )
	
	
	def test_register_user_password_too_short( self ):
		"""Test registering a user with a password that is too short"""
		payload = {
			"email": "testuser@example.com",
			"password": "Wp1!"
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Missing 4 character(s).", response.json()[ "error" ] )
	
	
	def test_register_user_password_too_long( self ):
		"""Test registering a user with a password that is too long"""
		payload = {
			"email": "testuser@example.com",
			"password": "W" * 257
		}
		response = self.client.post(
			self.register_url,
			data = json.dumps( payload ),
			content_type = "application/json"
		)
		self.assertEqual( response.status_code, 400 )
		self.assertIn( "Password is too long.", response.json()[ "error" ] )
