# files_app/serializers.py

from rest_framework import serializers
from .models import SecureFile, WrappedKey

class SecureFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecureFile
        fields = ['id', 'original_name', 'size', 'uploaded_at', 'aes_key_owner_wrapped', 'iv']

class FileListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecureFile
        fields = ['id', 'original_name', 'size', 'uploaded_at']

class WrappedKeySerializer(serializers.ModelSerializer):
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    class Meta:
        model = WrappedKey
        fields = ['id', 'file', 'recipient', 'recipient_username', 'wrapped_key', 'created_at']
