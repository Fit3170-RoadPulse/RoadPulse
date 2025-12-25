from django.contrib import admin
from django.urls import path,  include
from rp_core.views import health, samples, map, map_config, locationData, compute_route, RegisterView, LoginView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/map/", map),
    path("api/map/location/", locationData),
    path("api/health/", health),
    path("api/samples/", samples),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/", include("rp_core.urls")),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/map/compute-route/",compute_route,name="compute-route")
]
