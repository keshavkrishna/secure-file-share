import pyotp
import qrcode
from io import BytesIO
from django.core.mail import send_mail
from django.http import JsonResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from .models import Users
from django.core.cache import cache
from .serializers import (
    UserSerializer,
    LoginSerializer,
    MFASetupSerializer,
    MFAValidationSerializer,
)
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdmin
from django.shortcuts import get_object_or_404


Users = get_user_model()

class RegisterView(APIView):
    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                validated_data = serializer.validated_data
                username = validated_data.pop('username')
                email = validated_data.pop('email')
                password = validated_data.pop('password')
                user = Users.objects.create_user(username, email=email, password=password)
                # refresh = RefreshToken.for_user(user)
                serializer = UserSerializer(user)
                response = {
                    'message': 'User registered successfully',
                    'user_details': serializer.data,
                    'user_id': user.id
                    # 'access': str(refresh.access_token),
                    # 'refresh': str(refresh)
                }
                return JsonResponse({"data": response}, status=status.HTTP_201_CREATED)
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({"message": f'An error occured: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(username=serializer.data['username'], password=serializer.data['password'])
            if user:
                
                response = JsonResponse({
                        "message": "Login successful",
                        "userId": user.id,
                        "role": user.role,
                        "is_mfa_enabled": user.is_mfa_enabled
                    }, status=status.HTTP_200_OK)
                
                return response
        return JsonResponse({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# TOTP Setup
class TOTPSetupView(APIView):
    def get(self, request, user_id):
        user = Users.objects.get(id=user_id)
        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save()

        totp = pyotp.TOTP(user.mfa_secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="FileSecure")

        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type="image/png")
        response["Content-Disposition"] = "inline; filename=totp_qr_code.png"
        return response


# MFA Validation View
class MFAValidationView(APIView):
    def post(self, request, user_id):
        token = request.data.get('token')
        user = Users.objects.get(id=user_id)

        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(token):
            # Generate and set JWT tokens
            user.is_mfa_enabled = True
            user.save()
            refresh = RefreshToken.for_user(user)
            response = JsonResponse({
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "message": "Login successful"
                }, status=status.HTTP_200_OK)
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite=None,
                max_age=60 * 5,
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite=None,
                max_age=60 * 60 * 24,
            )
            return response
        return JsonResponse({"error": "Invalid TOTP"}, status=status.HTTP_400_BAD_REQUEST)
            # # elif user.mfa_method == "Email":
            #     if token == user.mfa_secret:
            #         # Generate and set JWT tokens
            #         refresh = RefreshToken.for_user(user)
            #         user.mfa_secret = None  # Clear OTP
            #         user.save()
            #         response = JsonResponse({"message": "MFA validation successful"}, status=status.HTTP_200_OK)
            #         response.set_cookie(
            #             key='access_token',
            #             value=str(refresh.access_token),
            #             httponly=True,
            #             secure=True,
            #             samesite='Strict',
            #             max_age=60 * 5,
            #         )
            #         response.set_cookie(
            #             key='refresh_token',
            #             value=str(refresh),
            #             httponly=True,
            #             secure=True,
            #             samesite='Strict',
            #             max_age=60 * 60 * 24,
            #         )
            #         return response
            #     return JsonResponse({"error": "Invalid Email OTP"}, status=status.HTTP_400_BAD_REQUEST)

        return JsonResponse({"error": "MFA not enabled"}, status=status.HTTP_400_BAD_REQUEST)


class ValidateTokenView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            
            user = request.user
            return JsonResponse({
                "message": "Token is valid",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_mfa_enabled": user.is_mfa_enabled,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        except Exception:
            return JsonResponse({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        response = JsonResponse({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        
        # Clear the cookies
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")

        return response
    

class AdminUserViews(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        """
        List all users with their name, username, and role.
        """
        users = Users.objects.all()
        user_data = [
            {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "username": user.username,
                "role": user.role,
            }
            for user in users if user.role != 'Admin'
        ]
        return JsonResponse({'data': user_data}, status=200)

    def patch(self, request, user_id):
        """
        Update a user's role.
        Expected payload: {"username": "username", "role": "new_role"}
        """
        # user_id = request.data.get("userId")
        new_role = request.data.get("newRole")

        if not user_id or not new_role:
            return JsonResponse({"error": "Username and role are required"}, status=400)

        user = get_object_or_404(Users, id=user_id)

        if new_role not in ["Regular User", "Guest"]:  # Replace with your role choices
            return JsonResponse({"error": "Invalid role"}, status=400)

        user.role = new_role
        user.save()

        return JsonResponse(
            {"message": "Role updated successfully"},
            status=200,
        )

    def delete(self, request, user_id):
        """
        Remove a user by user_id.
        Expected payload: {"userId": "user_id"}
        """
        # user_id = request.data.get("userId")

        if not user_id:
            return JsonResponse({"error": "Username is required"}, status=400)

        user = get_object_or_404(Users, id=user_id)

        # Prevent self-deletion
        if user == request.user:
            return JsonResponse({"error": "You cannot delete yourself"}, status=403)

        user.delete()

        return JsonResponse(
            {"message": "User has been removed successfully"},
            status=200,
        )
