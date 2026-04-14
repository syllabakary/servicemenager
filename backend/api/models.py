from django.db import models
from django.db.models import Avg
from django.db.utils import OperationalError
from django.core.exceptions import FieldDoesNotExist
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from decimal import Decimal


class CustomUser(AbstractUser):
    """User personnalisé avec système de rôles"""
    ROLE_CHOICES = [
        ('SUPERADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('EMPLOYE', 'Employé'),
        ('CLIENT', 'Client'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CLIENT',
        help_text="Rôle de l'utilisateur"
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    matricule = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="Matricule",
        help_text="Matricule unique pour les employés (utilisé pour la connexion)"
    )
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        verbose_name="Créé par",
        help_text="Utilisateur qui a créé ce compte"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Sécurité : blocage de compte après tentatives échouées
    failed_login_attempts = models.IntegerField(default=0, verbose_name="Tentatives échouées")
    locked_until = models.DateTimeField(null=True, blank=True, verbose_name="Bloqué jusqu'à")

    # Sécurité : détection nouvelle IP
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="Dernière IP")

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['matricule']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_superadmin(self):
        return self.role == 'SUPERADMIN'
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_employe(self):
        return self.role == 'EMPLOYE'
    
    @property
    def is_client(self):
        return self.role == 'CLIENT'
    
    def save(self, *args, **kwargs):
        # Le matricule doit être renseigné manuellement pour les employés
        # Plus de génération automatique
        super().save(*args, **kwargs)


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
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

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
    currency = models.CharField(
        max_length=10,
        choices=[
            ('EUR', 'Euro (€)'),
            ('USD', 'Dollar ($)'),
            ('FCFA', 'Franc CFA (FCFA)'),
        ],
        default='EUR',
        verbose_name="Devise",
        help_text="Devise pour l'affichage des prix"
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Numéro de contact",
        help_text="Numéro de téléphone spécifique pour ce service (optionnel)"
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
    show_reviews = models.BooleanField(
        default=True,
        verbose_name="Afficher les avis",
        help_text="Si désactivé, la section avis ne sera pas affichée sur la page de détail"
    )
    show_faq = models.BooleanField(
        default=True,
        verbose_name="Afficher les FAQ",
        help_text="Si désactivé, la section FAQ ne sera pas affichée sur la page de détail"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Icône",
        help_text="Nom de l'icône (ex: FaBroom, FaBaby). Vide = auto selon le nom du service."
    )
    show_icon = models.BooleanField(
        default=True,
        verbose_name="Afficher l'icône",
        help_text="Si désactivé, l'icône ne sera pas affichée sur les pages publiques"
    )
    show_pricing = models.BooleanField(
        default=True,
        verbose_name="Afficher la tarification",
        help_text="Si désactivé, le prix et la durée ne seront pas affichés sur les pages publiques"
    )
    # Relation Many-to-Many avec les agences
    agencies = models.ManyToManyField(
        'Agency',
        related_name='services',
        blank=True,
        verbose_name="Agences",
        help_text="Agences où ce service est disponible"
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
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

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
    horaires = models.TextField(
        blank=True,
        null=True,
        verbose_name="Horaires d'ouverture",
        help_text="Ex. : Lun-Ven 9h-18h, Sam 9h-12h. Texte libre.",
    )
    opening_hours = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Horaires d'ouverture (structurés)",
        help_text='Ex. : {"lundi": {"open": true, "start": "09:00", "end": "18:00"}, ...}',
    )
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
    image = models.ImageField(
        upload_to='agencies/',
        blank=True,
        null=True,
        verbose_name="Image",
        help_text="Image de l'agence"
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
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

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
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

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
    BUTTON_LINK_CHOICES = [
        ('', 'Pas de bouton'),
        ('devis', 'Devis personnalisé (/devis)'),
        ('services', 'Services (/services)'),
        ('agences', 'Agences (/agences)'),
        ('custom', 'Autre (URL personnalisée)'),
    ]
    button_link_type = models.CharField(
        max_length=20,
        choices=BUTTON_LINK_CHOICES,
        blank=True,
        default='devis',
        verbose_name='Destination du bouton',
        help_text="Où mène le bouton « J'en profite »",
    )
    button_text = models.CharField(
        max_length=80,
        blank=True,
        default="J'en profite !",
        verbose_name='Texte du bouton',
    )
    button_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL personnalisée',
        help_text="Utilisé uniquement si destination = Autre",
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


class QuoteRequest(models.Model):
    """Modèle pour les demandes de devis/réservation"""
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('CONTACTED', 'Contacté'),
        ('QUOTED', 'Devis envoyé'),
        ('ACCEPTED', 'Accepté'),
        ('REJECTED', 'Refusé'),
        ('COMPLETED', 'Terminé'),
    ]
    
    CIVILITY_CHOICES = [
        ('M.', 'Monsieur'),
        ('Mme', 'Madame'),
        ('', 'Non précisé'),
    ]

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='quote_requests',
        verbose_name="Service",
        null=True,
        blank=True,
        help_text="Service demandé (optionnel)"
    )
    patient = models.ForeignKey(
        'Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_requests',
        verbose_name="Patient / Client enregistré",
        help_text="Lier ce devis à un patient existant (optionnel)"
    )
    # Informations de localisation
    location = models.CharField(
        max_length=500,
        verbose_name="Localisation",
        help_text="Adresse complète du client"
    )
    location_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Latitude"
    )
    location_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="Longitude"
    )
    # Informations client
    civility = models.CharField(
        max_length=10,
        choices=CIVILITY_CHOICES,
        default='',
        blank=True,
        verbose_name="Civilité",
        help_text="Civilité du client (Monsieur, Madame)"
    )
    client_name = models.CharField(
        max_length=200,
        verbose_name="Nom complet"
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de naissance",
        help_text="Date de naissance du bénéficiaire"
    )
    client_email = models.EmailField(
        verbose_name="Email"
    )
    client_phone = models.CharField(
        max_length=20,
        verbose_name="Téléphone"
    )
    # Heures et tarif souhaités (renseignés par le client dans le formulaire)
    hours_per_month = models.DecimalField(
        max_digits=6, decimal_places=1,
        null=True, blank=True,
        verbose_name="Nombre d'heures souhaitées / mois",
        help_text="Nombre d'heures par mois indiqué par le client"
    )
    hourly_rate_client = models.DecimalField(
        max_digits=6, decimal_places=2,
        null=True, blank=True,
        verbose_name="Tarif horaire souhaité (€)",
        help_text="Tarif horaire indiqué par le client"
    )
    # Informations supplémentaires (JSON)
    additional_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Informations supplémentaires",
        help_text="Informations dynamiques collectées dans le formulaire"
    )
    # Prix calculé depuis les choix du formulaire
    calculated_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        blank=True,
        null=True,
        verbose_name="Prix calculé",
        help_text="Prix calculé automatiquement depuis les choix du formulaire"
    )
    # Réduction en pourcentage
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        blank=True,
        null=True,
        verbose_name="Réduction (%)",
        help_text="Réduction en pourcentage appliquée au montant total"
    )
    # Remise sur la partie A (client direct, occasion spéciale)
    remise_partie_a = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        blank=True,
        null=True,
        verbose_name="Remise Partie A (%)",
        help_text="Remise en pourcentage accordée sur la partie A"
    )
    remise_partie_a_commentaire = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Motif de la remise Partie A",
        help_text="Ex: Fête de fin d'année, offre spéciale..."
    )
    # Taux de prise en charge sur la partie B (client indirect / entreprise)
    taux_prise_en_charge = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        blank=True,
        null=True,
        verbose_name="Taux prise en charge (%)",
        help_text="Pourcentage pris en charge par l'entreprise sur la partie B"
    )
    # Statut et suivi
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True,
        verbose_name="Statut"
    )
    admin_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes admin",
        help_text="Notes internes pour le suivi"
    )
    contacted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de contact"
    )
    quoted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'envoi du devis"
    )
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)
    created_by_user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_requests',
        verbose_name="Utilisateur créateur"
    )
    
    class Meta:
        verbose_name = "Demande de devis"
        verbose_name_plural = "Demandes de devis"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['service', 'status']),
        ]
    
    def __str__(self):
        return f"Devis {self.id} - {self.client_name} - {self.service.name}"


