import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class CustomPasswordValidator:
	MIN_PASS_LENGTH = 8
	MAX_PASS_LENGTH = 256
	PASSWORD_REGEX = re.compile(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]")

	def validate(self, password, user=None):
		errors = []

		# Check length
		if len(password) < self.MIN_PASS_LENGTH:
			errors.append(f"Missing {self.MIN_PASS_LENGTH - len(password)} character(s).")
		if len(password) > self.MAX_PASS_LENGTH:
			errors.append("Password is too long.")

		# Check character requirements
		if not re.search(r"[a-z]", password):
			errors.append("Missing lowercase letter.")
		if not re.search(r"[A-Z]", password):
			errors.append("Missing uppercase letter.")
		if not re.search(r"[0-9]", password):
			errors.append("Missing number.")
		if not self.PASSWORD_REGEX.search(password):
			errors.append("Missing special character.")

		if errors:
			raise ValidationError(_("Invalid password: " + " ".join(errors)))

	def get_help_text(self):
		return _(
			f"Your password must be between {self.MIN_PASS_LENGTH} and {self.MAX_PASS_LENGTH} "
			"characters, and include at least one lowercase letter, one uppercase letter, one "
			"number, and one special character."
		)
