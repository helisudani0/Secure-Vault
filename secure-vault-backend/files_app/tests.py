import base64
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from auth_app.models import CustomUser
from .models import SecureFile, WrappedKey


def b64(value):
    return base64.b64encode(value).decode("ascii")


TEST_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class FileApiTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username="owner_user",
            password="StrongPass123!",
            public_key="A" * 512,
            encrypted_private_key={"kdf": "PBKDF2"},
        )
        self.recipient = CustomUser.objects.create_user(
            username="recipient_user",
            password="StrongPass123!",
            public_key="B" * 512,
            encrypted_private_key={"kdf": "PBKDF2"},
        )
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def upload_file(self):
        return self.client.post(
            reverse("upload_file"),
            {
                "file": SimpleUploadedFile(
                    "report.txt",
                    b"encrypted file bytes",
                    content_type="application/octet-stream",
                ),
                "aes_key_owner_wrapped": b64(b"wrapped-key"),
                "iv": b64(b"123456789012"),
            },
            format="multipart",
        )

    def test_upload_list_download_and_soft_delete_file(self):
        upload = self.upload_file()
        self.assertEqual(upload.status_code, status.HTTP_201_CREATED)

        file_id = upload.data["id"]
        listing = self.client.get(reverse("file_list"))
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]["original_name"], "report.txt")

        download = self.client.get(reverse("file_download", kwargs={"pk": file_id}))
        self.assertEqual(download.status_code, status.HTTP_200_OK)
        self.assertEqual(download["X-Wrapped-Key"], b64(b"wrapped-key"))

        deleted = self.client.delete(reverse("delete_file", kwargs={"pk": file_id}))
        self.assertEqual(deleted.status_code, status.HTTP_200_OK)
        self.assertTrue(SecureFile.objects.get(id=file_id).is_deleted)

    def test_owner_can_share_file_with_recipient(self):
        upload = self.upload_file()
        file_id = upload.data["id"]

        response = self.client.post(
            reverse("share_file", kwargs={"pk": file_id}),
            {
                "recipient_username": self.recipient.username,
                "wrapped_key_for_recipient": b64(b"recipient-wrapped-key"),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            WrappedKey.objects.filter(file_id=file_id, recipient=self.recipient).exists()
        )
