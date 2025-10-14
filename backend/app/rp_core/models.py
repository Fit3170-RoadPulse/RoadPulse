from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models import Q, F


class AppUser(AbstractUser):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username


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

class OfficialEmergencyNumber(models.Model):
    country_code = models.CharField(max_length=5)
    service_type = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("country_code", "service_type")

    def __str__(self):
        return f"{self.service_type} - {self.country_code}: {self.phone_number}"
    

class IncidentReportQuerySet(models.QuerySet):
    def active(self):
        now = timezone.now()
        return self.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))


class IncidentReport(models.Model):
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

    reporter = models.ForeignKey(AppUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="incident_reports")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(blank=True, null=True, db_index=True)

    objects = IncidentReportQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["latitude", "longitude"])]
        constraints = [
            models.CheckConstraint(name="lat_range", check=Q(latitude__gte=-90) & Q(latitude__lte=90)),
            models.CheckConstraint(name="lng_range", check=Q(longitude__gte=-180) & Q(longitude__lte=180)),
            models.CheckConstraint(name="expiry_after_created", check=Q(expires_at__isnull=True) | Q(expires_at__gte=F("created_at"))),
        ]

    def __str__(self):
        who = self.reporter.username if self.reporter_id else "anonymous"
        return f"{self.get_report_type_display()} @({self.latitude}, {self.longitude}) by {who}"

    @property
    def is_active(self):
        return self.expires_at is None or self.expires_at > timezone.now()
