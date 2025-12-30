from django.contrib import admin
from django.urls import path
from rp_core.views import health, samples, map, RegisterView, LoginView
from django.urls import path, include
from rp_core.views import health, samples, map_config, RegisterView, LoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/map/", map),
    path("api/health/", health),
    path("api/samples/", samples),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/", include("rp_core.urls")),
    path("api/register/", RegisterView.as_view(), name="register"),
]
