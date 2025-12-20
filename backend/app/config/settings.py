from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent       # .../backend/app
ROOT_DIR = BASE_DIR.parent.parent                       # .../RoadPulse
load_dotenv(ROOT_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
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
        "ENGINE": "django.db.backends.postgresql",  # switch to postgis engine later if needed
        "NAME": os.getenv("POSTGRES_DB", "roadpulse"),
        "USER": os.getenv("POSTGRES_USER", "roadpulse"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "roadpulse"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),  # 'db' if backend runs in Docker
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
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

# Incident expiry by time (minutes)
INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD", "15"))
INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT", "10"))
INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER", "30"))
INCIDENT_REPORT_EXPIRE_MINUTES_CRIME = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_CRIME", "10"))
INCIDENT_REPORT_EXPIRE_MINUTES_OTHER = int(os.getenv("INCIDENT_REPORT_EXPIRE_MINUTES_OTHER", "20"))

AUTH_PASSWORD_VALIDATORS = []
AUTH_USER_MODEL = 'rp_core.AppUser'
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
GOOGLE_MAPS_API_KEY="AIzaSyBdbRFLLwPTNe7RR9zahjksLOHovFjGM-M"
GOOGLE_MAPS_ID = "9f96fc85ced76649d1bf190d"
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
