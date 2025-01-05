from rest_framework import serializers
from .models import Users

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Users
        fields = ['username','email', 'password', 'role']

    


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class MFASetupSerializer(serializers.Serializer):
    mfa_method = serializers.ChoiceField(choices=['Email', 'SMS', 'TOTP'])
    mfa_secret = serializers.CharField(required=False)  # For TOTP

class MFAValidationSerializer(serializers.Serializer):
    token = serializers.CharField()
