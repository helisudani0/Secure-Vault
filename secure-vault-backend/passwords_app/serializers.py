import base64

from rest_framework import serializers

from files_app.validators import validate_iv, validate_wrapped_key

from .models import PasswordEntry


class PasswordEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordEntry
        fields = [
            "id",
            "title",
            "website_url",
            "encrypted_payload",
            "wrapped_key",
            "iv",
            "favorite",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Title is required")
        return value

    def validate_website_url(self, value):
        return (value or "").strip()

    def validate_wrapped_key(self, value):
        validate_wrapped_key(value)
        return value

    def validate_iv(self, value):
        validate_iv(value)
        return value

    def validate_encrypted_payload(self, value):
        try:
            base64.b64decode(value)
        except Exception:
            raise serializers.ValidationError("Encrypted payload must be valid base64")
        if len(value) > 20000:
            raise serializers.ValidationError("Encrypted payload is too large")
        return value
