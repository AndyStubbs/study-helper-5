# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Register CustomUser with the admin site
admin.site.register( CustomUser, UserAdmin )
