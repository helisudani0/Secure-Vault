from django.urls import path

from .views import PasswordEntryDetailView, PasswordEntryListCreateView

urlpatterns = [
    path("", PasswordEntryListCreateView.as_view(), name="password_entry_list"),
    path("<uuid:pk>/", PasswordEntryDetailView.as_view(), name="password_entry_detail"),
]
