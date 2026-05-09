from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from rest_framework import serializers

from .models import CustomUser
from .validators import validate_username


REQUIRED_KEY_BUNDLE_FIELDS = {"ciphertext", "salt", "iv", "iterations", "kdf", "hash"}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    public_key = serializers.CharField(write_only=True)
    encrypted_private_key = serializers.JSONField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["username", "email", "password", "public_key", "encrypted_private_key"]

    def validate_username(self, value):
        value = value.strip()
        validate_username(value)

        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists")

        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            return ""
        try:
            validate_email(email)
        except DjangoValidationError:
            raise serializers.ValidationError("Enter a valid email address")
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already in use")
        return email

    def validate_public_key(self, value):
        value = value.strip()
        if len(value) < 256:
            raise serializers.ValidationError("Public key is too short")
        if len(value) > 12000:
            raise serializers.ValidationError("Public key is too large")
        return value

    def validate_encrypted_private_key(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Encrypted private key must be an object")

        missing = REQUIRED_KEY_BUNDLE_FIELDS.difference(value)
        if missing:
            raise serializers.ValidationError(
                f"Encrypted private key is missing: {', '.join(sorted(missing))}"
            )

        if value.get("kdf") != "PBKDF2":
            raise serializers.ValidationError("Unsupported key derivation function")
        if value.get("hash") != "SHA-256":
            raise serializers.ValidationError("Unsupported key derivation hash")

        try:
            iterations = int(value.get("iterations"))
        except (TypeError, ValueError):
            raise serializers.ValidationError("Invalid key derivation iteration count")

        if iterations < 250000:
            raise serializers.ValidationError("Key derivation iteration count is too low")

        for field in ("ciphertext", "salt", "iv"):
            field_value = value.get(field)
            if not isinstance(field_value, str) or not field_value:
                raise serializers.ValidationError(f"{field} must be a non-empty string")
            if len(field_value) > 20000:
                raise serializers.ValidationError(f"{field} is too large")

        return value

    def create(self, validated_data):
        return CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            public_key=validated_data["public_key"],
            encrypted_private_key=validated_data["encrypted_private_key"],
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_username(self, value):
        value = value.strip()
        validate_username(value)
        return value
