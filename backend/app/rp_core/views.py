from django.db import transaction
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.conf import settings
from django.utils import timezone
from math import asin, cos, radians, sin, sqrt
from rest_framework import status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .incidentReport import (
    IncidentReportCreateSerializer,
    IncidentReportSerializer,
    IncidentReportVoteCreateSerializer,
    RegisterSerializerIncidentReport,
)
from .models import AppUser, ExchangeItem, IncidentReport, IncidentReportVote, RewardRedemption
from rp_core.services.points import deduct_points
from rp_core.services.incident_reporting import (
    close_and_settle_report,
    grant_report_provisional_point,
    grant_vote_provisional_point,
)


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
        "provisional_points": getattr(user, "provisional_points", 0),
    })


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
        now = timezone.now()
        expired_open = IncidentReport.objects.filter(
            status=IncidentReport.Status.OPEN,
            expires_at__isnull=False,
            expires_at__lte=now,
        ).values_list("id", flat=True)[:200]
        for rid in expired_open:
            close_and_settle_report(rid)

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

class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializerIncidentReport(data=request.data)
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
    
@api_view(["GET"])
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
        serializer = RegisterSerializerIncidentReport(data=request.data)
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
