# files_app/migrations/0006_add_indexes.py

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('files_app', '0005_alter_securefile_aes_key_owner_wrapped_and_more'),
    ]

    operations = [
        # Indexes for SecureFile
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['owner'], name='files_owner_idx'),
        ),
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['uploaded_at'], name='files_uploaded_idx'),
        ),
        migrations.AddIndex(
            model_name='securefile',
            index=models.Index(fields=['owner', 'uploaded_at'], name='files_owner_uploaded_idx'),
        ),
        
        # Indexes for WrappedKey
        migrations.AddIndex(
            model_name='wrappedkey',
            index=models.Index(fields=['recipient'], name='wrapped_recipient_idx'),
        ),
        migrations.AddIndex(
            model_name='wrappedkey',
            index=models.Index(fields=['file', 'recipient'], name='wrapped_file_recipient_idx'),
        ),
        migrations.AddIndex(
            model_name='wrappedkey',
            index=models.Index(fields=['created_at'], name='wrapped_created_idx'),
        ),
    ]
