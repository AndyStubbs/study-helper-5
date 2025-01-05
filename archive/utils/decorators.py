# utils/decorators.py
from django.http import Http404
from functools import wraps

def restrict_to_view( view_name=None ):
	"""Decorator to restrict access to specific views via AJAX with a specified view name."""
	
	def decorator( view_func ):
		@wraps( view_func )
		def _wrapped_view( request, *args, **kwargs ):
			if view_name and request.headers.get( "X-Requested-View" ) != view_name:
				raise Http404()
			return view_func( request, *args, **kwargs )
		return _wrapped_view
	return decorator
