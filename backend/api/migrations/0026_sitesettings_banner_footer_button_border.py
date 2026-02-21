# Generated migration for SiteSettings: banner, footer, button border

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0025_patient_assigned_employees"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="banner_bg_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Fond du bandeau promotionnel (client, admin, employé)",
                max_length=7,
                null=True,
                verbose_name="Couleur de fond de la bannière",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="banner_text_color",
            field=models.CharField(
                blank=True,
                default="#FFFFFF",
                help_text="Texte du bandeau promotionnel",
                max_length=7,
                null=True,
                verbose_name="Couleur du texte de la bannière",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="footer_bg_color",
            field=models.CharField(
                blank=True,
                default="#FEF2F2",
                help_text="Fond du pied de page (client, admin, employé)",
                max_length=7,
                null=True,
                verbose_name="Couleur de fond du footer",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="footer_text_color",
            field=models.CharField(
                blank=True,
                default="#374151",
                help_text="Texte principal du footer",
                max_length=7,
                null=True,
                verbose_name="Couleur du texte du footer",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="footer_link_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Liens et icônes du footer",
                max_length=7,
                null=True,
                verbose_name="Couleur des liens du footer",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="footer_link_hover_color",
            field=models.CharField(
                blank=True,
                default="#B91C1C",
                help_text="Au survol des liens du footer",
                max_length=7,
                null=True,
                verbose_name="Couleur hover des liens du footer",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="footer_border_color",
            field=models.CharField(
                blank=True,
                default="#FECACA",
                help_text="Bordures et séparateurs du footer",
                max_length=7,
                null=True,
                verbose_name="Couleur des bordures du footer",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="button_border_color",
            field=models.CharField(
                blank=True,
                help_text="Bordure des boutons principaux (vide = pas de bordure)",
                max_length=7,
                null=True,
                verbose_name="Couleur de la bordure des boutons",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="button_border_width",
            field=models.PositiveIntegerField(
                default=0,
                help_text="0 = pas de bordure",
                verbose_name="Épaisseur bordure boutons (px)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="button_border_radius",
            field=models.CharField(
                blank=True,
                default="0.375rem",
                help_text="Ex: 0.375rem, 0.5rem, 9999px (pilule)",
                max_length=20,
                null=True,
                verbose_name="Rayon des coins des boutons",
            ),
        ),
    ]
