from rest_framework import serializers

from .models import SecureFile, WrappedKey
from .validators import validate_iv, validate_recipient_username, validate_wrapped_key


class SecureFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecureFile
        fields = [
            "id",
            "original_name",
            "category",
            "extension",
            "size",
            "uploaded_at",
            "aes_key_owner_wrapped",
            "iv",
        ]
        read_only_fields = ["id", "uploaded_at", "category", "extension"]

    def validate_aes_key_owner_wrapped(self, value):
        validate_wrapped_key(value)
        return value

    def validate_iv(self, value):
        validate_iv(value)
        return value


class FileListSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()

    class Meta:
        model = SecureFile
        fields = [
            "id",
            "original_name",
            "category",
            "extension",
            "size",
            "uploaded_at",
            "owner_username",
            "is_owner",
            "is_shared",
            "download_count",
            "download_limit",
            "expires_at",
        ]
        read_only_fields = fields

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return bool(request and obj.owner_id == request.user.id)

    def get_is_shared(self, obj):
        request = self.context.get("request")
        return bool(request and obj.owner_id != request.user.id)


class WrappedKeySerializer(serializers.ModelSerializer):
    recipient_username = serializers.CharField(source="recipient.username", read_only=True)
    file_name = serializers.CharField(source="file.original_name", read_only=True)
    owner_username = serializers.CharField(source="file.owner.username", read_only=True)

    class Meta:
        model = WrappedKey
        fields = [
            "id",
            "file",
            "file_name",
            "owner_username",
            "recipient",
            "recipient_username",
            "wrapped_key",
            "created_at",
            "expires_at",
            "can_reshare",
        ]
        read_only_fields = ["id", "created_at", "file_name", "owner_username", "recipient_username"]

    def validate_wrapped_key(self, value):
        validate_wrapped_key(value)
        return value


class FileShareSerializer(serializers.Serializer):
    recipient_username = serializers.CharField(max_length=30)
    wrapped_key_for_recipient = serializers.CharField()

    def validate_recipient_username(self, value):
        validate_recipient_username(value)
        return value

    def validate_wrapped_key_for_recipient(self, value):
        validate_wrapped_key(value)
        return value
