from decimal import Decimal, ROUND_DOWN

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from math import asin, cos, radians, sin, sqrt

from rest_framework import status, views, serializers
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.generics import DestroyAPIView

from rp_core.services.points import deduct_points, add_points
from rp_core.services.incident_reporting import (
    close_and_settle_report,
    grant_report_provisional_point,
    grant_vote_provisional_point,
)

import hashlib
import json
import requests

from .incident_report import (
    IncidentReportCreateSerializer,
    IncidentReportSerializer,
    IncidentReportVoteCreateSerializer,
    RegisterSerializerIncidentReport,
)
from .event_serializers import RewardSerializer, RewardCreateUpdateSerializer, AdminProfileSerializer, SavedDestinationSerializer
from .models import AppUser, ExchangeItem, IncidentReport, IncidentReportVote, RewardRedemption, SavedDestination


User = get_user_model()

# Simple function to add delay based on hazard types
def add_hazard_delay_to_duration(base_duration):
    """
    Adds delay based on active hazard types.
    Different hazard types have different hardcoded delays.
    """
    # Get all active hazards
    active_hazards = IncidentReport.objects.active()
    
    # Hardcoded delay values per hazard type (in minutes)
    HAZARD_DELAYS = {
        IncidentReport.ReportType.ACCIDENT: 10,   # 10 minutes
        IncidentReport.ReportType.HAZARD: 5,      # 5 minutes
        IncidentReport.ReportType.WEATHER: 3,     # 3 minutes
        IncidentReport.ReportType.CRIME: 7,       # 7 minutes
        IncidentReport.ReportType.OTHER: 2,       # 2 minutes
    }
    
    total_delay_seconds = 0
    
    # Add delay for each hazard based on its type
    for hazard in active_hazards:
        delay_minutes = HAZARD_DELAYS.get(hazard.report_type, 0)
        total_delay_seconds += delay_minutes * 60  # Convert to seconds
    
    return base_duration + total_delay_seconds

def root(_req):
    """Root endpoint - returns API information and all available endpoints"""
    return JsonResponse({
        "service": "RoadPulse API",
        "version": "1.0",
        "status": "running",
        "documentation": "List of all available API endpoints",
        "endpoints": {
            "admin": {
                "admin_panel": "/admin/",
                "admin_rewards_list": "/api/admin/rewards/",
                "admin_reward_detail": "/api/admin/rewards/{id}/",
                "admin_profile": "/api/admin/profile/",
            },
            "authentication": {
                "register": "/api/register/",
                "login": "/api/login/",
                "token_refresh": "/api/token/refresh/",
                "forgot_password": "/api/forgot-password/",
                "change_password": "/api/change-password/",
            },
            "map": {
                "map_config": "/api/map/",
                "location_data": "/api/map/location/",
                "compute_route": "/api/map/compute-route/",
            },
            "user": {
                "reward_account": "/api/rewards/account/",
                "update_profile": "/api/profile/update/",
                "update_distance": "/api/user/distance/",
            },
            "incidents": {
                "list_and_create": "/api/incident-reports/",
                "vote": "/api/incident-reports/{id}/vote/",
            },
            "rewards": {
                "list_items": "/api/rewards/items/",
                "redeem_reward": "/api/rewards/redeem/",
                "user_redemptions": "/api/rewards/redemptions/",
                "mark_redeemed": "/api/rewards/redemptions/{id}/redeem/",
            },
            "system": {
                "health": "/api/health/",
                "samples": "/api/samples/",
            }
        },
        "note": "Some endpoints require authentication. Use /api/login/ to obtain access token."
    })

