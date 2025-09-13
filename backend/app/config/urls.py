from django.contrib import admin
from django.urls import path
from rp_core.views import health, samples

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/samples/", samples),
]

