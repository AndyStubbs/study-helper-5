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

def sanitize_topic_data( topic_data ):
	"""
	Sanitizes a topic_data to ensure it has the proper settings.

	Args:
		topic_data (dict): Dictionary containing settings
	
	Returns:
		str: The sanitized topic_data.
	"""

	# Topic_data can be None
	if topic_data is None:
		return None

	# If attachments is not in topic
	if "attachments" not in topic_data and "settings" not in topic_data:
		return None
	
	attachments = []
	settings = {}

	# Make sure attachments is an array of strings
	if "attachments" in topic_data:
		attachments = list( filter(
			lambda a: isinstance( a, str ),  topic_data[ "attachments" ]
		) )
	
	# Make sure settings is a dictionary with the proper settings
	if "settings" in topic_data and isinstance( topic_data[ "settings" ], dict ):
		all_settings = [
			"document-frequency", "mcq-frequency", "non-document-frequency",
			"open-text-frequency", "tf-frequency"
		]
		default_settings = {
			"mcq-frequency": 70,
			"tf-frequency": 20,
			"open-text-frequency": 10,
			"document-frequency": 50,
			"non-document-frequency": 50
		}

		# Make sure the settings are set and valid otherwise set to default value
		for setting in all_settings:
			if setting in topic_data[ "settings" ]:
				setting_data = topic_data[ "settings" ][ setting ]
				if isinstance( setting_data, int ):
					settings[ setting ] = max( min( setting_data, 100 ), 0 )
				else:
					settings[ setting ] = default_settings[ setting ]
			else:
				settings[ setting ] = default_settings[ setting ]
	
	# Return the santized topic_data
	return {
		"attachments": attachments,
		"settings": settings
	}