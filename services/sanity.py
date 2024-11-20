import os
import re
import unicodedata

def sanitize_filename( filename ):
	"""
	Sanitizes a filename to ensure it's safe and filesystem-compliant.

	Args:
		filename (str): The original filename.
	
	Returns:
		str: The sanitized filename.
	"""
	# Normalize the filename to remove special Unicode characters
	filename = unicodedata.normalize( "NFKD", filename )
	filename = filename.encode( "ascii", "ignore" ).decode( "ascii" )

	# Remove invalid characters (anything except alphanumeric, dot, dash, and underscore)
	filename = re.sub( r'[^\w\.\-_]', '_', filename )

	# Prevent directory traversal attacks by stripping leading/trailing slashes and dots
	filename = filename.strip( "." ).strip( "/" ).strip( "\\" )

	# Limit the filename length to 255 characters (common filesystem limit)
	max_length = 255
	base, ext = os.path.splitext( filename )
	if len( filename ) > max_length:
		filename = base[ : max_length - len( ext )] + ext

	return filename
