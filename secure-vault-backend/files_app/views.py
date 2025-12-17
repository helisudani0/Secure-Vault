# files_app/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import SecureFile, WrappedKey
from .serializers import SecureFileSerializer, FileListSerializer, WrappedKeySerializer
from django.http import FileResponse, Http404

class FileUploadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SecureFileSerializer

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        aes_key_owner_wrapped = request.data.get('aes_key_owner_wrapped')
        iv = request.data.get('iv')

        if not uploaded_file or not aes_key_owner_wrapped or not iv:
            return Response({'error': 'file, aes_key_owner_wrapped, iv required'}, status=400)

        file_obj = SecureFile.objects.create(
            owner=request.user,
            file=uploaded_file,
            original_name=uploaded_file.name,
            size=uploaded_file.size,
            aes_key_owner_wrapped=aes_key_owner_wrapped,
            iv=iv
        )
        return Response(SecureFileSerializer(file_obj).data, status=201)

class FileListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FileListSerializer

    def get_queryset(self):
        owned = SecureFile.objects.filter(owner=self.request.user)
        shared_ids = WrappedKey.objects.filter(recipient=self.request.user).values_list('file_id', flat=True)
        shared = SecureFile.objects.filter(id__in=shared_ids)
        return (owned | shared).distinct().order_by('-uploaded_at')

class FileDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk)
        if file_obj.owner != request.user and not WrappedKey.objects.filter(file=file_obj, recipient=request.user).exists():
            return Response({'error': 'Access denied'}, status=403)
        return FileResponse(file_obj.file.open('rb'), filename=file_obj.original_name)

class GetWrappedKeyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk)
        if file_obj.owner == request.user:
            return Response({'wrapped_key': file_obj.aes_key_owner_wrapped, 'iv': file_obj.iv})
        wk = WrappedKey.objects.filter(file=file_obj, recipient=request.user).first()
        if not wk:
            return Response({'error': 'No wrapped key found'}, status=403)
        return Response({'wrapped_key': wk.wrapped_key, 'iv': file_obj.iv})

class ShareFileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user)
        recipient_username = request.data.get('recipient_username')
        wrapped_key_for_recipient = request.data.get('wrapped_key_for_recipient')

        if not recipient_username or not wrapped_key_for_recipient:
            return Response({'error': 'recipient_username and wrapped_key_for_recipient required'}, status=400)
        if recipient_username == request.user.username:
            return Response({'error': 'Cannot share with yourself'}, status=400)

        from auth_app.models import CustomUser
        recipient = get_object_or_404(CustomUser, username=recipient_username)
        if not recipient.public_key:
            return Response({'error': 'Recipient has no public key'}, status=400)

        wk, _ = WrappedKey.objects.update_or_create(
            file=file_obj,
            recipient=recipient,
            defaults={'wrapped_key': wrapped_key_for_recipient}
        )
        return Response({'message': 'File shared successfully', 'wrapped_key_id': wk.id})

class FileDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        file_obj = get_object_or_404(SecureFile, pk=pk, owner=request.user)
        file_obj.file.delete(save=False)
        file_obj.delete()
        return Response({'message': 'Deleted'}, status=200)

class SharedWithMeView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WrappedKeySerializer

    def get_queryset(self):
        return WrappedKey.objects.filter(recipient=self.request.user)
