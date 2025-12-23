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
import json
import requests

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

@api_view(["POST"])
def compute_route(request):

    origin = request.data.get("origin")
    destination = request.data.get("destination")
    startTimes = request.data.get("startTimes")
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    responseMatrix = []

    if not origin or not destination:
        return Response({"detail":"You must provide the origin and the destination"},status=status.HTTP_400_BAD_REQUEST)
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': settings.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    }

    for time in startTimes:
        request_body = {
            "origin":{
                "location":{
                    "latLng":{
                        "latitude":origin["latitude"],
                        "longitude":origin["longitude"]
                    }
                }
            },
            "destination":{
                "location":{
                    "latLng":{
                        "latitude":destination["latitude"],
                        "longitude":destination["longitude"]
                    }
                }
            },
            "travelMode":"DRIVE",
            "routingPreference":"TRAFFIC_AWARE",
            "departureTime": time,
            "languageCode": "en-US",
        }
        try:
            google_response = requests.post(
                url,
                headers=headers,
                json=request_body
            )
            google_response.raise_for_status()
        except requests.RequestException as e:
            return Response({
                "detail": "Failed to contact Google Routes API. Please ensure departure times are in the future."},
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        data = google_response.json()
        route = data["routes"][0]
        responseMatrix.append({
            "starting_time":time,
            "distance_meters":route["distanceMeters"],
            "duration":int((route["duration"]).replace("s","")),
            "polyline":route["polyline"]["encodedPolyline"]
        })

    return Response(responseMatrix)
    


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
    })


# List available exchange items
@api_view(["GET"])
def map(_req):
    return JsonResponse({"status": "ok", "GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY,"GMAPS_ID": settings.GOOGLE_MAPS_ID})

class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success":True, "message": "User registered"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(views.APIView):
    def post(self,request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "email": user.email
        })
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

class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success":True, "message": "User registered"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(views.APIView):
    def post(self,request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "username": user.username,
            "email": user.email
        })