from django.db import models
from django.contrib.auth.models import AbstractUser

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