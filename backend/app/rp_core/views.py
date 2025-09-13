from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

def health(_req):
    return JsonResponse({"status": "ok", "service": "RoadPulse API"})

@api_view(["GET"])
def samples(_req):
    return Response([{"id": 1, "name": "Hello RoadPulse"}])
