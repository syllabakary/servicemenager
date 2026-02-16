# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_alter_quoteformoption_options_quoteformoption_parent'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_host',
            field=models.CharField(blank=True, help_text="Adresse du serveur SMTP (ex: smtp.gmail.com)", max_length=255, null=True, verbose_name='Serveur SMTP'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_port',
            field=models.IntegerField(default=587, help_text='Port du serveur SMTP (587 pour TLS, 465 pour SSL)', verbose_name='Port SMTP'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_use_tls',
            field=models.BooleanField(default=True, help_text='Cocher si le serveur SMTP utilise TLS', verbose_name='Utiliser TLS'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_use_ssl',
            field=models.BooleanField(default=False, help_text='Cocher si le serveur SMTP utilise SSL', verbose_name='Utiliser SSL'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_username',
            field=models.CharField(blank=True, help_text="Adresse email utilisée pour envoyer les emails", max_length=255, null=True, verbose_name='Email expéditeur'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='smtp_password',
            field=models.CharField(blank=True, help_text="Mot de passe ou mot de passe d'application pour l'email expéditeur", max_length=255, null=True, verbose_name='Mot de passe SMTP'),
        ),
    ]







