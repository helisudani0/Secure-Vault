# Generated for Ciphra encrypted password entries

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PasswordEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=120)),
                ("website_url", models.URLField(blank=True)),
                ("encrypted_payload", models.TextField()),
                ("wrapped_key", models.TextField()),
                ("iv", models.TextField()),
                ("favorite", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="password_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
        migrations.AddIndex(
            model_name="passwordentry",
            index=models.Index(fields=["owner", "-updated_at"], name="password_owner_updated_idx"),
        ),
        migrations.AddIndex(
            model_name="passwordentry",
            index=models.Index(fields=["owner", "title"], name="password_owner_title_idx"),
        ),
        migrations.AddIndex(
            model_name="passwordentry",
            index=models.Index(fields=["favorite"], name="password_favorite_idx"),
        ),
    ]
