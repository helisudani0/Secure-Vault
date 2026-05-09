from rest_framework import generics, permissions

from .models import PasswordEntry
from .serializers import PasswordEntrySerializer


class PasswordEntryListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordEntrySerializer
    pagination_class = None

    def get_queryset(self):
        return PasswordEntry.objects.filter(owner=self.request.user).order_by("-favorite", "-updated_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PasswordEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordEntrySerializer

    def get_queryset(self):
        return PasswordEntry.objects.filter(owner=self.request.user)
