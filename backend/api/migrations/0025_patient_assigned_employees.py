# Generated manually
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_alter_presence_scan_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='assigned_employees',
            field=models.ManyToManyField(
                blank=True,
                help_text='Employés assignés à ce patient',
                limit_choices_to={'role': 'EMPLOYE'},
                related_name='assigned_patients',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Employés assignés'
            ),
        ),
    ]






