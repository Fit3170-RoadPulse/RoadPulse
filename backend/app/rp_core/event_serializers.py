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
        """Ensure points cost is non-negative (0 or positive)"""
        if value < 0:
            raise serializers.ValidationError("Points cost cannot be negative.")
        return value

    def validate_stock(self, value):
        """Ensure stock is non-negative if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate(self, data):
        """
        Check that is_active is not True if stock is 0.
        """
        # Get values from data, or instance (for updates) if not present in data
        stock = data.get('stock')
        is_active = data.get('is_active')
        
        # If updating, use instance value if not provided
        if self.instance:
            if stock is None:
                stock = self.instance.stock
            if is_active is None:
                is_active = self.instance.is_active
        
        # Validation Logic:
        # If stock is strictly 0 (not None/Unlimited), is_active cannot be True
        if stock is not None and stock == 0 and is_active:
             raise serializers.ValidationError(
                 {"stock": "Cannot activate reward with 0 stock. Please add stock first."}
             )
        
        return data


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
        read_only_fields = ("id", "created_at")
