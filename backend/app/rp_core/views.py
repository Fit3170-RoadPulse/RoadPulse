from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.generic import View
from rest_framework.decorators import api_view
from rest_framework.response import Response


def health(_req):
    return JsonResponse({"status": "ok", "service": "RoadPulse API"})

@api_view(["GET"])
def samples(_req):
    return Response([{"id": 1, "name": "Hello RoadPulse"}])

class MapView(View):
    template_name = "map.html"

    def get(self, request):
        context = {"GMAPS_KEY": settings.GOOGLE_MAPS_API_KEY}

        return render(request, self.template_name, context)