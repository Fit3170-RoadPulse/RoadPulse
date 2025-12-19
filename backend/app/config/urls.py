from django.contrib import admin
from django.urls import path, include
from rp_core.views import health, samples, map, RegisterView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/map/", map),
    path("api/health/", health),
    path("api/samples/", samples),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/", include("rp_core.urls")),
]
