from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
	help = "Clear all non-superuser users from the database."

	def handle(self, *args, **kwargs):
		deleted_count, _ = User.objects.filter(is_superuser=False).delete()
		self.stdout.write(f"Deleted {deleted_count} non-superuser users.")
