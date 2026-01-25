from django.urls import path
from . import views


urlpatterns = [
    # path("health/", views.health, name="health"),
    # path("samples/", views.samples, name="samples"),
    # path("map/", views.map_config, name="map-config"),
    path("rewards/account/", views.reward_account, name="reward-account"),
    path("profile/update/", views.update_profile, name="update-profile"),
    path("rewards/items/", views.list_exchange_items, name="exchange-items"),
    path("rewards/redemptions/", views.list_user_redemptions, name="user-redemptions"),
    path("rewards/redemptions/<int:redemption_id>/redeem/", views.mark_voucher_redeemed, name="mark-voucher-redeemed"),
    path("rewards/redeem/", views.redeem_reward, name="redeem-reward"),
    path("incident-reports/", views.incident_reports, name="incident-reports"),
    path("incident-reports/<int:report_id>/vote/", views.incident_report_vote, name="incident-report-vote"),
    
    # Admin Reward Management
    path("admin/rewards/", views.admin_rewards, name="admin-rewards"),
    path("admin/rewards/<int:reward_id>/", views.admin_reward_detail, name="admin-reward-detail"),
    path("admin/profile/", views.admin_profile, name="admin-profile"),
]