class QuoteLine(models.Model):
    """Lignes du tableau tarifaire d'un devis (sections A et B)"""
    CATEGORY_CHOICES = [
        ('A', 'A) Sans prise en charge'),
        ('B', 'B) Avec prise en charge'),
        ('TOTAL', 'Total'),
        ('FOOTER', 'Pied de tableau'),
    ]

    quote_request = models.ForeignKey(
        QuoteRequest,
        on_delete=models.CASCADE,
        related_name='lines',
        verbose_name="Devis"
    )
    category = models.CharField(
        max_length=10,
        choices=CATEGORY_CHOICES,
        default='A',
        verbose_name="Catégorie"
    )
    label = models.CharField(
        max_length=300,
        verbose_name="Libellé de la prestation"
    )
    notes = models.CharField(
        max_length=300,
        blank=True,
        default='',
        verbose_name="Notes / précisions",
        help_text="Ex: tous les jours sauf Dimanche, bonification 25%..."
    )
    hours = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Nombre d'heures",
        help_text="Ex: 52 heures/mois, Soit (2 heures / J), /"
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Tarif horaire (€)"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Total (€)"
    )
    total_display = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Affichage total personnalisé",
        help_text="Si rempli, remplace le total calculé dans l'affichage (ex: /, 00,00€)"
    )
    is_bold = models.BooleanField(
        default=False,
        verbose_name="Ligne en gras"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordre d'affichage"
    )

    class Meta:
        verbose_name = "Ligne de devis"
        verbose_name_plural = "Lignes de devis"
        ordering = ['order']

    def __str__(self):
        return f"[{self.category}] {self.label}"


class QuoteFormStep(models.Model):
    """Modèle pour les étapes du formulaire de devis par service"""
    STEP_TYPE_CHOICES = [
        ('SERVICE_SELECTION', 'Sélection du service'),
        ('LOCATION', 'Localisation'),
        ('SINGLE_CHOICE', 'Choix unique'),
        ('MULTIPLE_CHOICE', 'Choix multiples'),
        ('TEXT_INPUT', 'Saisie texte'),
        ('CONTACT', 'Coordonnées de contact'),
    ]
    
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='quote_form_steps',
        verbose_name="Service",
        help_text="Service associé à cette étape"
    )
    step_type = models.CharField(
        max_length=50,
        choices=STEP_TYPE_CHOICES,
        verbose_name="Type d'étape"
    )
    title = models.CharField(
        max_length=200,
        verbose_name="Titre de l'étape",
        help_text="Ex: 'Quel type d'aide souhaitez-vous ?'"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Description",
        help_text="Description ou instructions pour cette étape"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre",
        help_text="Ordre d'affichage de l'étape"
    )
    required = models.BooleanField(
        default=True,
        verbose_name="Obligatoire"
    )
    field_key = models.CharField(
        max_length=100,
        verbose_name="Clé du champ",
        help_text="Clé utilisée pour stocker la réponse (ex: 'typeAide', 'besoins')"
    )
    active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Étape du formulaire de devis"
        verbose_name_plural = "Étapes des formulaires de devis"
        ordering = ['service', 'order']
        unique_together = ['service', 'field_key']
    
    def __str__(self):
        return f"{self.service.name} - {self.title} (Ordre: {self.order})"


