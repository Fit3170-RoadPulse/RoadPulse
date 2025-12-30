from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models import Q, F
from django.conf import settings


# Custom user model
class AppUser(AbstractUser):
    # Override username to allow duplicates
    username = models.CharField(max_length=150, unique=False)
    email = models.EmailField(unique=True)
    reward_points = models.PositiveIntegerField(
        default=0,
        help_text="Points available for redeeming rewards.",
    )
    provisional_points = models.PositiveIntegerField(
        default=0,
        help_text="Provisional points pending hazard outcomes; not spendable.",
    )
    
    # Use email as USERNAME_FIELD since Django requires it to be unique
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

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
        return self.filter(status=IncidentReport.Status.OPEN).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )


# Incident report model
class IncidentReport(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        CONFIRMED = "CONFIRMED", "Confirmed"
        REJECTED = "REJECTED", "Rejected"
        TIED = "TIED", "Tied"

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

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    ended_at = models.DateTimeField(blank=True, null=True, db_index=True)

    yes_votes = models.PositiveIntegerField(default=0)
    no_votes = models.PositiveIntegerField(default=0)
    total_votes = models.PositiveIntegerField(default=0, db_index=True)
    consecutive_no_votes = models.PositiveIntegerField(default=0)

    required_votes = models.PositiveIntegerField(default=7, help_text="Total votes required to close the report.")
    settled_at = models.DateTimeField(blank=True, null=True, db_index=True)

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
            # Now created_at is set; compute expiry (minutes vary by type)
            minutes = _expire_minutes_for_report_type(self.report_type)
            self.expires_at = self.created_at + timedelta(minutes=minutes)
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
        if self.status != self.Status.OPEN:
            return False
        return self.expires_at is None or self.expires_at > timezone.now()


def _expire_minutes_for_report_type(report_type: str) -> int:
    """
    Per-type expiry in minutes.
    Falls back to INCIDENT_REPORT_EXPIRE_HOURS (legacy) if type-specific settings are missing/invalid.
    """
    default_minutes = int(getattr(settings, "INCIDENT_REPORT_EXPIRE_HOURS", 24)) * 60
    try:
        mapping = {
            IncidentReport.ReportType.HAZARD: int(getattr(settings, "INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD", default_minutes)),
            IncidentReport.ReportType.ACCIDENT: int(getattr(settings, "INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT", default_minutes)),
            IncidentReport.ReportType.WEATHER: int(getattr(settings, "INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER", default_minutes)),
            IncidentReport.ReportType.CRIME: int(getattr(settings, "INCIDENT_REPORT_EXPIRE_MINUTES_CRIME", default_minutes)),
            IncidentReport.ReportType.OTHER: int(getattr(settings, "INCIDENT_REPORT_EXPIRE_MINUTES_OTHER", default_minutes)),
        }
        minutes = mapping.get(report_type, default_minutes)
    except Exception:
        minutes = default_minutes
    return max(1, int(minutes))


class IncidentReportVote(models.Model):
    class Choice(models.TextChoices):
        YES = "YES", "Yes"
        NO = "NO", "No"

    report = models.ForeignKey(
        IncidentReport,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    voter = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="incident_report_votes",
    )
    choice = models.CharField(max_length=3, choices=Choice.choices)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["report", "voter"], name="uniq_incident_vote_per_user"),
        ]


class IncidentProvisionalMark(models.Model):
    class Role(models.TextChoices):
        REPORTER = "REPORTER", "Reporter"
        VOTER = "VOTER", "Voter"

    report = models.ForeignKey(
        IncidentReport,
        on_delete=models.CASCADE,
        related_name="provisional_marks",
    )
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="incident_provisional_marks",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    amount = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    settled_at = models.DateTimeField(blank=True, null=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["report", "user", "role"], name="uniq_incident_provisional_mark"),
        ]


class PointTransaction(models.Model):
    class Kind(models.TextChoices):
        EARN = "EARN", "Earn"
        SPEND = "SPEND", "Spend"
         # admin/manual or corrections
        ADJUST = "ADJUST", "Adjust" 

    user = models.ForeignKey(
        AppUser, on_delete=models.CASCADE, related_name="point_transactions"
    )
    kind = models.CharField(max_length=10, choices=Kind.choices)
    amount = models.PositiveIntegerField(help_text="Always positive; sign implied by kind")
    # e.g. "redeem_reward", "daily_login"
    reason = models.CharField(max_length=120)   
    reference = models.CharField(
        max_length=120, blank=True, null=True,
        help_text="Idempotency key to avoid double-charging (optional)"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["user", "reference"]),
        ]
        constraints = [
            models.CheckConstraint(
                name="pt_amount_gt_zero",
                check=Q(amount__gt=0),
            ),
        ]

    def __str__(self):
        sign = "-" if self.kind == self.Kind.SPEND else "+"
        return f"{self.user} {sign}{self.amount} ({self.reason})"
