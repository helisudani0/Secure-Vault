from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("auth_app", "0003_customuser_auth_enhancements"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="customuser",
            options={
                "ordering": ["-created_at"],
                "verbose_name": "User",
                "verbose_name_plural": "Users",
            },
        ),
    ]
