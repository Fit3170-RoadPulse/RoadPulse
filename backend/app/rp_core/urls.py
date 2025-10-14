from django.urls import path
from . import views


urlpatterns = [
    path("map/", views.map_config),
    path("health/", views.health),
    path("samples/", views.samples),
]
