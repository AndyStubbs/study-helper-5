"""
Django settings for api project.

Generated by 'django-admin startproject' using Django 5.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-85@np-&k-mny()r9vomyop*#c#k%@9f7wze-r&=_g+8%ur7-0x'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'rest_framework',
	'rest_framework_simplejwt.token_blacklist',
	'corsheaders',
	"users",
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'api.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'api.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.sqlite3',
		'NAME': BASE_DIR / 'db.sqlite3',
	}
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'users.validators.CustomPasswordValidator',
	},
]

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': (
		'users.custom_auth.cookie_jwt_auth.CookieJWTAuthentication',
	),
}


SIMPLE_JWT = {
	#'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
	'ACCESS_TOKEN_LIFETIME': timedelta(minutes=1),
	'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
	'ROTATE_REFRESH_TOKENS': True,
	'BLACKLIST_AFTER_ROTATION': True,
	'AUTH_COOKIE': 'access_token',               # Name of the access token cookie
	'REFRESH_COOKIE': 'refresh_token',           # Refresh token cookie name
	'AUTH_COOKIE_SECURE': False,                 # Set to True in production (HTTPS)
	'AUTH_COOKIE_HTTP_ONLY': True,               # Ensures cookie is HTTP-only
	'AUTH_COOKIE_PATH': '/',                     # Path where the cookie is available
	'AUTH_COOKIE_SAMESITE': 'Lax',               # Controls cross-origin behavior
	'AUTH_COOKIE_DOMAIN': None,                  # Set to your domain in production
}

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
	"http://127.0.0.1:5173",  # Vite dev server
	"http://localhost:5173",  # Alternate local domain
]

CORS_EXPOSE_HEADERS = ['Content-Type', 'Authorization']

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
