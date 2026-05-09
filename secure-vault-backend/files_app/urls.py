# files_app/urls.py

from django.urls import path
from .views import (
    FileUploadView,
    FileListView,
    FileDownloadView,
    ShareFileView,
    GetWrappedKeyView,
    FileDeleteView,
    SharedWithMeView,
)
from .views_file_management import (
    FileRestoreView,
    FileExpireView,
    FileDownloadLimitView,
    FileAccessLogView,
    UpdateShareSettingsView,
    RevokeShareView,
    TrashListView,
)

urlpatterns = [
    # Basic file operations
    path('upload/', FileUploadView.as_view(), name='upload_file'),
    path('list/', FileListView.as_view(), name='file_list'),
    path('download/<uuid:pk>/', FileDownloadView.as_view(), name='file_download'),
    path('wrapped-key/<uuid:pk>/', GetWrappedKeyView.as_view(), name='get_wrapped_key'),
    path('share/<uuid:pk>/', ShareFileView.as_view(), name='share_file'),
    path('delete/<uuid:pk>/', FileDeleteView.as_view(), name='delete_file'),
    path('shared/', SharedWithMeView.as_view(), name='shared_files'),
    
    # File management
    path('restore/<uuid:file_id>/', FileRestoreView.as_view(), name='restore_file'),
    path('expire/<uuid:file_id>/', FileExpireView.as_view(), name='set_expiration'),
    path('download-limit/<uuid:file_id>/', FileDownloadLimitView.as_view(), name='set_download_limit'),
    path('access-log/<uuid:file_id>/', FileAccessLogView.as_view(), name='file_access_log'),
    path('share-settings/<uuid:file_id>/<int:recipient_id>/', UpdateShareSettingsView.as_view(), name='update_share_settings'),
    path('revoke-share/<uuid:file_id>/<int:recipient_id>/', RevokeShareView.as_view(), name='revoke_share'),
    path('trash/', TrashListView.as_view(), name='trash_list'),
]

