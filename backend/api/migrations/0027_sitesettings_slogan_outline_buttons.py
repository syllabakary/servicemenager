# Generated migration: slogan colors + outline buttons

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0026_sitesettings_banner_footer_button_border"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="button_outline_border_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Bordure des boutons type Connexion",
                max_length=7,
                null=True,
                verbose_name="Couleur bordure boutons outline",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="button_outline_text_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Texte des boutons type Connexion",
                max_length=7,
                null=True,
                verbose_name="Couleur texte boutons outline",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="button_outline_hover_bg_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Fond au survol des boutons type Connexion",
                max_length=7,
                null=True,
                verbose_name="Couleur fond hover boutons outline",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="site_name_part1_color",
            field=models.CharField(
                blank=True,
                default="#111827",
                help_text="Première partie du nom (ex. Services)",
                max_length=7,
                null=True,
                verbose_name="Couleur 1 du nom (slogan)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="site_name_part2_color",
            field=models.CharField(
                blank=True,
                default="#DC2626",
                help_text="Deuxième partie du nom (ex. Locaux)",
                max_length=7,
                null=True,
                verbose_name="Couleur 2 du nom (slogan)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="site_tagline_color",
            field=models.CharField(
                blank=True,
                default="#6B7280",
                help_text="Sous-titre sous le nom (ex. Votre partenaire de confiance)",
                max_length=7,
                null=True,
                verbose_name="Couleur du slogan (tagline)",
            ),
        ),
    ]
