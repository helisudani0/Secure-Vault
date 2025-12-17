# auth_app/urls.py

from django.urls import path
from .views import RegisterView, LoginView, ProfileView, register

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('register/', register, name='register'),
]
