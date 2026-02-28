# Rendre le champ client optionnel pour Patient

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0035_merge_0030_migrations"),
    ]

    operations = [
        migrations.AlterField(
            model_name="patient",
            name="client",
            field=models.ForeignKey(
                blank=True,
                help_text="Client propriétaire du patient (optionnel)",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="patients",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Client",
            ),
        ),
    ]
