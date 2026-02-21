# Generated migration to make service optional in QuoteRequest

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0020_sitesettings_smtp_config'),
    ]

    operations = [
        migrations.AlterField(
            model_name='quoterequest',
            name='service',
            field=models.ForeignKey(
                blank=True,
                help_text='Service demandé (optionnel)',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='quote_requests',
                to='api.service',
                verbose_name='Service'
            ),
        ),
    ]









