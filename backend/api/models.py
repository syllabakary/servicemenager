from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Service(models.Model):
    """Modèle pour les services proposés"""
    nom = models.CharField(max_length=200)
    description = models.TextField()
    description_longue = models.TextField(blank=True, null=True)
    icone = models.CharField(
        max_length=50,
        help_text="Nom de l'icône Lucide (ex: Sparkles, Baby, TreeDeciduous)"
    )
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    avantages = models.JSONField(
        default=list,
        help_text="Liste des avantages (array de strings)"
    )
    duree = models.CharField(
        max_length=100,
        help_text="Ex: '2-4 heures', 'Sur mesure'"
    )
    prix = models.CharField(
        max_length=100,
        help_text="Ex: 'À partir de 25€/heure'"
    )
    note = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=0
    )
    nombre_avis = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.nom


class Agence(models.Model):
    """Modèle pour les agences partenaires"""
    nom = models.CharField(max_length=200)
    description = models.TextField()
    ville = models.CharField(max_length=100)
    adresse = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    horaires = models.CharField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to='agences/')
    services = models.ManyToManyField(
        Service,
        related_name='agences',
        help_text="Services proposés par cette agence"
    )
    note = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    nombre_avis = models.IntegerField(default=0)
    annee_experience = models.IntegerField(default=0)
    nombre_clients = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Agence"
        verbose_name_plural = "Agences"

    def __str__(self):
        return f"{self.nom} - {self.ville}"


class Quote(models.Model):
    """Modèle pour les demandes de devis"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('traite', 'Traité'),
        ('annule', 'Annulé'),
    ]
    
    localisation = models.CharField(max_length=200)
    service = models.CharField(max_length=200)
    type_aide = models.CharField(max_length=200, blank=True, null=True)
    sous_type_aide = models.CharField(max_length=200, blank=True, null=True)
    besoins = models.JSONField(default=list)
    destinataire = models.CharField(max_length=50)
    nom = models.CharField(max_length=200)
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande de devis"
        verbose_name_plural = "Demandes de devis"

    def __str__(self):
        return f"Devis de {self.nom} - {self.service}"


class Contact(models.Model):
    """Modèle pour les messages de contact"""
    nom = models.CharField(max_length=200)
    email = models.EmailField()
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"

    def __str__(self):
        return f"{self.nom} - {self.sujet}"




