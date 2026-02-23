# Migration existante sur le serveur (conflit avec 0030_sitesettings_default_green)
# No-op pour unifier l'historique avec 0035_merge.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0029_sitesettings_logo_devis_pdf_colors"),
    ]

    operations = []
