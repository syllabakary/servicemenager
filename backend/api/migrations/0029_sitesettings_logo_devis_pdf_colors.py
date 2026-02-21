# Migration: couleurs zone logo, devis et PDF

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_sitesettings_section_colors'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='logo_area_bg_color',
            field=models.CharField(blank=True, default='', max_length=7, null=True, verbose_name='Fond zone logo (navbar)'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='logo_area_text_color',
            field=models.CharField(blank=True, default='', max_length=7, null=True, verbose_name='Texte zone logo (nom/slogan)'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='devis_pdf_primary_color',
            field=models.CharField(blank=True, default='', max_length=7, null=True, verbose_name='Couleur principale devis et PDF (titres, bordures)'),
        ),
    ]