class QuoteFormOption(models.Model):
    """Modèle pour les options de choix dans les étapes du formulaire avec support hiérarchique"""
    step = models.ForeignKey(
        QuoteFormStep,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name="Étape"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='sub_options',
        null=True,
        blank=True,
        verbose_name="Option parente",
        help_text="Option parente pour créer une hiérarchie infinie de sous-options"
    )
    label = models.CharField(
        max_length=200,
        verbose_name="Libellé",
        help_text="Texte affiché pour cette option"
    )
    value = models.CharField(
        max_length=200,
        verbose_name="Valeur",
        help_text="Valeur stockée quand cette option est sélectionnée"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Prix (€)",
        help_text="Prix associé à cette option"
    )
    price_enabled = models.BooleanField(
        default=True,
        verbose_name="Prix activé",
        help_text="Si activé, le prix sera ajouté au total. Si désactivé, le prix sera ignoré même s'il est défini."
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage"
    )
    active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    allow_custom_text = models.BooleanField(
        default=False,
        verbose_name="Permettre texte personnalisé",
        help_text="Si activé, l'utilisateur peut saisir un texte personnalisé"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Option du formulaire"
        verbose_name_plural = "Options des formulaires"
        ordering = ['step', 'order', 'id']  # Ne pas inclure 'parent' pour éviter la boucle infinie
    
    def __str__(self):
        parent_info = f" (sous-option de {self.parent.label})" if self.parent else ""
        return f"{self.step.title} - {self.label}{parent_info} ({self.price}€)"
    
    def get_all_sub_options(self):
        """Récupère récursivement toutes les sous-options"""
        sub_options = list(self.sub_options.filter(active=True).order_by('order'))
        for sub_option in sub_options:
            sub_option.nested_sub_options = sub_option.get_all_sub_options()
        return sub_options


class Invoice(models.Model):
    """Modèle pour les factures générées à partir des devis"""
    quote_request = models.OneToOneField(
        QuoteRequest,
        on_delete=models.CASCADE,
        related_name='invoice',
        null=True,
        blank=True,
        verbose_name="Demande de devis",
        help_text="Devis associé à cette facture (optionnel)"
    )
    patient = models.ForeignKey(
        'Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name="Patient",
        help_text="Patient directement associé (si pas de devis)"
    )
    client_name_libre = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Nom client (libre)",
        help_text="Nom du client si pas de devis ni patient"
    )
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        blank=True,
        null=True,
        verbose_name="Numéro de facture",
        help_text="Numéro unique de la facture (ex: FACT-2024-001)"
    )
    # Informations de facturation
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Sous-total",
        help_text="Montant HT"
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name="Taux de TVA (%)",
        help_text="Taux de TVA en pourcentage (ex: 20.00 pour 20%)"
    )
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name="Montant TVA",
        help_text="Montant de la TVA"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Total TTC",
        help_text="Montant total TTC"
    )
    currency = models.CharField(
        max_length=10,
        default='EUR',
        choices=[
            ('EUR', 'Euro (€)'),
            ('USD', 'Dollar ($)'),
            ('FCFA', 'Franc CFA (FCFA)'),
        ],
        verbose_name="Devise"
    )
    # Statut
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('SENT', 'Envoyée'),
        ('PAID', 'Payée'),
        ('UNPAID', 'Impayée'),
        ('OVERDUE', 'En retard'),
        ('CANCELLED', 'Annulée'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name="Statut"
    )
    # Dates
    invoice_date = models.DateField(
        verbose_name="Date de facturation",
        help_text="Date d'émission de la facture"
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date d'échéance",
        help_text="Date limite de paiement (optionnel)"
    )
    # Notes et conditions
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes",
        help_text="Notes additionnelles sur la facture"
    )
    payment_terms = models.TextField(
        blank=True,
        null=True,
        verbose_name="Conditions de paiement",
        help_text="Conditions de paiement (ex: Paiement à 30 jours)"
    )
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_invoices',
        verbose_name="Créé par"
    )
    
    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['quote_request']),
            models.Index(fields=['-invoice_date']),
        ]
    
    def get_client_name(self):
        if self.quote_request:
            return self.quote_request.client_name
        if self.patient:
            return f"{self.patient.first_name} {self.patient.last_name}"
        return self.client_name_libre or "—"

    def get_client_email(self):
        if self.quote_request:
            return self.quote_request.client_email
        if self.patient:
            return self.patient.email or ""
        return ""

    def __str__(self):
        return f"Facture {self.invoice_number} - {self.get_client_name()}"

    def save(self, *args, **kwargs):
        # Générer automatiquement le numéro de facture s'il n'existe pas
        if not self.invoice_number:
            from django.utils import timezone
            import re
            year = timezone.now().year
            prefix = f"FACT-{year}-"
            existing = Invoice.objects.filter(invoice_number__startswith=prefix).values_list('invoice_number', flat=True)
            max_seq = 0
            for num in existing:
                match = re.search(r'(\d+)$', num)
                if match:
                    max_seq = max(max_seq, int(match.group(1)))
            self.invoice_number = f"{prefix}{max_seq + 1:04d}"

        # Si le subtotal est 0 et qu'on a un quote_request, essayer de récupérer le prix du service
        if self.subtotal == 0 and self.quote_request and self.quote_request.service:
            if self.quote_request.service.price_per_hour:
                self.subtotal = self.quote_request.service.price_per_hour
        
        # Calculer automatiquement le total si nécessaire
        subtotal_d = Decimal(str(self.subtotal)) if self.subtotal else Decimal('0.00')
        tax_rate_d = Decimal(str(self.tax_rate)) if self.tax_rate else Decimal('0.00')

        if not self.tax_amount and tax_rate_d:
            self.tax_amount = ((subtotal_d * tax_rate_d) / 100).quantize(Decimal('0.01'))

        tax_amount_d = Decimal(str(self.tax_amount)) if self.tax_amount else Decimal('0.00')
        if not self.total or self.total == 0:
            self.total = (subtotal_d + tax_amount_d).quantize(Decimal('0.01'))
        
        super().save(*args, **kwargs)


class ServiceReview(models.Model):
    """Modèle pour les avis clients sur les services"""
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name="Service"
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='service_reviews',
        verbose_name="Utilisateur"
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Note",
        help_text="Note de 1 à 5 étoiles"
    )
    comment = models.TextField(
        verbose_name="Commentaire",
        help_text="Commentaire du client"
    )
    client_name = models.CharField(
        max_length=200,
        verbose_name="Nom du client",
        help_text="Nom affiché (peut être anonyme)"
    )
    client_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email du client"
    )
    approved = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Approuvé",
        help_text="L'avis doit être approuvé par un admin avant d'être affiché"
    )
    display_on_page = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Afficher sur la page",
        help_text="Si désactivé, l'avis ne sera pas affiché sur la page de détail même s'il est approuvé"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Avis client"
        verbose_name_plural = "Avis clients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', 'approved']),
            models.Index(fields=['approved', '-created_at']),
        ]
    
    def __str__(self):
        return f"Avis de {self.client_name} sur {self.service.name} ({self.rating}/5)"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Mettre à jour la note moyenne et le nombre d'avis du service
        self.update_service_rating()
    
    def update_service_rating(self):
        """Met à jour la note moyenne et le nombre d'avis du service"""
        approved_reviews = ServiceReview.objects.filter(
            service=self.service,
            approved=True
        )
        count = approved_reviews.count()
        if count > 0:
            avg_rating = approved_reviews.aggregate(
                avg=Avg('rating')
            )['avg']
            self.service.rating = Decimal(str(round(avg_rating, 1)))
            self.service.review_count = count
            self.service.save(update_fields=['rating', 'review_count'])


class ServiceFAQ(models.Model):
    """Modèle pour les questions fréquentes sur les services"""
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='faqs',
        verbose_name="Service"
    )
    question = models.CharField(
        max_length=500,
        verbose_name="Question"
    )
    answer = models.TextField(
        verbose_name="Réponse"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage"
    )
    active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Actif",
        help_text="Si désactivé, n'apparaît pas sur le site"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Question fréquente"
        verbose_name_plural = "Questions fréquentes"
        ordering = ['order', 'question']
        indexes = [
            models.Index(fields=['service', 'active', 'order']),
        ]
    
    def __str__(self):
        return f"FAQ: {self.question[:50]}..."


