from django.contrib import admin
from .models import AppUser, Contact, OfficialEmergencyNumber, IncidentReport


@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'phone_number', 'is_emergency')
    search_fields = ('name', 'phone_number')
    list_filter = ('is_emergency',)


@admin.register(OfficialEmergencyNumber)
class OfficialEmergencyNumberAdmin(admin.ModelAdmin):
    list_display = ('id', 'country_code', 'service_type', 'phone_number')
    search_fields = ('country_code', 'service_type', 'phone_number')


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    list_display  = ('id', 'report_type', 'latitude', 'longitude', 'reporter', 'created_at', 'expires_at', 'active_flag')
    list_filter   = ('report_type', 'created_at', 'expires_at')
    search_fields = ('description', 'reporter__username')
    readonly_fields = ('created_at',)

    @admin.display(boolean=True, description="Active", ordering="expires_at")
    def active_flag(self, obj):
        return obj.is_active
