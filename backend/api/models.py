from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from decimal import Decimal


class CustomUser(AbstractUser):
    """User personnalisé avec système de rôles"""
    ROLE_CHOICES = [
        ('SUPERADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('CLIENT', 'Client'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CLIENT',
        help_text="Rôle de l'utilisateur"
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_superadmin(self):
        return self.role == 'SUPERADMIN'
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_client(self):
        return self.role == 'CLIENT'


class Category(models.Model):
    """Modèle pour les catégories de services"""
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Nom de la catégorie"
    )
    show_in_navbar = models.BooleanField(
        default=True,
        verbose_name="Afficher dans la navbar",
        help_text="Si coché, cette catégorie apparaîtra dans le menu de navigation"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Service(models.Model):
    """Modèle Service selon spécifications"""
    name = models.CharField(max_length=200, verbose_name="Nom")
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    short_description = models.CharField(
        max_length=500,
        verbose_name="Description courte"
    )
    detailed_description = models.TextField(
        verbose_name="Description détaillée"
    )
    image = models.ImageField(
        upload_to='services/',
        blank=True,
        null=True,
        verbose_name="Image"
    )
    active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Actif",
        help_text="Si désactivé, n'apparaît pas dans les API publiques"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage"
    )
    # Catégorie du service
    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services',
        verbose_name="Catégorie",
        help_text="Catégorie du service"
    )
    # Informations de tarification et durée
    duration = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Durée",
        help_text="Ex: '2-4 heures', '1 journée', etc."
    )
    price_per_hour = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Prix par heure (€)",
        help_text="Prix en euros par heure"
    )
    price_label = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Label du prix",
        help_text="Ex: 'À partir de 25€/heure'"
    )
    # Note et avis
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name="Note",
        help_text="Note sur 5 (ex: 4.8)"
    )
    review_count = models.IntegerField(
        default=0,
        verbose_name="Nombre d'avis",
        help_text="Nombre total d'avis clients"
    )
    # Prestations incluses (JSON)
    included_services = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Prestations incluses",
        help_text="Liste des prestations incluses (format JSON)"
    )
    # Caractéristiques/Features (JSON)
    features = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Caractéristiques",
        help_text="Liste des caractéristiques avec checkmarks (format JSON)"
    )
    # Garanties (JSON)
    guarantees = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Garanties",
        help_text="Liste des garanties (format JSON)"
    )
    # Étapes du processus (JSON)
    process_steps = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Étapes du processus",
        help_text="Liste des étapes du processus (format JSON: [{'step': 1, 'title': '...', 'description': '...'}, ...])"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_services',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Service"
        verbose_name_plural = "Services"
        indexes = [
            models.Index(fields=['active', 'order']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def url(self):
        """URL pour le frontend"""
        return f"/services/{self.slug}/"


class Agency(models.Model):
    """Modèle Agency selon spécifications"""
    name = models.CharField(max_length=200, verbose_name="Nom")
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    address = models.TextField(verbose_name="Adresse")
    city = models.CharField(max_length=100, verbose_name="Ville")
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="Code postal")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        verbose_name="Latitude",
        help_text="Coordonnée GPS latitude"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        verbose_name="Longitude",
        help_text="Coordonnée GPS longitude"
    )
    active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Actif",
        help_text="Si désactivé, n'apparaît pas dans les API publiques"
    )
    details = models.TextField(
        blank=True,
        null=True,
        verbose_name="Détails",
        help_text="Informations complémentaires sur l'agence"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_agencies',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Agence"
        verbose_name_plural = "Agences"
        indexes = [
            models.Index(fields=['active']),
            models.Index(fields=['slug']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.name}-{self.city}")
        super().save(*args, **kwargs)
    
    @property
    def url(self):
        """URL pour le frontend"""
        return f"/agences/{self.slug}/"


class Contact(models.Model):
    """Modèle Contact selon spécifications"""
    name = models.CharField(max_length=200, verbose_name="Nom")
    role = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Rôle / Poste",
        help_text="Titre du poste (ex: Directeur, Responsable)"
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    agency = models.ForeignKey(
        Agency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts',
        verbose_name="Agence",
        help_text="Agence associée (vide si siège)"
    )
    is_headquarter = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Siège social",
        help_text="Contact du siège social (ex: Paris)"
    )
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_contacts',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_headquarter', 'name']
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"
        indexes = [
            models.Index(fields=['is_headquarter']),
            models.Index(fields=['agency']),
        ]
    
    def __str__(self):
        if self.is_headquarter:
            return f"{self.name} (Siège)"
        return f"{self.name} - {self.agency.name if self.agency else 'Sans agence'}"


class PageContent(models.Model):
    """Modèle PageContent selon spécifications"""
    key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Clé",
        help_text="Identifiant unique (ex: home_banner, about_text)"
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Titre"
    )
    body = models.TextField(
        verbose_name="Contenu",
        help_text="Contenu HTML ou texte"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Actif",
        help_text="Si désactivé, n'apparaît pas dans les API publiques"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_pages',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'key']
        verbose_name = "Contenu de page"
        verbose_name_plural = "Contenus de pages"
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['key']),
        ]
    
    def __str__(self):
        return f"{self.key} - {self.title or 'Sans titre'}"