class SiteSettings(models.Model):
    """Modèle pour les paramètres du site (couleurs, logo, etc.)"""
    # Couleurs principales
    primary_color = models.CharField(
        max_length=7,
        default="#087A00",
        verbose_name="Couleur principale",
        help_text="Couleur principale (format hex, ex: #087A00)"
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#066300",
        verbose_name="Couleur secondaire",
        help_text="Couleur secondaire pour dégradés et hover (format hex, ex: #066300)"
    )
    tertiary_color = models.CharField(
        max_length=7,
        default="#044000",
        verbose_name="Couleur tertiaire",
        help_text="Couleur tertiaire pour hover et états actifs (format hex, ex: #044000)"
    )
    # Couleurs des boutons
    button_primary_color = models.CharField(
        max_length=7,
        default="#087A00",
        verbose_name="Couleur des boutons principaux",
        help_text="Couleur de fond des boutons principaux (CTA, actions importantes) - Si vide, utilise la couleur principale"
    )
    button_primary_hover_color = models.CharField(
        max_length=7,
        default="#066300",
        verbose_name="Couleur hover des boutons principaux",
        help_text="Couleur au survol des boutons principaux - Si vide, utilise la couleur secondaire"
    )
    button_text_color = models.CharField(
        max_length=7,
        default="#FFFFFF",
        verbose_name="Couleur du texte des boutons",
        help_text="Couleur du texte à l'intérieur des boutons (généralement blanc #FFFFFF)"
    )
    # Couleurs des textes
    text_primary_color = models.CharField(
        max_length=7,
        default="#087A00",
        verbose_name="Couleur des textes importants",
        help_text="Couleur des textes importants et accents (format hex, ex: #087A00)"
    )
    text_link_color = models.CharField(
        max_length=7,
        default="#087A00",
        verbose_name="Couleur des liens",
        help_text="Couleur des liens cliquables dans le contenu - Si vide, utilise la couleur principale"
    )
    text_link_hover_color = models.CharField(
        max_length=7,
        default="#066300",
        verbose_name="Couleur hover des liens",
        help_text="Couleur au survol des liens - Si vide, utilise la couleur secondaire"
    )
    # Bannière (bandeau promo en haut du site)
    banner_bg_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur de fond de la bannière",
        help_text="Fond du bandeau promotionnel (client, admin, employé)"
    )
    banner_text_color = models.CharField(
        max_length=7,
        default="#FFFFFF",
        blank=True,
        null=True,
        verbose_name="Couleur du texte de la bannière",
        help_text="Texte du bandeau promotionnel"
    )
    # Footer
    footer_bg_color = models.CharField(
        max_length=7,
        default="#F0FDF4",
        blank=True,
        null=True,
        verbose_name="Couleur de fond du footer",
        help_text="Fond du pied de page (client, admin, employé)"
    )
    footer_text_color = models.CharField(
        max_length=7,
        default="#374151",
        blank=True,
        null=True,
        verbose_name="Couleur du texte du footer",
        help_text="Texte principal du footer"
    )
    footer_link_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur des liens du footer",
        help_text="Liens et icônes du footer"
    )
    footer_link_hover_color = models.CharField(
        max_length=7,
        default="#066300",
        blank=True,
        null=True,
        verbose_name="Couleur hover des liens du footer",
        help_text="Au survol des liens du footer"
    )
    footer_border_color = models.CharField(
        max_length=7,
        default="#BBF7D0",
        blank=True,
        null=True,
        verbose_name="Couleur des bordures du footer",
        help_text="Bordures et séparateurs du footer"
    )
    # Bordures des boutons (toutes interfaces)
    button_border_color = models.CharField(
        max_length=7,
        default="",
        blank=True,
        null=True,
        verbose_name="Couleur de la bordure des boutons",
        help_text="Bordure des boutons principaux (vide = pas de bordure)"
    )
    button_border_width = models.PositiveIntegerField(
        default=0,
        verbose_name="Épaisseur bordure boutons (px)",
        help_text="0 = pas de bordure"
    )
    button_border_radius = models.CharField(
        max_length=20,
        default="0.375rem",
        blank=True,
        null=True,
        verbose_name="Rayon des coins des boutons",
        help_text="Ex: 0.375rem, 0.5rem, 9999px (pilule)"
    )
    # Boutons outline (ex. Connexion, liens bouton)
    button_outline_border_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur bordure boutons outline",
        help_text="Bordure des boutons type Connexion"
    )
    button_outline_text_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur texte boutons outline",
        help_text="Texte des boutons type Connexion"
    )
    button_outline_hover_bg_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur fond hover boutons outline",
        help_text="Fond au survol des boutons type Connexion"
    )
    # Couleurs du nom et slogan (navbar)
    site_name_part1_color = models.CharField(
        max_length=7,
        default="#111827",
        blank=True,
        null=True,
        verbose_name="Couleur 1 du nom (slogan)",
        help_text="Première partie du nom (ex. Services)"
    )
    site_name_part2_color = models.CharField(
        max_length=7,
        default="#087A00",
        blank=True,
        null=True,
        verbose_name="Couleur 2 du nom (slogan)",
        help_text="Deuxième partie du nom (ex. Locaux)"
    )
    site_tagline_color = models.CharField(
        max_length=7,
        default="#6B7280",
        blank=True,
        null=True,
        verbose_name="Couleur du slogan (tagline)",
        help_text="Sous-titre sous le nom (ex. Votre partenaire de confiance)"
    )
    # Bannière : bouton et bordure (fond + texte déjà présents)
    banner_button_color = models.CharField(
        max_length=7,
        default="",
        blank=True,
        null=True,
        verbose_name="Couleur bouton bannière",
        help_text="Fond du bouton dans la bannière (vide = couleur principale)"
    )
    banner_button_border_color = models.CharField(
        max_length=7,
        default="",
        blank=True,
        null=True,
        verbose_name="Bordure bouton bannière",
        help_text="Bordure du bouton dans la bannière (vide = pas de bordure)"
    )
    # Section Services (page Services)
    services_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond section Services")
    services_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte section Services")
    services_button_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bouton section Services")
    services_button_border_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bordure bouton section Services")
    # Section Agences (page Agences)
    agencies_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond section Agences")
    agencies_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte section Agences")
    agencies_button_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bouton section Agences")
    agencies_button_border_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bordure bouton section Agences")
    # Interface employé (dashboard employé)
    employe_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond interface employé")
    employe_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte interface employé")
    employe_button_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bouton interface employé")
    employe_button_border_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bordure bouton interface employé")
    # Page connexion admin
    admin_login_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond page connexion admin")
    admin_login_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte page connexion admin")
    admin_login_button_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bouton page connexion admin")
    admin_login_button_border_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bordure bouton page connexion admin")
    # Page connexion employé
    employe_login_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond page connexion employé")
    employe_login_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte page connexion employé")
    employe_login_button_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bouton page connexion employé")
    employe_login_button_border_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Bordure bouton page connexion employé")
    # Zone logo (navbar : fond et texte à côté du logo)
    logo_area_bg_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Fond zone logo (navbar)")
    logo_area_text_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Texte zone logo (nom/slogan)")
    # Devis et PDF (couleur principale des titres et bordures dans le PDF devis/facture)
    devis_pdf_primary_color = models.CharField(max_length=7, default="", blank=True, null=True, verbose_name="Couleur principale devis et PDF (titres, bordures)")
    # Informations légales (pour les PDFs devis et factures)
    siret = models.CharField(max_length=50, blank=True, null=True, verbose_name="SIRET", help_text="Numéro SIRET de l'entreprise")
    code_ape = models.CharField(max_length=10, blank=True, null=True, verbose_name="Code APE", help_text="Code APE/NAF de l'entreprise")
    num_tva = models.CharField(max_length=30, blank=True, null=True, verbose_name="N° TVA intracommunautaire")
    forme_juridique = models.CharField(max_length=50, blank=True, null=True, verbose_name="Forme juridique", help_text="Ex: S.A.S., SARL, Auto-entrepreneur...")
    rcs_ville = models.CharField(max_length=100, blank=True, null=True, verbose_name="RCS / Ville", help_text="Ex: R.C.S. Nanterre")
    # Informations de paiement
    paiement_beneficiaire = models.CharField(max_length=100, blank=True, null=True, default="EASE-DOM", verbose_name="Nom du bénéficiaire (paiement)")
    paiement_iban = models.CharField(max_length=50, blank=True, null=True, default="FR38 3000 2005 1000 0000 9774 Z35", verbose_name="IBAN")
    paiement_banque = models.CharField(max_length=100, blank=True, null=True, default="LCL", verbose_name="Banque bénéficiaire")
    paiement_bic = models.CharField(max_length=20, blank=True, null=True, default="CRLYFRPP", verbose_name="Code BIC")
    mention_tva = models.TextField(
        blank=True,
        null=True,
        default="TVA non applicable selon l'article 293 B du Code Général des Impôts",
        verbose_name="Mention TVA",
        help_text="Mention légale TVA à afficher en bas du devis"
    )
    mention_bon_pour_accord = models.TextField(
        blank=True,
        null=True,
        default="Si accord, le devis suivant devra être retourné signer avec la mention « Bon pour accord » et constituera une annexe au contrat signé ultérieurement.",
        verbose_name="Mention Bon pour accord",
        help_text="Texte de la mention 'Bon pour accord' en bas du devis"
    )
    logo_secondary = models.ImageField(
        upload_to='site/',
        blank=True,
        null=True,
        verbose_name="Logo secondaire (partenaire)",
        help_text="Logo partenaire affiché en haut à droite du devis (ex: SI Services à la Personne)"
    )
    # Logo
    logo = models.ImageField(
        upload_to='site/',
        blank=True,
        null=True,
        verbose_name="Logo du site",
        help_text="Logo principal du site"
    )
    logo_favicon = models.ImageField(
        upload_to='site/',
        blank=True,
        null=True,
        verbose_name="Favicon",
        help_text="Icône du site (favicon)"
    )
    logo_signature = models.ImageField(
        upload_to='site/',
        blank=True,
        null=True,
        verbose_name="Signature / Logo de fin de devis",
        help_text="Image affichée en bas du devis PDF (signature, cachet, logo officiel...)"
    )
    # Métadonnées
    site_name = models.CharField(
        max_length=200,
        default="Services Locaux",
        verbose_name="Nom du site",
        help_text="Nom affiché sur le site"
    )
    site_tagline = models.CharField(
        max_length=500,
        default="Votre partenaire de confiance",
        verbose_name="Slogan du site",
        help_text="Slogan ou tagline du site"
    )
    # Configuration SMTP pour l'envoi d'emails
    smtp_host = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Serveur SMTP",
        help_text="Adresse du serveur SMTP (ex: smtp.gmail.com)"
    )
    smtp_port = models.IntegerField(
        default=587,
        verbose_name="Port SMTP",
        help_text="Port du serveur SMTP (587 pour TLS, 465 pour SSL)"
    )
    smtp_use_tls = models.BooleanField(
        default=True,
        verbose_name="Utiliser TLS",
        help_text="Cocher si le serveur SMTP utilise TLS"
    )
    smtp_use_ssl = models.BooleanField(
        default=False,
        verbose_name="Utiliser SSL",
        help_text="Cocher si le serveur SMTP utilise SSL"
    )
    smtp_username = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Email expéditeur",
        help_text="Adresse email utilisée pour envoyer les emails"
    )
    smtp_password = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Mot de passe SMTP",
        help_text="Mot de passe ou mot de passe d'application pour l'email expéditeur"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Paramètres du site"
        verbose_name_plural = "Paramètres du site"
    
    def __str__(self):
        return f"Paramètres du site - {self.site_name}"
    
    def save(self, *args, **kwargs):
        # S'assurer qu'il n'y a qu'une seule instance
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Récupère ou crée les paramètres par défaut"""
        try:
            # Vérifier si les champs SMTP existent dans le modèle
            cls._meta.get_field('smtp_host')
            # Si on arrive ici, les champs existent, on peut faire une requête normale
            settings, created = cls.objects.get_or_create(pk=1)
            return settings
        except (FieldDoesNotExist, OperationalError, Exception):
            # FieldDoesNotExist: champs SMTP pas dans le modèle
            # OperationalError: colonnes SMTP pas encore en base (migration non appliquée)
            pass
        try:
            settings = cls.objects.filter(pk=1).only(
                'id', 'primary_color', 'secondary_color', 'tertiary_color',
                'button_primary_color', 'button_primary_hover_color', 'button_text_color',
                'text_primary_color', 'text_link_color', 'text_link_hover_color',
                'banner_bg_color', 'banner_text_color',
                'footer_bg_color', 'footer_text_color', 'footer_link_color',
                'footer_link_hover_color', 'footer_border_color',
                'button_border_color', 'button_border_width', 'button_border_radius',
                'button_outline_border_color', 'button_outline_text_color', 'button_outline_hover_bg_color',
                'site_name_part1_color', 'site_name_part2_color', 'site_tagline_color',
                'logo', 'logo_favicon', 'site_name', 'site_tagline',
                'created_at', 'updated_at'
            ).first()
            if not settings:
                # Créer l'instance si elle n'existe pas (sans les colonnes SMTP)
                settings = cls.objects.create(pk=1)
        except Exception:
            # Dernier recours: get_or_create (peut échouer si colonnes manquantes)
            settings, _ = cls.objects.get_or_create(pk=1)
        return settings


class ServiceAdvantage(models.Model):
    """Modèle pour les avantages de la section 'Pourquoi choisir nos services'"""
    ICON_CHOICES = [
        ('FaUsers', 'Utilisateurs'),
        ('FaShieldAlt', 'Bouclier'),
        ('FaClock', 'Horloge'),
        ('FaCheckCircle', 'Coche'),
        ('FaStar', 'Étoile'),
        ('FaAward', 'Récompense'),
        ('FaMapMarkerAlt', 'Localisation'),
        ('FaPhone', 'Téléphone'),
        ('FaEnvelope', 'Email'),
        ('FaHeart', 'Cœur'),
        ('FaHandHoldingHeart', 'Main avec cœur'),
        ('FaUserTie', 'Professionnel'),
    ]
    
    title = models.CharField(
        max_length=200,
        verbose_name="Titre",
        help_text="Titre de l'avantage (ex: Professionnels certifiés)"
    )
    description = models.TextField(
        verbose_name="Description",
        help_text="Description de l'avantage"
    )
    icon = models.CharField(
        max_length=50,
        choices=ICON_CHOICES,
        default='FaUsers',
        verbose_name="Icône",
        help_text="Icône à afficher pour cet avantage"
    )
    order = models.IntegerField(
        default=0,
        db_index=True,
        verbose_name="Ordre d'affichage",
        help_text="Ordre d'affichage (plus petit = affiché en premier)"
    )
    active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Actif",
        help_text="Si désactivé, n'apparaît pas sur le site"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Avantage service"
        verbose_name_plural = "Avantages services"
        ordering = ['order', 'title']
        indexes = [
            models.Index(fields=['active', 'order']),
        ]
    
    def __str__(self):
        return self.title


class Patient(models.Model):
    """Modèle pour les patients avec QR code unique"""
    client = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='patients',
        null=True,
        blank=True,
        verbose_name="Client",
        help_text="Client propriétaire du patient (optionnel)"
    )
    CIVILITY_CHOICES = [
        ('M.', 'Monsieur'),
        ('Mme', 'Madame'),
        ('', 'Non précisé'),
    ]
    civility = models.CharField(
        max_length=10,
        choices=CIVILITY_CHOICES,
        default='',
        blank=True,
        verbose_name="Civilité"
    )
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Date de naissance")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    qr_code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="QR Code",
        help_text="Code QR unique pour le patient"
    )
    qr_code_image = models.ImageField(
        upload_to='qr_codes/',
        blank=True,
        null=True,
        verbose_name="Image QR Code",
        help_text="Image du QR code générée"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif",
        help_text="Si désactivé, le QR code ne peut plus être scanné"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_patients',
        verbose_name="Créé par",
        help_text="Admin qui a créé ce patient"
    )
    assigned_employees = models.ManyToManyField(
        CustomUser,
        related_name='assigned_patients',
        blank=True,
        limit_choices_to={'role': 'EMPLOYE'},
        verbose_name="Employés assignés",
        help_text="Employés assignés à ce patient"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['qr_code']),
            models.Index(fields=['client', 'is_active']),
        ]
    
    def __str__(self):
        client_info = self.client.username if self.client else "sans client"
        return f"{self.first_name} {self.last_name} ({client_info})"

    def save(self, *args, **kwargs):
        # Générer automatiquement un QR code unique s'il n'existe pas
        if not self.qr_code:
            import uuid
            import hashlib
            # Générer un code unique basé sur le client (optionnel) et un UUID
            client_id = self.client.id if self.client else "anonymous"
            unique_string = f"{client_id}_{uuid.uuid4()}"
            self.qr_code = hashlib.sha256(unique_string.encode()).hexdigest()[:32].upper()
        
        # Vérifier si le nom a changé (pour régénérer le QR code avec le nouveau nom)
        regenerate_qr = False
        if self.pk:
            try:
                old_patient = Patient.objects.get(pk=self.pk)
                if (old_patient.first_name != self.first_name or 
                    old_patient.last_name != self.last_name):
                    regenerate_qr = True
            except Patient.DoesNotExist:
                pass
        
        # Générer automatiquement l'image QR code si elle n'existe pas ou si le nom a changé
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Générer l'image QR code après la sauvegarde (pour avoir le pk)
        # Note: La génération du fichier est optionnelle car on peut générer à la volée via l'endpoint
        # On génère quand même le fichier pour avoir une sauvegarde
        if not self.qr_code_image or regenerate_qr:
            try:
                # Supprimer l'ancienne image si elle existe et qu'on régénère
                if regenerate_qr and self.qr_code_image:
                    try:
                        self.qr_code_image.delete(save=False)
                    except Exception:
                        pass  # Ignorer les erreurs de suppression
                self.generate_qr_image()
            except Exception as e:
                # Si la génération échoue (bibliothèque non installée), on continue
                # Le QR code peut quand même être généré à la volée via l'endpoint
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f'Impossible de générer le fichier QR code pour le patient {self.id}: {str(e)}')
                pass
    
    def generate_qr_image(self):
        """Génère l'image du QR code avec le nom du patient"""
        try:
            import qrcode
            from io import BytesIO
            from django.core.files.base import ContentFile
            from PIL import Image, ImageDraw, ImageFont
            
            # Créer le QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(self.qr_code)
            qr.make(fit=True)
            
            # Créer l'image du QR code
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            # Obtenir les dimensions du QR code
            qr_width, qr_height = qr_img.size
            
            # Créer une image plus grande pour inclure le nom du patient
            # Ajouter de l'espace en bas pour le texte (environ 60 pixels)
            padding = 20
            text_height = 60
            total_height = qr_height + padding + text_height
            
            # Créer une nouvelle image blanche
            final_img = Image.new('RGB', (qr_width, total_height), 'white')

            # Convertir en RGB avant de coller (évite l'erreur "cannot determine region size")
            qr_img = qr_img.convert('RGB')
            # Coller le QR code en haut avec un tuple à 4 valeurs
            final_img.paste(qr_img, (0, 0, qr_width, qr_height))
            
            # Ajouter le nom du patient en bas
            draw = ImageDraw.Draw(final_img)
            
            # Essayer de trouver une police TrueType disponible
            font = None
            font_paths = []
            
            # Chemins Windows
            import platform
            if platform.system() == 'Windows':
                import os
                windir = os.environ.get('WINDIR', 'C:\\Windows')
                font_paths.extend([
                    os.path.join(windir, 'Fonts', 'arial.ttf'),
                    os.path.join(windir, 'Fonts', 'arialbd.ttf'),
                    os.path.join(windir, 'Fonts', 'calibri.ttf'),
                    os.path.join(windir, 'Fonts', 'calibrib.ttf'),
                ])
            else:
                # Chemins Linux/Mac
                font_paths.extend([
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                    "/System/Library/Fonts/Helvetica.ttc",  # Mac
                ])
            
            # Essayer chaque chemin de police avec une taille plus grande pour le nom
            font_size = 24  # Taille plus grande pour le nom
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except (IOError, OSError):
                    continue
            
            # Si aucune police n'a été trouvée, utiliser la police par défaut
            if font is None:
                try:
                    # Essayer de charger une police par défaut plus grande
                    font = ImageFont.load_default()
                except:
                    font = None
            
            # Nom complet du patient en MAJUSCULES (comme sur l'image)
            patient_name = f"{self.first_name.upper()} {self.last_name.upper()}"
            
            # Centrer le texte - méthode simple et robuste
            # Estimation de la largeur du texte (approximative mais fonctionne toujours)
            if font:
                # Estimation basée sur la taille de la police
                # Environ 0.6 * font_size par caractère pour la plupart des polices
                estimated_char_width = font_size * 0.6
                text_width = len(patient_name) * estimated_char_width
            else:
                # Estimation par défaut sans police
                text_width = len(patient_name) * 12
            
            # Centrer le texte horizontalement
            text_x = max(0, (qr_width - int(text_width)) // 2)
            text_y = qr_height + padding + 5  # Légèrement plus bas
            
            # Dessiner le texte en gras (noir)
            if font:
                draw.text((text_x, text_y), patient_name, fill='black', font=font)
            else:
                # Si pas de police, utiliser la méthode par défaut
                draw.text((text_x, text_y), patient_name, fill='black')
            
            # Sauvegarder dans un BytesIO
            buffer = BytesIO()
            final_img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # S'assurer que le répertoire existe
            import os
            from django.conf import settings
            qr_dir = os.path.join(settings.MEDIA_ROOT, 'qr_codes')
            os.makedirs(qr_dir, exist_ok=True)
            
            # Sauvegarder dans le champ image
            filename = f'qr_{self.qr_code}.png'
            self.qr_code_image.save(
                filename,
                ContentFile(buffer.read()),
                save=True
            )
            
            # Vérifier que le fichier a bien été créé
            file_path = os.path.join(settings.MEDIA_ROOT, self.qr_code_image.name)
            if not os.path.exists(file_path):
                raise Exception(f"Le fichier QR code n'a pas pu être créé: {file_path}")
        except ImportError:
            # Bibliothèque qrcode non installée
            pass
        except Exception as e:
            # Erreur lors de la génération
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Erreur lors de la génération du QR code pour le patient {self.id}: {str(e)}')


class Presence(models.Model):
    """Modèle pour enregistrer les présences via scan QR code"""
    PRESENCE_STATUS_CHOICES = [
        ('ARRIVEE', 'Arrivée'),
        ('DEPART', 'Départ'),
    ]
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='presences',
        verbose_name="Patient",
        help_text="Patient pour lequel la présence est enregistrée"
    )
    employe = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='presences',
        verbose_name="Employé",
        help_text="Employé qui a scanné le QR code",
        limit_choices_to={'role': 'EMPLOYE'}
    )
    status = models.CharField(
        max_length=10,
        choices=PRESENCE_STATUS_CHOICES,
        verbose_name="Statut",
        help_text="Type de scan (arrivée ou départ)"
    )
    scan_time = models.DateTimeField(
        verbose_name="Heure de scan",
        help_text="Date et heure du scan",
        default=None,
        null=True,
        blank=True
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        verbose_name="Latitude",
        help_text="Coordonnée GPS (optionnel)"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        verbose_name="Longitude",
        help_text="Coordonnée GPS (optionnel)"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes",
        help_text="Notes additionnelles (optionnel)"
    )
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

    class Meta:
        verbose_name = "Présence"
        verbose_name_plural = "Présences"
        ordering = ['-scan_time']
        indexes = [
            models.Index(fields=['patient', 'scan_time']),
            models.Index(fields=['employe', 'scan_time']),
            models.Index(fields=['status', 'scan_time']),
        ]
    
    def save(self, *args, **kwargs):
        # Si scan_time n'est pas défini, utiliser maintenant
        if not self.scan_time:
            from django.utils import timezone
            self.scan_time = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.patient} - {self.get_status_display()} - {self.employe.username} - {self.scan_time}"
    
    @property
    def duration(self):
        """Calcule la durée de la prestation si arrivée et départ sont enregistrés"""
        if self.status == 'DEPART':
            # Trouver l'arrivée correspondante
            arrival = Presence.objects.filter(
                patient=self.patient,
                employe=self.employe,
                status='ARRIVEE',
                scan_time__lt=self.scan_time
            ).order_by('-scan_time').first()
            
            if arrival:
                delta = self.scan_time - arrival.scan_time
                return delta.total_seconds() / 3600  # Retourne en heures
        return None


