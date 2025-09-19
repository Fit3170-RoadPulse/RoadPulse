from django.contrib import admin
from django.urls import path
from rp_core.views import health, samples, map

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/map/", map),
    path("api/health/", health),
    path("api/samples/", samples),
]

