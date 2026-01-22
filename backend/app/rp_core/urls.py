from django.urls import path
from . import views


urlpatterns = [
    # path("health/", views.health, name="health"),
    # path("samples/", views.samples, name="samples"),
    # path("map/", views.map_config, name="map-config"),
    path("rewards/account/", views.reward_account, name="reward-account"),
    path("rewards/items/", views.list_exchange_items, name="exchange-items"),
    path("rewards/redeem/", views.redeem_reward, name="redeem-reward"),
    path("rewards/my-redemptions/", views.user_redemptions, name="user-redemptions"),
    path("incident-reports/", views.incident_reports, name="incident-reports"),
    path("incident-reports/<int:report_id>/vote/", views.incident_report_vote, name="incident-report-vote"),
    
    # Admin Reward Management
    path("admin/rewards/", views.admin_rewards, name="admin-rewards"),
    path("admin/rewards/<int:reward_id>/", views.admin_reward_detail, name="admin-reward-detail"),
    path("admin/profile/", views.admin_profile, name="admin-profile"),
]