class EmployeeProfile(models.Model):
    """Profil détaillé pour les employés"""
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('A', 'Autre'),
    ]
    
    TYPE_CONTRAT_CHOICES = [
        ('CDI', 'Contrat à Durée Indéterminée'),
        ('CDD', 'Contrat à Durée Déterminée'),
        ('STAGE', 'Stage'),
        ('INTERIM', 'Intérim'),
        ('PRESTATION', 'Contrat de Prestation'),
    ]
    
    TEMPS_TRAVAIL_CHOICES = [
        ('PLEIN', 'Temps plein'),
        ('PARTIEL', 'Temps partiel'),
    ]
    
    MODE_PAIEMENT_CHOICES = [
        ('VIREMENT', 'Virement bancaire'),
        ('CHEQUE', 'Chèque'),
        ('ESPECES', 'Espèces'),
        ('AUTRE', 'Autre'),
    ]
    
    STATUT_COMPTE_CHOICES = [
        ('ACTIF', 'Actif'),
        ('SUSPENDU', 'Suspendu'),
        ('SUPPRIME', 'Supprimé'),
    ]
    
    STATUT_DOCUMENT_CHOICES = [
        ('SIGNE', 'Signé'),
        ('EN_ATTENTE', 'En attente'),
        ('REJETE', 'Rejeté'),
    ]
    
    # Relation avec CustomUser
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        verbose_name="Utilisateur",
        help_text="Utilisateur associé à ce profil employé"
    )
    
    # Identité
    sexe = models.CharField(
        max_length=1,
        choices=SEXE_CHOICES,
        blank=True,
        null=True,
        verbose_name="Sexe"
    )
    date_naissance = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de naissance"
    )
    nationalite = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Nationalité"
    )
    photo_profil = models.ImageField(
        upload_to='employees/photos/',
        blank=True,
        null=True,
        verbose_name="Photo de profil"
    )
    signature = models.ImageField(
        upload_to='employees/signatures/',
        blank=True,
        null=True,
        verbose_name="Signature"
    )
    
    # Coordonnées
    email_professionnel = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email professionnel"
    )
    email_personnel = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email personnel"
    )
    telephone_principal = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone principal"
    )
    telephone_secondaire = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Téléphone secondaire"
    )
    adresse_numero_rue = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Numéro et rue"
    )
    adresse_ville = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ville"
    )
    adresse_code_postal = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Code postal"
    )
    adresse_pays = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Pays"
    )
    
    # Authentification & sécurité
    statut_compte = models.CharField(
        max_length=20,
        choices=STATUT_COMPTE_CHOICES,
        default='ACTIF',
        verbose_name="Statut du compte"
    )
    derniere_connexion = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Dernière connexion"
    )
    tentatives_connexion_echouees = models.IntegerField(
        default=0,
        verbose_name="Tentatives de connexion échouées"
    )
    appareil_utilise = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Appareil utilisé"
    )
    ip_derniere_connexion = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="IP dernière connexion"
    )
    
    # Informations professionnelles
    poste_fonction = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Poste / Fonction"
    )
    service_departement = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Service / Département"
    )
    type_contrat = models.CharField(
        max_length=20,
        choices=TYPE_CONTRAT_CHOICES,
        blank=True,
        null=True,
        verbose_name="Type de contrat"
    )
    date_debut_contrat = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de début du contrat"
    )
    date_fin_contrat = models.DateField(
        blank=True,
        null=True,
        verbose_name="Date de fin du contrat"
    )
    temps_travail = models.CharField(
        max_length=20,
        choices=TEMPS_TRAVAIL_CHOICES,
        blank=True,
        null=True,
        verbose_name="Temps de travail"
    )
    taux_horaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Taux horaire"
    )
    salaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Salaire"
    )
    mode_paiement = models.CharField(
        max_length=20,
        choices=MODE_PAIEMENT_CHOICES,
        blank=True,
        null=True,
        verbose_name="Mode de paiement"
    )
    numero_securite_sociale = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Numéro de sécurité sociale",
        help_text="Si légalement autorisé"
    )
    numero_employe_interne = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Numéro d'employé interne"
    )
    
    # Documents liés
    contrat_signe = models.FileField(
        upload_to='employees/contrats/',
        blank=True,
        null=True,
        verbose_name="Contrat signé (PDF)"
    )
    avenants = models.FileField(
        upload_to='employees/avenants/',
        blank=True,
        null=True,
        verbose_name="Avenants"
    )
    clause_non_concurrence = models.FileField(
        upload_to='employees/clauses/',
        blank=True,
        null=True,
        verbose_name="Clause de non-concurrence (signée)"
    )
    note_information = models.FileField(
        upload_to='employees/notes/',
        blank=True,
        null=True,
        verbose_name="Note d'information (signée)"
    )
    piece_identite = models.FileField(
        upload_to='employees/pieces_identite/',
        blank=True,
        null=True,
        verbose_name="Pièce d'identité"
    )
    diplomes_certifications = models.FileField(
        upload_to='employees/diplomes/',
        blank=True,
        null=True,
        verbose_name="Diplômes / Certifications"
    )
    documents_administratifs = models.FileField(
        upload_to='employees/documents/',
        blank=True,
        null=True,
        verbose_name="Documents administratifs divers"
    )
    date_signature_electronique = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Date de signature électronique"
    )
    statut_documents = models.CharField(
        max_length=20,
        choices=STATUT_DOCUMENT_CHOICES,
        default='EN_ATTENTE',
        verbose_name="Statut des documents"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Profil employé"
        verbose_name_plural = "Profils employés"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Profil de {self.user.username}"


class ContactMessage(models.Model):
    """Messages envoyés via le formulaire de contact public"""
    STATUS_CHOICES = [
        ('NEW', 'Nouveau'),
        ('READ', 'Lu'),
        ('REPLIED', 'Répondu'),
    ]

    name = models.CharField(max_length=200, verbose_name="Nom")
    email = models.EmailField(verbose_name="Email")
    subject = models.CharField(max_length=300, verbose_name="Sujet")
    message = models.TextField(verbose_name="Message")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='NEW',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.subject} ({self.created_at.strftime('%d/%m/%Y')})"


