from django.contrib import admin

from django.contrib import admin
from .models import AppUser, Contact, OfficialEmergencyNumber

@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'phone_number', 'is_emergency')
    search_fields = ('name', 'phone_number')
    list_filter = ('is_emergency')

@admin.register(OfficialEmergencyNumber)
class OfficialEmergencyNumberAdmin(admin.ModelAdmin):
    list_display = ('id', 'country_code', 'service_type', 'phone_number')
    search_fields = ('country_code', 'service_type', 'phone_number')
