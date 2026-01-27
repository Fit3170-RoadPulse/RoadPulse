from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent       
ROOT_DIR = BASE_DIR.parent.parent                       
load_dotenv(ROOT_DIR / ".env") # This will only work locally in development stage

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [h for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h]

INSTALLED_APPS = [
    "rp_core",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files in production (e.g., Render)
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST"),  # full Supabase host, no default
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "OPTIONS": {
            "sslmode": os.getenv("POSTGRES_SSLMODE", "require"),
        },
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# Incident report voting
INCIDENT_REPORT_REQUIRED_VOTES = int(os.getenv("INCIDENT_REPORT_REQUIRED_VOTES", "7"))
INCIDENT_REPORT_NO_STREAK_LIMIT = int(os.getenv("INCIDENT_REPORT_NO_STREAK_LIMIT", "3"))
INCIDENT_REPORT_FAST_REJECT_MINUTES = int(os.getenv("INCIDENT_REPORT_FAST_REJECT_MINUTES", "5"))
INCIDENT_REPORT_VOTE_RADIUS_METERS = int(os.getenv("INCIDENT_REPORT_VOTE_RADIUS_METERS", "150"))

# Incident expiry by time (minutes)
INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD", "15"))
INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT", "10"))
INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER", "30"))
INCIDENT_REPORT_EXPIRE_MINUTES_CRIME = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_CRIME", "10"))
INCIDENT_REPORT_EXPIRE_MINUTES_OTHER = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_OTHER", "20"))

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_MAPS_ID = os.getenv("GOOGLE_MAPS_ID")
AUTH_PASSWORD_VALIDATORS = []
AUTH_USER_MODEL = 'rp_core.AppUser'
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
_use_static_manifest = os.getenv("DJANGO_STATIC_MANIFEST", "0") == "1"
if _use_static_manifest:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
else:
    # Fallback that works even if collectstatic is not run on the host.
    STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
    WHITENOISE_USE_FINDERS = True
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Location configs
POLLING_INTERVAL = 1000
ENABLE_HIGH_ACCURACY = True
TIMEOUT = 8000
MAXIMUM_AGE = 15000

# Allow configuring CORS origins via env for deployments (e.g., Render)
_default_cors_origins = "http://localhost:5173,https://roadpulsefrontend.onrender.com"
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", _default_cors_origins).split(",")
    if origin.strip()
]

_default_csrf_trusted_origins = "http://localhost:5173,https://roadpulsefrontend.onrender.com"
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", _default_csrf_trusted_origins).split(",")
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True