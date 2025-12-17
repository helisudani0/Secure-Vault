# auth_app/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.hashers import make_password
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
import os, base64

def encrypt_private_key(private_key, master_password):
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

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        master_password = validated_data['master_password']

        # Create user
        user = CustomUser.objects.create(
            username=username,
            password=make_password(password)
        )

        # Generate RSA key pair
        rsa_key = RSA.generate(2048)
        private_key = rsa_key.export_key()
        public_key = rsa_key.publickey().export_key().decode()
        encrypted_private = encrypt_private_key(private_key, master_password)

        user.public_key = public_key
        user.encrypted_private_key = encrypted_private
        user.save()
        return user
