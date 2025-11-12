from django.db import models


class ContentBlock(models.Model):
    """Modèle pour le contenu dynamique (Hero, Bannière, Témoignages, etc.)"""
    TYPE_CHOICES = [
        ('hero', 'Hero Section'),
        ('banner', 'Bannière promotionnelle'),
        ('testimonial', 'Témoignage'),
        ('footer', 'Footer'),
        ('how_it_works', 'Comment ça marche'),
    ]
    
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    contenu = models.JSONField(
        default=dict,
        help_text="Contenu structuré en JSON"
    )
    image = models.ImageField(upload_to='content/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    ordre = models.IntegerField(default=0, help_text="Ordre d'affichage")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', '-created_at']
        verbose_name = "Bloc de contenu"
        verbose_name_plural = "Blocs de contenu"

    def __str__(self):
        return f"{self.get_type_display()} - {self.titre or 'Sans titre'}"