class HeroContent(models.Model):
    """Contenu singleton de la section hero de la page d'accueil"""
    title = models.CharField(max_length=200, default="Nous aimons vous rendre la vie plus facile !")
    subtitle = models.TextField(default="Ménage, aide à domicile, jardinage, garde d'enfant : depuis + de 20 ans, nous nous tenons à vos côtés pour rendre votre quotidien plus serein.")
    description = models.TextField(blank=True, default="Retrouvez du temps pour vous grâce aux services à la personne.")
    background_image = models.ImageField(upload_to='hero/', null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contenu Hero"

    def __str__(self):
        return "Hero Page d'accueil"


class UserPermission(models.Model):
    """Permissions granulaires par utilisateur et par module"""

    MODULE_CHOICES = [
        ('devis',            'Devis'),
        ('factures',         'Factures'),
        ('employes',         'Employés'),
        ('patients',         'Patients'),
        ('scans',            'Scans'),
        ('services',         'Services'),
        ('categories',       'Catégories'),
        ('avantages',        'Avantages'),
        ('agences',          'Agences'),
        ('avis',             'Avis clients'),
        ('messages',         'Messages contact'),
        ('bannieres',        'Bannières'),
        ('hero',             'Page d\'accueil'),
        ('parametres',       'Paramètres'),
    ]

    ACTION_CHOICES = [
        ('view',   'Voir'),
        ('create', 'Créer'),
        ('update', 'Modifier'),
        ('delete', 'Supprimer'),
        ('email',  'Envoyer email'),
        ('pdf',    'Générer PDF'),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='custom_permissions',
        verbose_name="Utilisateur"
    )
    module = models.CharField(max_length=50, choices=MODULE_CHOICES, verbose_name="Module")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="Action")
    granted = models.BooleanField(default=False, verbose_name="Accordé")

    class Meta:
        verbose_name = "Permission utilisateur"
        verbose_name_plural = "Permissions utilisateurs"
        unique_together = ('user', 'module', 'action')
        ordering = ['user', 'module', 'action']

    def __str__(self):
        status = "✓" if self.granted else "✗"
        return f"{status} {self.user.username} — {self.module}.{self.action}"

    @classmethod
    def has_permission(cls, user, module, action):
        """Vérifie si un user a une permission. SUPERADMIN a toujours accès."""
        if not user or not user.is_authenticated:
            return False
        if user.role == 'SUPERADMIN':
            return True
        try:
            perm = cls.objects.get(user=user, module=module, action=action)
            return perm.granted
        except cls.DoesNotExist:
            # Par défaut : ADMIN a accès à tout sauf si une permission explicite dit non
            return user.role == 'ADMIN'


