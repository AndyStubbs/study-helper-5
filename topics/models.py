# topics/models.py

from django.db import models
from users.models import CustomUser

class Topic( models.Model ):
	name = models.CharField( max_length=100 )
	description = models.TextField( blank=True, null=True )
	user = models.ForeignKey( CustomUser, on_delete=models.SET_NULL, null=True, blank=True )
	last_studied = models.DateTimeField( null=True, blank=True )

	def __str__(self):
		return self.name
