from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from config import settings


def health(_req):
    return JsonResponse({"status": "ok", "service": "RoadPulse API"})

@api_view(["GET"])
def samples(_req):
    return Response([{"id": 1, "name": "Hello RoadPulse"}])

@api_view(["GET"])
def map(_req):
    return JsonResponse({"status": "ok", "GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY,"GMAPS_ID": settings.GOOGLE_MAPS_ID})
