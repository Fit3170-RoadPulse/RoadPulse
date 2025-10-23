from django.http import JsonResponse
from .serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status, views
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