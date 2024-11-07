# apps/about/views.py

from django.shortcuts import render
from utils.decorators import restrict_to_view

# Create your views here.

@restrict_to_view( "about" )
def about( request ):
	return render( request, "about/about.html" )
