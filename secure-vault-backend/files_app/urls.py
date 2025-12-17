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

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='upload_file'),
    path('list/', FileListView.as_view(), name='file_list'),
    path('download/<uuid:pk>/', FileDownloadView.as_view(), name='file_download'),
    path('wrapped-key/<uuid:pk>/', GetWrappedKeyView.as_view(), name='get_wrapped_key'),
    path('share/<uuid:pk>/', ShareFileView.as_view(), name='share_file'),
    path('delete/<uuid:pk>/', FileDeleteView.as_view(), name='delete_file'),
    path('shared/', SharedWithMeView.as_view(), name='shared_files'),
]
