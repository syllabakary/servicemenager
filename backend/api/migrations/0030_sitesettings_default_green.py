# Migration : mettre les couleurs par défaut (rouge) existantes en vert #087A00

from django.db import migrations


def set_default_green(apps, schema_editor):
    """Met à jour les SiteSettings qui ont encore le rouge par défaut vers le vert."""
    SiteSettings = apps.get_model("api", "SiteSettings")
    red_primary = "#DC2626"
    red_primary_lower = "#dc2626"
    for s in SiteSettings.objects.all():
        primary = (s.primary_color or "").strip()
        if primary in (red_primary, red_primary_lower):
            s.primary_color = "#087A00"
            s.secondary_color = "#066300"
            s.tertiary_color = "#044000"
            s.button_primary_color = "#087A00"
            s.button_primary_hover_color = "#066300"
            s.text_primary_color = "#087A00"
            s.text_link_color = "#087A00"
            s.text_link_hover_color = "#066300"
            if s.banner_bg_color in (red_primary, red_primary_lower, None, ""):
                s.banner_bg_color = "#087A00"
            if (s.footer_bg_color or "").strip() == "#FEF2F2":
                s.footer_bg_color = "#F0FDF4"
            if s.footer_link_color in (red_primary, red_primary_lower, None, ""):
                s.footer_link_color = "#087A00"
            if s.footer_link_hover_color in ("#B91C1C", "#b91c1c", None, ""):
                s.footer_link_hover_color = "#066300"
            if (s.footer_border_color or "").strip() == "#FECACA":
                s.footer_border_color = "#BBF7D0"
            if s.button_outline_border_color in (red_primary, red_primary_lower, None, ""):
                s.button_outline_border_color = "#087A00"
            if s.button_outline_text_color in (red_primary, red_primary_lower, None, ""):
                s.button_outline_text_color = "#087A00"
            if s.button_outline_hover_bg_color in (red_primary, red_primary_lower, None, ""):
                s.button_outline_hover_bg_color = "#087A00"
            if s.site_name_part2_color in (red_primary, red_primary_lower, None, ""):
                s.site_name_part2_color = "#087A00"
            s.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0029_sitesettings_logo_devis_pdf_colors"),
    ]

    operations = [
        migrations.RunPython(set_default_green, noop),
    ]
