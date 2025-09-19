from django.contrib import admin
from django.urls import path
from rp_core.views import health, samples, MapView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("map/", MapView.as_view()),
    path("api/health/", health),
    path("api/samples/", samples),
]

