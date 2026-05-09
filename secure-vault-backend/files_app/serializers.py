# files_app/serializers.py

from rest_framework import serializers
from .models import SecureFile, WrappedKey
from .validators import (
    validate_wrapped_key,
    validate_iv,
    validate_recipient_username,
)


class SecureFileSerializer(serializers.ModelSerializer):
    """Serializer for file uploads"""
    
    class Meta:
        model = SecureFile
        fields = ['id', 'original_name', 'size', 'uploaded_at', 'aes_key_owner_wrapped', 'iv']
        read_only_fields = ['id', 'uploaded_at']
    
    def validate_aes_key_owner_wrapped(self, value):
        """Validate wrapped AES key"""
        validate_wrapped_key(value)
        return value
    
    def validate_iv(self, value):
        """Validate IV"""
        validate_iv(value)
        return value


class FileListSerializer(serializers.ModelSerializer):
    """Serializer for file listing"""
    
    class Meta:
        model = SecureFile
        fields = ['id', 'original_name', 'size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'size']


class WrappedKeySerializer(serializers.ModelSerializer):
    """Serializer for wrapped keys (file sharing)"""
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    
    class Meta:
        model = WrappedKey
        fields = ['id', 'file', 'recipient', 'recipient_username', 'wrapped_key', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_wrapped_key(self, value):
        """Validate wrapped key for sharing"""
        validate_wrapped_key(value)
        return value


class FileShareSerializer(serializers.Serializer):
    """Serializer for file sharing requests"""
    recipient_username = serializers.CharField(max_length=30)
    wrapped_key_for_recipient = serializers.CharField()
    
    def validate_recipient_username(self, value):
        """Validate recipient username"""
        validate_recipient_username(value)
        return value
    
    def validate_wrapped_key_for_recipient(self, value):
        """Validate wrapped key for recipient"""
        validate_wrapped_key(value)
        return value

