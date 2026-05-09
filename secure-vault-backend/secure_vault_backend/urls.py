from django.contrib import admin
from django.urls import path, include
from .views import client_error, health, home
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home),
    path('api/health/', health),
    path('api/client-errors/', client_error),
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('api/files/', include('files_app.urls')),
    path('api/passwords/', include('passwords_app.urls')),
    path('', include('auth_app.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

