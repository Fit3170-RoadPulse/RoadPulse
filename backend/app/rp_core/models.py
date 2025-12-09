from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models import Q, F


# Custom user model
class AppUser(AbstractUser):
    email = models.EmailField(unique=True)
    reward_points = models.PositiveIntegerField(
        default=0,
        help_text="Points available for redeeming rewards.",
    )

    def __str__(self):
        return self.username


# Emergency contact for a user
class Contact(models.Model):
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="contacts"
    )
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.CharField(max_length=50, blank=True, null=True)
    is_emergency = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.relationship})"


# Official emergency numbers by country and service type
class OfficialEmergencyNumber(models.Model):
    country_code = models.CharField(max_length=5)
    service_type = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("country_code", "service_type")

    def __str__(self):
        return f"{self.service_type} - {self.country_code}: {self.phone_number}"


# Reward exchange items
class ExchangeItem(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    points_cost = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Leave blank for unlimited redemptions.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Meta options
    class Meta:
        ordering = ["name"] # default ordering
        indexes = [models.Index(fields=["is_active", "name"])] # for active item queries

    def __str__(self):
        return f"{self.name} ({self.points_cost} pts)"

    def has_stock(self, quantity=1):
        if self.stock is None:
            return True
        return self.stock >= quantity


# Reward redemption records
class RewardRedemption(models.Model):
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="reward_redemptions",
    )
    item = models.ForeignKey(
        ExchangeItem,
        on_delete=models.PROTECT,
        related_name="redemptions",
    )
    quantity = models.PositiveIntegerField(default=1)
    points_spent = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Meta options
    class Meta:
        ordering = ["-created_at"] # recent first

    def __str__(self):
        return f"{self.user} redeemed {self.quantity} x {self.item}"
    

# Incident reports queryset with geolocation and expiry
class IncidentReportQuerySet(models.QuerySet):
    def active(self):
        now = timezone.now()
        return self.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))


# Incident report model
class IncidentReport(models.Model):
    # Report types
    class ReportType(models.TextChoices):
        ACCIDENT = "ACCIDENT", "Accident"
        HAZARD = "HAZARD", "Hazard"
        WEATHER = "WEATHER", "Weather"
        CRIME = "CRIME", "Crime"
        OTHER = "OTHER", "Other"

    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    description = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    reporter = models.ForeignKey(
        AppUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_reports"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(blank=True, null=True, db_index=True)

    objects = IncidentReportQuerySet.as_manager()

    # Meta options
    class Meta:
        ordering = ["-created_at"] # recent first
        indexes = [models.Index(fields=["latitude", "longitude"])] # for geo queries
        constraints = [
            models.CheckConstraint(
                name="lat_range",
                check=Q(latitude__gte=-90) & Q(latitude__lte=90)
            ),
            models.CheckConstraint(
                name="lng_range",
                check=Q(longitude__gte=-180) & Q(longitude__lte=180)
            ),
            models.CheckConstraint(
                name="expiry_after_created",
                check=Q(expires_at__isnull=True) | Q(expires_at__gte=F("created_at"))
            ),
        ]

    # Override save to set default expiry if not provided
    def save(self, *args, **kwargs):
        creating = self._state.adding
        # First save: let Django set created_at
        if creating and self.expires_at is None:
            super().save(*args, **kwargs)
            # Now created_at is set; compute expiry
            self.expires_at = self.created_at + timedelta(minutes=1)
            # Persist just the expiry to avoid recursion and extra writes
            super().save(update_fields=["expires_at"])
            return
        # Normal path (updates, or expires_at provided explicitly)
        super().save(*args, **kwargs)

    def __str__(self):
        who = self.reporter.username if self.reporter_id else "anonymous"
        return f"{self.get_report_type_display()} @({self.latitude}, {self.longitude}) by {who}"

    @property
    def is_active(self):
        return self.expires_at is None or self.expires_at > timezone.now()