def health(_req):
    from django.db import connection
    
    db_status = "ok"
    db_error = None
    
    # Test database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_status = "connected"
    except Exception as e:
        db_status = "error"
        db_error = str(e)
    
    return JsonResponse({
        "status": "ok",
        "service": "RoadPulse API",
        "database": db_status,
        "database_error": db_error
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
    avoidTolls = bool(request.data.get("avoidTolls", False)) #Frontend needs to send this param, currently unused, default False
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    responseMatrix = []

    if not origin or not destination:
        return Response({"detail":"You must provide the origin and the destination"},status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(startTimes, list) or not startTimes:
        return Response({"detail": "You must provide a list of departure times."}, status=status.HTTP_400_BAD_REQUEST)
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': settings.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps,routes.travelAdvisory.tollInfo'
    }

    def build_cache_key(origin_data, destination_data, departure_time):
        payload = {
            "origin": origin_data,
            "destination": destination_data,
            "departureTime": departure_time,
        }
        serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        return f"routes:compute:{digest}"

    seen_times = set()
    for time in startTimes:
        if time in seen_times:
            continue
        seen_times.add(time)
        cache_key = build_cache_key(origin, destination, time)
        cached = cache.get(cache_key)
        if cached is not None:
            responseMatrix.append(cached)
            continue

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

        if avoidTolls: #If true, add route modifier to avoid tolls
            request_body["routeModifiers"] = {
                "avoidTolls": avoidTolls
            }

        try:
            google_response = requests.post(
                url,
                headers=headers,
                json=request_body,
                timeout=10
            )
            google_response.raise_for_status()
        except requests.RequestException as e:
            return Response({
                "detail": "Failed to contact Google Routes API. Please ensure departure times are in the future."},
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        data = google_response.json()
        route = data["routes"][0]
        toll_info = route.get("travelAdvisory", {}).get("tollInfo")
        base_duration = int((route["duration"]).replace("s",""))
        
        # Add hazard delay if any hazards exist
        adjusted_duration = add_hazard_delay_to_duration(base_duration)
        
        result = {
            "starting_time":time,
            "distance_meters":route["distanceMeters"],
            "duration":adjusted_duration,
            "polyline":route["polyline"]["encodedPolyline"],
            "legs":route["legs"],
            "toll": {"has_tolls": bool(toll_info),"details": toll_info}, #Return toll info
        }
        cache.set(cache_key, result, timeout=getattr(settings, "GOOGLE_ROUTES_CACHE_TTL", 300))
        responseMatrix.append(result)

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
        "username": user.username,
        "email": user.email,
        "reward_points": user.reward_points,
        "cumulative_distance": user.cumulative_distance,
        "provisional_points": getattr(user, "provisional_points", 0),
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
    })


# Update authenticated user's profile
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data
    
    # Update username if provided
    if "username" in data:
        new_username = data["username"].strip()
        if not new_username:
            return Response({"detail": "Username cannot be empty."}, status=400)
        # Check if username is already taken by another user
        from .models import AppUser
        if AppUser.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response({"detail": "Username is already taken."}, status=400)
        user.username = new_username
    
    user.save()
    
    
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "detail": "Profile updated successfully."
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_emergency_contact(request):
    """
    Get the user's emergency contact.
    """
    try:
        # Assuming only one major emergency contact for now, or get the one marked is_emergency
        contact = request.user.contacts.filter(is_emergency=True).first()
        if not contact:
            # Fallback: get the first contact if any
             contact = request.user.contacts.first()
        
        if not contact:
            return Response(None, status=status.HTTP_204_NO_CONTENT)
            
        from .serializers import ContactSerializer
        return Response(ContactSerializer(contact).data)
    except Exception as e:
         return Response({"detail": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_emergency_contact(request):
    """
    Create or update the user's emergency contact.
    Enforces a single emergency contact per user for this feature.
    """
    from .models import Contact
    from .serializers import ContactSerializer
    
    data = request.data
    user = request.user
    
    # Check if existing emergency contact
    contact = user.contacts.filter(is_emergency=True).first()
    
    if not contact:
        # Check if any contact exists to upgrade or just create new
        # For simplicity, if no contact marked is_emergency, we treat any existing as candidate or create new
        # But per requirements "add a emergency contact", we can just create/update the one.
        pass

    if contact:
        serializer = ContactSerializer(contact, data=data, partial=True)
    else:
        # Create new
        # Force is_emergency=True
        data_copy = data.copy()
        data_copy['is_emergency'] = True
        serializer = ContactSerializer(data=data_copy)

    if serializer.is_valid():
        if not contact:
             serializer.save(user=user)
        else:
             serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# List available exchange items
@api_view(["GET"])
def map(_req):
    return JsonResponse({
        "status": "ok",
        "GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY,
        "GMAPS_ID": settings.GOOGLE_MAPS_ID,
    })

@api_view(["GET", "POST"])
def incident_reports(request):
    if request.method == "GET":
        # Close & settle any expired open reports (time limit reached)
        reports = IncidentReport.objects.active()[:500]
        return Response(IncidentReportSerializer(reports, many=True).data)

    if not request.user or not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = IncidentReportCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    report = serializer.save(reporter=request.user)
    if report.report_type == IncidentReport.ReportType.HAZARD:
        # set vote thresholds from settings
        required = getattr(settings, "INCIDENT_REPORT_REQUIRED_VOTES", 7)
        try:
            required = int(required)
        except (TypeError, ValueError):
            required = 7
        if required < 1:
            required = 1
        report.required_votes = required
        report.save(update_fields=["required_votes"])

        grant_report_provisional_point(report)
    return Response(IncidentReportSerializer(report).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def incident_report_vote(request, report_id: int):
    serializer = IncidentReportVoteCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    choice = serializer.validated_data["choice"]
    voter_lat = serializer.validated_data.get("latitude")
    voter_lng = serializer.validated_data.get("longitude")

    def location_restrction_vote(lat1, lng1, lat2, lng2) -> float:
        r = 6371000.0 #from google
        data_latitude = radians(float(lat2) - float(lat1))
        data_longtitude = radians(float(lng2) - float(lng1))
        a = sin(data_latitude / 2) ** 2 + cos(radians(float(lat1))) * cos(radians(float(lat2))) * sin(data_longtitude / 2) ** 2
        return 2 * r * asin(sqrt(a))

    with transaction.atomic():
        report = IncidentReport.objects.select_for_update().get(pk=report_id)

        if report.report_type != IncidentReport.ReportType.HAZARD:
            return Response({"detail": "Voting is only supported for HAZARD reports."}, status=status.HTTP_400_BAD_REQUEST)

        # If expired, close & settle first
        if report.status == IncidentReport.Status.OPEN and report.expires_at and report.expires_at <= timezone.now():
            close_and_settle_report(report.id)
            report.refresh_from_db()

        if report.status != IncidentReport.Status.OPEN or not report.is_active:
            return Response({"detail": "This report is closed."}, status=status.HTTP_400_BAD_REQUEST)

        # only users within a radius can vote.
        if voter_lat is None or voter_lng is None:
            return Response(
                {"detail": "Your current location is required to vote on hazard reports."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        radius_m = int(getattr(settings, "INCIDENT_REPORT_VOTE_RADIUS_METERS", 500))
        radius_m = max(1, radius_m)
        distance_m = location_restrction_vote(report.latitude, report.longitude, voter_lat, voter_lng)
        if distance_m > radius_m:
            return Response(
                {"detail": f"You must be within {radius_m}m of the hazard location to vote."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if report.reporter_id and report.reporter_id == request.user.id:
            return Response({"detail": "Reporter cannot vote on their own report."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate votes
        if IncidentReportVote.objects.filter(report=report, voter=request.user).exists():
            return Response({"detail": "You have already voted on this report."}, status=status.HTTP_400_BAD_REQUEST)

        vote = IncidentReportVote.objects.create(report=report, voter=request.user, choice=choice)
        grant_vote_provisional_point(request.user, report, vote)

        # Update counters & termination conditions
        if choice == IncidentReportVote.Choice.YES:
            report.yes_votes += 1
            report.consecutive_no_votes = 0
        else:
            report.no_votes += 1
            report.consecutive_no_votes += 1
        report.total_votes += 1
        report.save(update_fields=["yes_votes", "no_votes", "total_votes", "consecutive_no_votes"])

        no_streak_limit = getattr(settings, "INCIDENT_REPORT_NO_STREAK_LIMIT", 3)
        try:
            no_streak_limit = int(no_streak_limit)
        except (TypeError, ValueError):
            no_streak_limit = 3

        should_close = False
        if report.consecutive_no_votes >= max(1, no_streak_limit):
            should_close = True
        if report.total_votes >= max(1, report.required_votes):
            should_close = True
        if report.expires_at and report.expires_at <= timezone.now():
            should_close = True

    if should_close:
        report = close_and_settle_report(report.id)
    else:
        report.refresh_from_db()

    return Response(IncidentReportSerializer(report).data, status=status.HTTP_200_OK)

@api_view(["GET"])
def locationData(_req):
    return JsonResponse({"status": "ok", 
                         "pollingInterval": settings.POLLING_INTERVAL,
                         "enableHighAccuracy": settings.ENABLE_HIGH_ACCURACY,
                         "timeout": settings.TIMEOUT,
                         "maximumAge": settings.MAXIMUM_AGE,
                         })

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializerIncidentReport(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User registered"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=400)
        
        try:
            logger.info(f"Login attempt for email: {email}")
            
            # Use email for authentication (custom backend handles this)
            user = authenticate(request, email=email, password=password)
            
            logger.info(f"Authentication result: {'success' if user else 'failed'}")

            if user is None:
                return Response({"detail": "Invalid email or password. Please try again."}, status=401)

            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            })
        except Exception as e:
            logger.error(f"Login error: {type(e).__name__}: {str(e)}")
            return Response({
                "detail": f"Authentication error: {str(e)}"
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
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

    
@api_view(["GET"])
def list_exchange_items(_req):
    items = ExchangeItem.objects.filter(is_active=True).order_by("name")
    data = [{
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "points_cost": item.points_cost,
        "stock": item.stock,
        "image": _req.build_absolute_uri(item.image.url) if item.image else None,
    } for item in items]
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_user_redemptions(request):
    redemptions = (
        RewardRedemption.objects
        .filter(user=request.user)
        .select_related("item")
        .order_by("-created_at")
    )
    data = []
    for redemption in redemptions:
        data.append({
            "id": redemption.id,
            "item": {
                "id": redemption.item.id,
                "name": redemption.item.name,
                "description": redemption.item.description,
            },
            "quantity": redemption.quantity,
            "points_spent": redemption.points_spent,
            "created_at": redemption.created_at.isoformat(),
            "redeemed_at": redemption.redeemed_at.isoformat() if redemption.redeemed_at else None,
            "code": f"RWD-{redemption.id:06d}",
        })
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def redeem_user_redemption(request, redemption_id):
    try:
        redemption = RewardRedemption.objects.get(pk=redemption_id, user=request.user)
    except RewardRedemption.DoesNotExist:
        return Response({"detail": "Redemption not found."}, status=status.HTTP_404_NOT_FOUND)

    # No "used" field in model yet, so consume by deleting the record
    redemption.delete()
    return Response({"detail": "Voucher redeemed."})


POINTS_PER_10KM = Decimal("0.1")
KM_BLOCK = Decimal("10")

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_cumulative_distance(request):
    user = request.user
    data = request.data or {}

    old_distance = Decimal(str(user.cumulative_distance or 0))

    # --- Determine new distance ---
    try:
        if "cumulative_distance" in data:
            new_distance = Decimal(str(data["cumulative_distance"]))
        elif "distance_m" in data:
            new_distance = old_distance + (Decimal(str(data["distance_m"])) / Decimal("1000"))
        elif "distance_km" in data:
            new_distance = old_distance + Decimal(str(data["distance_km"]))
        else:
            return Response(
                {"detail": "Provide distance_m, distance_km, or cumulative_distance."},
                status=400
            )
    except Exception:
        return Response({"detail": "Invalid distance value."}, status=400)

    if new_distance < old_distance:
        return Response({"detail": "Distance cannot decrease."}, status=400)

    # --- Compute 10km blocks crossed ---
    old_blocks = (old_distance / KM_BLOCK).to_integral_value(rounding=ROUND_DOWN)
    new_blocks = (new_distance / KM_BLOCK).to_integral_value(rounding=ROUND_DOWN)

    blocks_gained = new_blocks - old_blocks

    # --- Award points only for new blocks ---
    if blocks_gained > 0:
        points_awarded = blocks_gained * POINTS_PER_10KM
        user.reward_points = Decimal(str(user.reward_points or 0)) + points_awarded

    user.cumulative_distance = float(new_distance)
    user.save(update_fields=["cumulative_distance", "reward_points"])

    return Response({
        "cumulative_distance": float(user.cumulative_distance),
        "points_awarded": float(blocks_gained * POINTS_PER_10KM),
        "total_points": float(user.reward_points),
    })


# Redeem reward points for an exchange item
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def redeem_reward(request):
    # Prevent staff/admin users from redeeming rewards
    if request.user.is_staff:
        return Response(
            {"detail": "Staff and admin users cannot redeem rewards."},
            status=status.HTTP_403_FORBIDDEN,
        )
    
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
        # Only deduct points if total_cost > 0 (skip for 0-point rewards)
        if total_cost > 0:
            try:
                deduct_points(user, total_cost, reason="redeem_reward")
                # CRITICAL: Refresh user to get the updated points after deduction
                user.refresh_from_db(fields=["reward_points"])
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct stock if not unlimited
        if item.stock is not None:
            item.stock -= quantity
            # Automatically deactivate reward if stock reaches 0
            if item.stock == 0:
                item.is_active = False
        item.save()

        # Create redemption record
        redemption = RewardRedemption.objects.create(
            user=user,
            item=item,
            quantity=quantity,
            points_spent=total_cost,
        )
        
        # Refresh user to get updated points after deduction
        user.refresh_from_db(fields=["reward_points"])

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


# ========== ADMIN REWARD MANAGEMENT ENDPOINTS ==========

class IsStaffUser(IsAuthenticated):
    """Custom permission class to allow only admin/staff users"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


@api_view(["GET", "POST"])
@permission_classes([IsStaffUser])
def admin_rewards(request):
    """
    List all rewards (GET) or create new reward (POST)
    Admin-only endpoint
    """
    if request.method == "GET":
        # Show all rewards in admin interface (including inactive ones)
        rewards = ExchangeItem.objects.all().order_by('-is_active', 'name')
        serializer = RewardSerializer(rewards, many=True)
        return Response(serializer.data)
    
    # POST - Create new reward
    serializer = RewardCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        reward = serializer.save()
        return Response(
            RewardSerializer(reward).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsStaffUser])
def admin_reward_detail(request, reward_id):
    """
    Get, update, or delete a specific reward
    Admin-only endpoint
    """
    try:
        reward = ExchangeItem.objects.get(pk=reward_id)
    except ExchangeItem.DoesNotExist:
        return Response(
            {"detail": "Reward not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == "GET":
        serializer = RewardSerializer(reward)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        # Store original stock value to detect restocking
        original_stock = reward.stock
        was_inactive = not reward.is_active
        
        serializer = RewardCreateUpdateSerializer(reward, data=request.data)
        if serializer.is_valid():
            updated_reward = serializer.save()
            
            # Automatically reactivate reward if it was inactive and now has stock
            if was_inactive and updated_reward.stock is not None and updated_reward.stock > 0:
                updated_reward.is_active = True
                updated_reward.save(update_fields=["is_active"])
            
            return Response(RewardSerializer(updated_reward).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        # Refund points for unredeemed vouchers
        unredeemed_vouchers = RewardRedemption.objects.filter(item=reward, redeemed_at__isnull=True)
        print(f"DEBUG: Deleting reward {reward.id} ({reward.name}). Found {unredeemed_vouchers.count()} unredeemed vouchers.")
        
        refund_count = 0
        total_refunded = 0
        
        with transaction.atomic():
            for voucher in unredeemed_vouchers:
                user = voucher.user
                original_points = user.reward_points
                print(f"DEBUG: Refunding user {user.username} (ID: {user.id}). Current Points: {original_points}. Refund Amount: {voucher.points_spent}")
                
                # Use add_points service to ensure transaction record is created
                add_points(
                    user=user, 
                    amount=voucher.points_spent, 
                    reason="reward_deletion_refund", 
                    ref=f"refund_reward_{reward.id}_voucher_{voucher.id}"
                )
                
                # Refresh to check new value
                user.refresh_from_db()
                print(f"DEBUG: User {user.username} points after refund: {user.reward_points}")
                
                refund_count += 1
                total_refunded += voucher.points_spent
            
            # Delete the reward (cascades to delete all redemptions)
            reward.delete()
            print("DEBUG: Reward deleted from database.")

        return Response(
            {
                "detail": f"Reward deleted. Refunded {total_refunded} points to {refund_count} users.",
                "refunded_count": refund_count,
                "total_points_refunded": total_refunded
            },
            status=status.HTTP_200_OK
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_voucher_redeemed(request, redemption_id):
    """
    Mark a specific redemption/voucher as used/redeemed
    """
    try:
        voucher = RewardRedemption.objects.get(pk=redemption_id, user=request.user)
    except RewardRedemption.DoesNotExist:
        return Response(
            {"detail": "Voucher not found or does not belong to user."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if voucher.redeemed_at:
         # Already redeemed, but if we are here, it might be a race condition or stale data.
         # For "delete on redeem" logic, if it's already redeemed, it should have been deleted.
         # We can try to delete it again or just return success.
         voucher.delete()
         return Response({
            "id": redemption_id,
            "status": "deleted",
            "detail": "Voucher redeemed and deleted."
        })
    
    # Perform the "redemption" action which is now a deletion
    voucher.delete()
    
    return Response({
        "id": redemption_id,
        "status": "deleted",
        "detail": "Voucher redeemed and deleted."
    })


@api_view(["GET"])
@permission_classes([IsStaffUser])
def admin_profile(request):
    """Get admin profile information"""
    serializer = AdminProfileSerializer(request.user)
    return Response(serializer.data)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def saved_destinations(request, pk=None):
    """
    GET: list current user's saved destinations
    POST: create a new saved destination for current user
    """
    if request.method == "GET":
        qs = SavedDestination.objects.filter(user=request.user).order_by("-created_at")
        serializer = SavedDestinationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # POST
    serializer = SavedDestinationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)  # attach user here (don't trust client)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def saved_destination_detail(request, destination_id):
    destination = get_object_or_404(SavedDestination, id=destination_id, user=request.user)
    destination.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
