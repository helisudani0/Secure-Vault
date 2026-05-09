# files_app/migrations/0007_file_management_features.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('files_app', '0006_add_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='securefile',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='securefile',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='securefile',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='securefile',
            name='auto_delete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='securefile',
            name='download_limit',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='securefile',
            name='download_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='wrappedkey',
            name='can_reshare',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='wrappedkey',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='FileAccessLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('upload', 'File Uploaded'), ('download', 'File Downloaded'), ('share', 'File Shared'), ('unshare', 'Share Removed'), ('delete', 'File Deleted'), ('restore', 'File Restored'), ('view_metadata', 'Metadata Viewed')], max_length=20)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('details', models.JSONField(blank=True, default=dict)),
                ('by_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='access_logs', to='files_app.securefile')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['owner', '-uploaded_at'], name='files_app_s_owner_id_f9c0_idx'),
        ),
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['is_deleted'], name='files_app_s_is_dele_6d3e_idx'),
        ),
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['expires_at'], name='files_app_s_expires__4e8a_idx'),
        ),
        migrations.AddIndex(
            model_name='wrappedkey',
            index=models.Index(fields=['recipient', '-created_at'], name='files_app_w_recipie_8f2b_idx'),
        ),
        migrations.AddIndex(
            model_name='wrappedkey',
            index=models.Index(fields=['expires_at'], name='files_app_w_expires__7c1d_idx'),
        ),
        migrations.AddIndex(
            model_name='fileaccesslog',
            index=models.Index(fields=['file', '-timestamp'], name='files_app_f_file_id_9a3d_idx'),
        ),
        migrations.AddIndex(
            model_name='fileaccesslog',
            index=models.Index(fields=['by_user', '-timestamp'], name='files_app_f_by_user_2f4e_idx'),
        ),
    ]
