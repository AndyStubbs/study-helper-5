from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser( AbstractUser ):
	username = models.CharField( max_length=320, unique=True )
	email = models.EmailField( unique=True )
	is_verified = models.BooleanField( default=False )
	
	def __str__( self ):
		return self.username
