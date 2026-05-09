from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("files_app", "0008_securefile_iv_text"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="securefile",
            options={"ordering": ["-uploaded_at"]},
        ),
    ]
