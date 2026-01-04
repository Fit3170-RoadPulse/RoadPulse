from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rp_core.views import health, samples, map, map_config, locationData, compute_route, RegisterView, LoginView, ForgotPasswordView, ChangePasswordView, update_cumulative_distance
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/map/", map),
    path("api/map/location/", locationData),
    path("api/health/", health),
    path("api/samples/", samples),
    path("api/register/", RegisterView.as_view(), name="register"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/", include("rp_core.urls")),
    path("api/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("api/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("api/user/distance/", update_cumulative_distance, name="user-distance"),
    path("api/map/compute-route/",compute_route,name="compute-route")
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
