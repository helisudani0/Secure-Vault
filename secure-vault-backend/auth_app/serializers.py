# auth_app/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.hashers import make_password
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
import os, base64
from .validators import (
    validate_username,
    validate_password_strength,
    validate_master_password_strength,
)


def encrypt_private_key(private_key, master_password):
    """
    Encrypt user's private key with their master password.
    Uses PBKDF2 + AES-GCM with 390,000 iterations for key derivation.
    """
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = PBKDF2(master_password, salt, dkLen=32, count=390000)
    cipher = AES.new(key, AES.MODE_GCM, iv)
    ciphertext, tag = cipher.encrypt_and_digest(private_key)
    return {
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "tag": base64.b64encode(tag).decode(),
    }


class RegisterSerializer(serializers.ModelSerializer):
    master_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'master_password']

    def validate_username(self, value):
        """Validate username format"""
        validate_username(value)
        
        # Check if username already exists
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        
        return value

    def validate_password(self, value):
        """Validate password strength"""
        validate_password_strength(value)
        return value

    def validate_master_password(self, value):
        """Validate master password strength"""
        validate_master_password_strength(value)
        return value

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        master_password = validated_data['master_password']

        # Create user with hashed password
        user = CustomUser.objects.create(
            username=username,
            password=make_password(password)
        )

        # Generate RSA-4096 key pair
        rsa_key = RSA.generate(4096)
        private_key = rsa_key.export_key()
        public_key = rsa_key.publickey().export_key().decode()
        
        # Encrypt private key with master password
        encrypted_private = encrypt_private_key(private_key, master_password)

        user.public_key = public_key
        user.encrypted_private_key = encrypted_private
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login (no model changes needed)"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        """Validate username format"""
        validate_username(value)
        return value

    def validate_password(self, value):
        """Validate password"""
        if not value:
            raise serializers.ValidationError("Password is required")
        return value

