from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    AppUser,
    Contact,
    ExchangeItem,
    IncidentReport,
    IncidentReportVote,
    OfficialEmergencyNumber,
    RewardRedemption,
    PointTransaction,
    Event,
    SavedDestination
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'event_date', 'created_by', 'is_active')
    search_fields = ('title', 'location')
    list_filter = ('is_active', 'event_date')


@admin.register(AppUser)
class AppUserAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'reward_points', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    
    # Show deletion confirmation with related objects
    actions = ['safe_delete_users']
    
    def safe_delete_users(self, request, queryset):
        """Delete users with error handling to show exceptions in UI"""
        success_count = 0
        for user in queryset:
            try:
                username = user.username
                user.delete()
                success_count += 1
            except Exception as e:
                self.message_user(request, f"Error deleting {username}: {str(e)}", level='error')
        
        if success_count > 0:
            self.message_user(request, f"Successfully deleted {success_count} users.", level='success')
    safe_delete_users.short_description = "Safe delete selected users (Debug)"
    
    # Fields to display when editing an existing user
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('reward_points', 'cumulative_distance')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to display when creating a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
        ('Personal Info', {
            'fields': ('reward_points', 'cumulative_distance'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    ordering = ('email',)
    
    def get_deleted_objects(self, objs, request):
        """Override to provide better deletion information"""
        try:
            return super().get_deleted_objects(objs, request)
        except Exception as e:
            # If there's an error getting deleted objects, return a safe message
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in get_deleted_objects: {e}")
            return ([], {}, set(), [])


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
    list_display  = ('id', 'report_type', 'latitude', 'longitude', 'reporter', 'status', 'yes_votes', 'no_votes', 'total_votes', 'created_at', 'expires_at', 'active_flag')
    list_filter   = ('report_type', 'status', 'created_at', 'expires_at')
    search_fields = ('description', 'reporter__username')
    readonly_fields = ('created_at',)

    @admin.display(boolean=True, description="Active", ordering="expires_at")
    def active_flag(self, obj):
        return obj.is_active


@admin.register(IncidentReportVote)
class IncidentReportVoteAdmin(admin.ModelAdmin):
    list_display = ("id", "report", "voter", "choice", "created_at")
    list_filter = ("choice", "created_at")
    search_fields = ("report__description", "voter__username")
    autocomplete_fields = ("report", "voter")


@admin.register(ExchangeItem)
class ExchangeItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'points_cost', 'stock', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(RewardRedemption)
class RewardRedemptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'item', 'quantity', 'points_spent', 'created_at')
    search_fields = ('user__username', 'item__name')
    list_filter = ('created_at',)
    autocomplete_fields = ('user', 'item')


@admin.register(PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "amount", "reason", "reference", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("user__username", "reason", "reference")
    
@admin.register(SavedDestination)
class SavedDestinationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "label", "latitude", "longitude", "address", "created_at")
    search_fields = ("user__username", "label")
    list_filter = ("created_at",)
