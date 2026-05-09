from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("files_app", "0007_file_management_features"),
    ]

    operations = [
        migrations.AlterField(
            model_name="securefile",
            name="iv",
            field=models.TextField(default=""),
        ),
    ]
