from django.contrib import admin
from .models import FileAccessLog, SecureFile, WrappedKey


@admin.register(SecureFile)
class SecureFileAdmin(admin.ModelAdmin):
    list_display = ("original_name", "owner", "size", "uploaded_at", "is_deleted", "download_count")
    list_filter = ("is_deleted", "auto_delete", "uploaded_at")
    search_fields = ("original_name", "owner__username")
    readonly_fields = ("id", "uploaded_at", "deleted_at", "download_count")


@admin.register(WrappedKey)
class WrappedKeyAdmin(admin.ModelAdmin):
    list_display = ("file", "recipient", "created_at", "expires_at", "can_reshare")
    search_fields = ("file__original_name", "recipient__username")
    readonly_fields = ("created_at",)


@admin.register(FileAccessLog)
class FileAccessLogAdmin(admin.ModelAdmin):
    list_display = ("file", "action", "by_user", "ip_address", "timestamp")
    list_filter = ("action", "timestamp")
    search_fields = ("file__original_name", "by_user__username", "ip_address")
    readonly_fields = ("id", "timestamp")
