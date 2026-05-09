from django.contrib import admin

from .models import PasswordEntry


@admin.register(PasswordEntry)
class PasswordEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "website_url", "favorite", "updated_at")
    list_filter = ("favorite", "created_at", "updated_at")
    search_fields = ("title", "website_url", "owner__username")
    readonly_fields = ("id", "created_at", "updated_at")
