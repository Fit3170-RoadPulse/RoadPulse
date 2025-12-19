from django.urls import path
from . import views


urlpatterns = [
    # path("health/", views.health, name="health"),
    # path("samples/", views.samples, name="samples"),
    # path("map/", views.map_config, name="map-config"),
    path("rewards/account/", views.reward_account, name="reward-account"),
    path("rewards/items/", views.list_exchange_items, name="exchange-items"),
    path("rewards/redeem/", views.redeem_reward, name="redeem-reward"),
    path("incident-reports/", views.incident_reports, name="incident-reports"),
]
