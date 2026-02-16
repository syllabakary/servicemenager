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
        verbose_name="Service",
        null=True,
        blank=True,
        help_text="Service demandé (optionnel)"
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
        verbose_name="Demande de devis",
        help_text="Devis associé à cette facture"
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
    
    def __str__(self):
        return f"Facture {self.invoice_number} - {self.quote_request.client_name}"
    
    def save(self, *args, **kwargs):
        # Générer automatiquement le numéro de facture s'il n'existe pas
        if not self.invoice_number:
            from django.utils import timezone
            year = timezone.now().year
            # Compter les factures de l'année
            count = Invoice.objects.filter(invoice_date__year=year).count() + 1
            self.invoice_number = f"FACT-{year}-{count:04d}"
        
        # Si le subtotal est 0 et qu'on a un quote_request, essayer de récupérer le prix du service
        if self.subtotal == 0 and self.quote_request and self.quote_request.service:
            if self.quote_request.service.price_per_hour:
                self.subtotal = self.quote_request.service.price_per_hour
        
        # Calculer automatiquement le total si nécessaire
        if not self.tax_amount and self.tax_rate:
            self.tax_amount = (self.subtotal * self.tax_rate) / 100
        
        if not self.total or self.total == 0:
            self.total = self.subtotal + self.tax_amount
        
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
            # Vérifier si les champs SMTP existent
            cls._meta.get_field('smtp_host')
            # Si on arrive ici, les champs existent, on peut faire une requête normale
            settings, created = cls.objects.get_or_create(pk=1)
        except:
            # Les champs SMTP n'existent pas encore, utiliser only() pour éviter les erreurs SQL
            try:
                settings = cls.objects.filter(pk=1).only(
                    'id', 'primary_color', 'secondary_color', 'tertiary_color',
                    'button_primary_color', 'button_primary_hover_color', 'button_text_color',
                    'text_primary_color', 'text_link_color', 'text_link_hover_color',
                    'logo', 'logo_favicon', 'site_name', 'site_tagline',
                    'created_at', 'updated_at'
                ).first()
                if not settings:
                    # Créer l'instance si elle n'existe pas
                    settings = cls.objects.create(pk=1)
            except Exception as e:
                # En cas d'erreur, essayer quand même get_or_create
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


class Patient(models.Model):
    """Modèle pour les patients avec QR code unique"""
    client = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='patients',
        verbose_name="Client",
        help_text="Client propriétaire du patient"
    )
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
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
    
    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['qr_code']),
            models.Index(fields=['client', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.client.username})"
    
    def save(self, *args, **kwargs):
        # Générer automatiquement un QR code unique s'il n'existe pas
        if not self.qr_code:
            import uuid
            import hashlib
            # Générer un code unique basé sur le client et un UUID
            unique_string = f"{self.client.id}_{uuid.uuid4()}"
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
            
            # Coller le QR code en haut
            final_img.paste(qr_img, (0, 0))
            
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
