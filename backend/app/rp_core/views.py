from django.db import transaction
from django.http import JsonResponse
from .serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status, views
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate
from rest_framework import status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from config import settings
from .serializers import RegisterSerializer
from .models import AppUser, ExchangeItem, RewardRedemption
from rp_core.services.points import deduct_points
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework import views, status
from rest_framework.response import Response
from .serializers import RegisterSerializer
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import ChangePasswordSerializer
from rest_framework import views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.parsers import JSONParser



User = get_user_model()

def health(_req):
    return JsonResponse({
        "status": "ok",
        "service": "RoadPulse API"
    })


@api_view(["GET"])
def samples(_req):
    return Response([{
        "id": 1,
        "name": "Hello RoadPulse"
    }])


# Return Google Maps config (key and ID)
@api_view(["GET"])
def map_config(_req):
    return JsonResponse({
        "status": "ok",
        "GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY,
        "GMAPS_ID": settings.GOOGLE_MAPS_ID
    })


# Return authenticated user's reward account details
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reward_account(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.get_username(),
        "reward_points": user.reward_points,
        "cumulative_distance": user.cumulative_distance,
    })

# List available exchange items
@api_view(["GET"])
def map(_req):
    return JsonResponse({"status": "ok", "GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY,"GMAPS_ID": settings.GOOGLE_MAPS_ID})

@api_view(["GET"])
def locationData(_req):
    return JsonResponse({"status": "ok", 
                         "pollingInterval": settings.pollingInterval,
                         "enableHighAccuracy": settings.enableHighAccuracy,
                         "timeout": settings.timeout,
                         "maximumAge": settings.maximumAge,
                         })

class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User registered"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=400)
        
        # Use email for authentication (custom backend handles this)
        user = authenticate(request, email=email, password=password)

        if user is None:
            return Response({"detail": "Invalid email or password. Please try again."}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "email": user.email
        })

class ForgotPasswordView(views.APIView):
    def post(self, request):
        email = request.data.get("email")
        
        if not email:
            return Response(
                {"detail": "Email is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "No account found with this email"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            send_reset_email(user)
        except Exception as e:
            # Log error in backend
            print(f"Failed to send reset email: {e}")
            return Response(
                {"detail": "Failed to send reset email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {"detail": "Reset code sent to your email"}, 
            status=status.HTTP_200_OK
        )

def send_reset_email(user):
    """
    Mock email sending function.
    Just prints to console instead of actually sending an email.
    """
    print(f"[MOCK] Sending password reset email to: {user.email}")
    # You could also simulate a reset code:
    reset_code = "123456"
    print(f"[MOCK] Reset code for {user.email}: {reset_code}")
    return True

class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current")
        new_password = request.data.get("newPass")
        repeat_password = request.data.get("repeat")

        # 1. Check all fields are provided
        if not current_password or not new_password or not repeat_password:
            return Response({"detail": "Please fill in all fields."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check current password
        if not user.check_password(current_password):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check new passwords match
        if new_password != repeat_password:
            return Response({"detail": "The two new password entries do not match."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Prevent using the same password
        if current_password == new_password:
            return Response({"detail": "New password cannot be the same as the current password."}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Validate new password (Django password validators)
        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        # 6. Save the new password
        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

def list_exchange_items(_req):
    items = ExchangeItem.objects.filter(is_active=True).order_by("name")
    data = [{
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "points_cost": item.points_cost,
        "stock": item.stock,
    } for item in items]
    return Response(data)


# Update the authenticated user's cumulative distance.
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_cumulative_distance(request):
    """Accepts a JSON body with either `distance_m` (meters) or `distance_km` (kilometres) to add,
    or `cumulative_distance` to set the total directly.
    """
    user = request.user

    data = request.data or {}
    
    # Check if setting directly
    if "cumulative_distance" in data:
        try:
            new_distance = float(data["cumulative_distance"])
            if new_distance < 0:
                return Response({"detail": "Cumulative distance cannot be negative."}, status=400)
            old_distance = user.cumulative_distance or 0.0
            delta_km = new_distance - old_distance
            if delta_km > 0:
                user.reward_points = (user.reward_points or 0.0) + (delta_km * 0.1)
            user.cumulative_distance = new_distance
            user.save(update_fields=["cumulative_distance", "reward_points"])
            return Response({"cumulative_distance": user.cumulative_distance})
        except (TypeError, ValueError):
            return Response({"detail": "Invalid cumulative_distance value."}, status=400)
    
    # Otherwise, add to existing
    distance_m = data.get("distance_m")
    distance_km = data.get("distance_km")

    try:
        if distance_m is not None:
            distance_m = float(distance_m)
            delta_km = distance_m / 1000.0
        elif distance_km is not None:
            delta_km = float(distance_km)
        else:
            return Response({"detail": "Provide distance_m (meters), distance_km (kilometres), or cumulative_distance."}, status=400)
    except (TypeError, ValueError):
        return Response({"detail": "Invalid distance value."}, status=400)

    if delta_km <= 0:
        return Response({"detail": "Distance must be positive."}, status=400)

    # Increment user's cumulative distance and persist
    user.cumulative_distance = (user.cumulative_distance or 0.0) + delta_km
    user.reward_points = (user.reward_points or 0.0) + (delta_km * 0.1)
    user.save(update_fields=["cumulative_distance", "reward_points"])

    return Response({"cumulative_distance": user.cumulative_distance})


# Redeem reward points for an exchange item
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def redeem_reward(request):
    item_id = request.data.get("item_id")
    quantity = request.data.get("quantity", 1)

    # Validate quantity
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response(
            {"detail": "Quantity must be an integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check positive quantity
    if quantity <= 0:
        return Response(
            {"detail": "Quantity must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check item_id provided
    if not item_id:
        return Response(
            {"detail": "item_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Transaction to ensure atomicity
    with transaction.atomic():
        # Lock item row and check existence
        try:
            item = ExchangeItem.objects.select_for_update().get(pk=item_id)
        except ExchangeItem.DoesNotExist:
            return Response(
                {"detail": "Exchange item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check item is active
        if not item.is_active:
            return Response(
                {"detail": "Exchange item is not active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check sufficient stock
        if not item.has_stock(quantity):
            return Response(
                {"detail": "Requested quantity exceeds available stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lock user row and check sufficient points
        try:
            user = AppUser.objects.select_for_update().get(pk=request.user.pk)
        except AppUser.DoesNotExist:
            return Response(
                {"detail": "User account could not be found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check sufficient points
        total_cost = item.points_cost * quantity
        if user.reward_points < total_cost:
            return Response(
                {"detail": "Not enough reward points."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduct points and stock, create redemption record
        try:
            deduct_points(user, total_cost, reason="redeem_reward", ref=f"Redeem: Item {item.id} with quantity of {quantity}")
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct stock if not unlimited
        if item.stock is not None:
            item.stock -= quantity
        item.save()

        # Create redemption record
        redemption = RewardRedemption.objects.create(
            user=user,
            item=item,
            quantity=quantity,
            points_spent=total_cost,
        )

    return Response({
        "redemption_id": redemption.id,
        "item": {
            "id": item.id,
            "name": item.name,
        },
        "quantity": quantity,
        "points_spent": total_cost,
        "remaining_points": user.reward_points,
        "created_at": redemption.created_at.isoformat(),
    })


    