class ActivityLog(models.Model):
    """Journal d'activité — toutes les actions sur le site"""
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('LOGIN',  'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('EMAIL',  'Email envoyé'),
        ('PDF',    'PDF généré'),
        ('ERROR',  'Erreur'),
        ('OTHER',  'Autre'),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='activity_logs',
        verbose_name="Utilisateur"
    )
    LEVEL_CHOICES = [
        ('DEBUG',    'DEBUG'),
        ('INFO',     'INFO'),
        ('WARNING',  'WARNING'),
        ('ERROR',    'ERROR'),
        ('CRITICAL', 'CRITICAL'),
    ]

    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="Action")
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='INFO', verbose_name="Niveau")
    logger_name = models.CharField(max_length=200, blank=True, verbose_name="Logger")
    model_name = models.CharField(max_length=100, blank=True, verbose_name="Modèle")
    object_id = models.CharField(max_length=50, blank=True, verbose_name="ID objet")
    object_repr = models.CharField(max_length=300, blank=True, verbose_name="Représentation")
    detail = models.TextField(blank=True, verbose_name="Détail")
    extra = models.JSONField(null=True, blank=True, verbose_name="Données extra")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Adresse IP")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date")

    class Meta:
        verbose_name = "Journal d'activité"
        verbose_name_plural = "Journal d'activités"
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "Anonyme"
        return f"[{self.get_action_display()}] {user_str} — {self.object_repr} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"
