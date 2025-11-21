from django.db import models
from django.db.models import Avg
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
    
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='quote_requests',
        verbose_name="Service"
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
    client_name = models.CharField(
        max_length=200,
        verbose_name="Nom complet"
    )
    client_email = models.EmailField(
        verbose_name="Email"
    )
    client_phone = models.CharField(
        max_length=20,
        verbose_name="Téléphone"
    )
    # Informations supplémentaires (JSON)
    additional_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Informations supplémentaires",
        help_text="Informations dynamiques collectées dans le formulaire"
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
        return f"Devis #{self.id} - {self.client_name} - {self.service.name}"


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
        default="#DC2626",
        verbose_name="Couleur principale",
        help_text="Couleur principale utilisée pour les titres, liens importants et éléments de navigation (format hex: #DC2626)"
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#B91C1C",
        verbose_name="Couleur secondaire",
        help_text="Couleur secondaire utilisée pour les dégradés et effets hover sur les boutons (format hex: #B91C1C)"
    )
    tertiary_color = models.CharField(
        max_length=7,
        default="#991B1B",
        verbose_name="Couleur tertiaire",
        help_text="Couleur tertiaire utilisée pour les effets hover et états actifs (format hex: #991B1B)"
    )
    # Couleurs des boutons
    button_primary_color = models.CharField(
        max_length=7,
        default="#DC2626",
        verbose_name="Couleur des boutons principaux",
        help_text="Couleur de fond des boutons principaux (CTA, actions importantes) - Si vide, utilise la couleur principale"
    )
    button_primary_hover_color = models.CharField(
        max_length=7,
        default="#B91C1C",
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
        default="#DC2626",
        verbose_name="Couleur des textes importants",
        help_text="Couleur utilisée pour les textes importants, titres secondaires et accents (format hex: #DC2626)"
    )
    text_link_color = models.CharField(
        max_length=7,
        default="#DC2626",
        verbose_name="Couleur des liens",
        help_text="Couleur des liens cliquables dans le contenu - Si vide, utilise la couleur principale"
    )
    text_link_hover_color = models.CharField(
        max_length=7,
        default="#B91C1C",
        verbose_name="Couleur hover des liens",
        help_text="Couleur au survol des liens - Si vide, utilise la couleur secondaire"
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
        settings, created = cls.objects.get_or_create(pk=1)
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
