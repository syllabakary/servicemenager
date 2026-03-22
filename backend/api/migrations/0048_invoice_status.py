from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_logo_signature'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='status',
            field=models.CharField(
                choices=[('DRAFT', 'Brouillon'), ('SENT', 'Envoyée'), ('PAID', 'Payée'), ('OVERDUE', 'En retard'), ('CANCELLED', 'Annulée')],
                default='DRAFT',
                max_length=20,
                verbose_name='Statut'
            ),
        ),
    ]
