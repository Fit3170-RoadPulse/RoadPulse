from rest_framework import serializers
from .models import ExchangeItem, AppUser, SavedDestination


class RewardSerializer(serializers.ModelSerializer):
    """Serializer for reading ExchangeItem (Reward) data"""
    
    class Meta:
        model = ExchangeItem
        fields = [
            'id', 'name', 'description', 'points_cost', 'stock',
            'image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RewardCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating Rewards (ExchangeItems)"""
    
    class Meta:
        model = ExchangeItem
        fields = [
            'name', 'description', 'points_cost', 'stock',
            'image', 'is_active'
        ]

    def validate_points_cost(self, value):
        """Ensure points cost is positive"""
        if value < 0:
            raise serializers.ValidationError("Points cost cannot be negative.")
        return value

    def validate_stock(self, value):
        """Ensure stock is non-negative if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value


class AdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for admin profile information"""
    
    class Meta:
        model = AppUser
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = fields

class SavedDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedDestination
        fields = ("id", "label", "latitude", "longitude", "address", "created_at")