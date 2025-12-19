from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import IncidentReport

User = get_user_model()

class RegisterSerializerIncidentReport(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user


class IncidentReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentReport
        fields = ["report_type", "description", "latitude", "longitude"]


class IncidentReportSerializer(serializers.ModelSerializer):
    reporter = serializers.SerializerMethodField()

    class Meta:
        model = IncidentReport
        fields = [
            "id",
            "report_type",
            "description",
            "latitude",
            "longitude",
            "reporter",
            "created_at",
            "expires_at",
            "is_active",
        ]
        read_only_fields = fields

    def get_reporter(self, obj):
        if not obj.reporter_id:
            return None
        return {"id": obj.reporter_id, "username": obj.reporter.get_username()}
