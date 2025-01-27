from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
	help = "List all users in the database"

	def handle(self, *args, **kwargs):
		users = User.objects.all()
		if users.exists():
			self.stdout.write(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Superuser':<10}")
			self.stdout.write("-" * 65)
			for user in users:
				self.stdout.write(
					f"{user.id:<5} {user.username:<20} {user.email:<30} {user.is_superuser:<10}"
				)
		else:
			self.stdout.write("No users found.")
