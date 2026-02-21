from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest, ServiceAdvantage, SiteSettings, Invoice, QuoteFormStep, QuoteFormOption, Patient, Presence, EmployeeProfile


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin pour CustomUser"""
    list_display = ['username', 'email', 'role', 'matricule', 'first_name', 'last_name', 'is_active', 'date_joined', 'created_by']
    list_filter = ['role', 'is_active', 'date_joined', 'created_by']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'matricule', 'phone']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'matricule', 'phone', 'created_by')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'matricule', 'phone', 'email')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Superadmin ne peut pas être modifié par admin"""
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.is_superadmin and not request.user.is_superadmin:
            readonly.append('role')
        return readonly


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin pour Service avec actions personnalisées"""
    list_display = ['name', 'slug', 'active_badge', 'order', 'created_by', 'created_at', 'toggle_active']
    list_filter = ['active', 'created_at', 'created_by']
    search_fields = ['name', 'slug', 'short_description', 'detailed_description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    list_editable = ['order']
    fieldsets = (
        ('Informations principales', {
            'fields': ('name', 'slug', 'category', 'short_description', 'detailed_description', 'image')
        }),
        ('Tarification et durée', {
            'fields': ('duration', 'price_per_hour', 'price_label', 'currency'),
            'description': 'Informations sur la durée et le prix du service. La devise sélectionnée sera utilisée pour l\'affichage des prix sur le site.'
        }),
        ('Contact', {
            'fields': ('contact_phone',),
            'description': 'Numéro de téléphone spécifique pour ce service. Si vide, le numéro général sera utilisé.'
        }),
        ('Note et avis', {
            'fields': ('rating', 'review_count', 'show_reviews'),
            'description': 'Note sur 5 et nombre d\'avis clients. Vous pouvez activer/désactiver l\'affichage des avis sur la page de détail.'
        }),
        ('FAQ', {
            'fields': ('show_faq',),
            'description': 'Contrôler l\'affichage de la section Questions fréquentes sur la page de détail'
        }),
        ('Contenu détaillé', {
            'fields': ('included_services', 'features', 'guarantees', 'process_steps'),
            'description': 'Listes au format JSON. Exemple pour included_services: ["Service 1", "Service 2"]'
        }),
        ('Affichage', {
            'fields': ('active', 'order'),
            'description': 'Les services inactifs ne seront pas visibles sur le site public.'
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_services', 'deactivate_services']
    
    def active_badge(self, obj):
        """Affiche un badge coloré pour l'état actif/inactif"""
        if obj.active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Actif</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactif</span>')
    active_badge.short_description = 'État'
    active_badge.admin_order_field = 'active'
    
    def toggle_active(self, obj):
        """Bouton pour activer/désactiver rapidement"""
        if obj.active:
            return format_html(
                '<a class="button" href="/admin/api/service/{}/change/?active=false">Désactiver</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="/admin/api/service/{}/change/?active=true">Activer</a>',
            obj.id
        )
    toggle_active.short_description = 'Action rapide'
    toggle_active.allow_tags = True
    
    def activate_services(self, request, queryset):
        """Action : activer les services sélectionnés"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} service(s) activé(s) avec succès.')
    activate_services.short_description = "✓ Activer les services sélectionnés"
    
    def deactivate_services(self, request, queryset):
        """Action : désactiver les services sélectionnés"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} service(s) désactivé(s) avec succès.')
    deactivate_services.short_description = "✗ Désactiver les services sélectionnés"
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde avec created_by"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Rendre created_by readonly après création"""
        readonly = list(self.readonly_fields)
        if obj and obj.created_by:
            # Si l'objet existe déjà, created_by est readonly
            if 'created_by' not in readonly:
                readonly.append('created_by')
        return readonly


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    """Admin pour Agency avec actions personnalisées"""
    list_display = ['name', 'city', 'active_badge', 'latitude', 'longitude', 'created_by', 'created_at', 'toggle_active']
    list_filter = ['active', 'city', 'created_at', 'created_by']
    search_fields = ['name', 'city', 'address', 'email', 'phone', 'details']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    fieldsets = (
        ('Informations principales', {
            'fields': ('name', 'slug', 'address', 'city', 'postal_code')
        }),
        ('Contact', {
            'fields': ('phone', 'email')
        }),
        ('Localisation GPS', {
            'fields': ('latitude', 'longitude'),
            'description': 'Coordonnées GPS pour la recherche par proximité. Format: latitude (ex: 48.8566), longitude (ex: 2.3522)'
        }),
        ('Détails', {
            'fields': ('details', 'active'),
            'description': 'Les agences inactives ne seront pas visibles sur le site public.'
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_agencies', 'deactivate_agencies']
    
    def active_badge(self, obj):
        """Affiche un badge coloré pour l'état actif/inactif"""
        if obj.active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Actif</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactif</span>')
    active_badge.short_description = 'État'
    active_badge.admin_order_field = 'active'
    
    def toggle_active(self, obj):
        """Bouton pour activer/désactiver rapidement"""
        if obj.active:
            return format_html(
                '<a class="button" href="/admin/api/agency/{}/change/?active=false">Désactiver</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="/admin/api/agency/{}/change/?active=true">Activer</a>',
            obj.id
        )
    toggle_active.short_description = 'Action rapide'
    toggle_active.allow_tags = True
    
    def activate_agencies(self, request, queryset):
        """Action : activer les agences sélectionnées"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} agence(s) activée(s) avec succès.')
    activate_agencies.short_description = "✓ Activer les agences sélectionnées"
    
    def deactivate_agencies(self, request, queryset):
        """Action : désactiver les agences sélectionnées"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} agence(s) désactivée(s) avec succès.')
    deactivate_agencies.short_description = "✗ Désactiver les agences sélectionnées"
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde avec created_by"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Rendre created_by readonly après création"""
        readonly = list(self.readonly_fields)
        if obj and obj.created_by:
            # Si l'objet existe déjà, created_by est readonly
            if 'created_by' not in readonly:
                readonly.append('created_by')
        return readonly


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Admin pour Contact"""
    list_display = ['name', 'role', 'agency', 'headquarter_badge', 'email', 'phone', 'created_by', 'created_at']
    list_filter = ['is_headquarter', 'agency', 'created_at', 'created_by']
    search_fields = ['name', 'email', 'phone', 'role', 'address']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    fieldsets = (
        ('Informations principales', {
            'fields': ('name', 'role', 'phone', 'email', 'address')
        }),
        ('Association', {
            'fields': ('agency', 'is_headquarter'),
            'description': 'Cocher "Siège social" pour le contact du siège (ex: Paris). L\'agence peut être laissée vide pour le siège.'
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def headquarter_badge(self, obj):
        """Affiche un badge pour le siège social"""
        if obj.is_headquarter:
            return format_html('<span style="color: blue; font-weight: bold;">🏢 Siège</span>')
        return format_html('<span style="color: gray;">-</span>')
    headquarter_badge.short_description = 'Type'
    headquarter_badge.admin_order_field = 'is_headquarter'
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde avec created_by"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Rendre created_by readonly après création"""
        readonly = list(self.readonly_fields)
        if obj and obj.created_by:
            # Si l'objet existe déjà, created_by est readonly
            if 'created_by' not in readonly:
                readonly.append('created_by')
        return readonly


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin pour Category"""
    list_display = ['name', 'show_in_navbar', 'order', 'created_at']
    list_filter = ['show_in_navbar', 'created_at']
    search_fields = ['name']
    list_editable = ['show_in_navbar', 'order']
    ordering = ['order', 'name']


@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    """Admin pour PageContent (Bannières et contenus de pages)"""
    list_display = ['key', 'title', 'active_badge', 'order', 'created_by', 'created_at', 'toggle_active']
    list_filter = ['is_active', 'created_at', 'created_by']
    search_fields = ['key', 'title', 'body']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    list_editable = ['order']
    fieldsets = (
        ('Identifiant', {
            'fields': ('key',),
            'description': 'Clé unique pour identifier le contenu (ex: home_banner, about_text). Ne peut pas être modifiée après création.'
        }),
        ('Contenu', {
            'fields': ('title', 'body'),
            'description': 'Le contenu peut être du texte simple ou du HTML.'
        }),
        ('Affichage', {
            'fields': ('is_active', 'order'),
            'description': 'Les contenus inactifs ne seront pas visibles sur le site public.'
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_pages', 'deactivate_pages']
    
    def active_badge(self, obj):
        """Affiche un badge coloré pour l'état actif/inactif"""
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Actif</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactif</span>')
    active_badge.short_description = 'État'
    active_badge.admin_order_field = 'is_active'
    
    def toggle_active(self, obj):
        """Bouton pour activer/désactiver rapidement"""
        if obj.is_active:
            return format_html(
                '<a class="button" href="/admin/api/pagecontent/{}/change/?is_active=false">Désactiver</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="/admin/api/pagecontent/{}/change/?is_active=true">Activer</a>',
            obj.id
        )
    toggle_active.short_description = 'Action rapide'
    toggle_active.allow_tags = True
    
    def activate_pages(self, request, queryset):
        """Action : activer les pages sélectionnées"""
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} page(s) activée(s) avec succès.')
    activate_pages.short_description = "✓ Activer les pages sélectionnées"
    
    def deactivate_pages(self, request, queryset):
        """Action : désactiver les pages sélectionnées"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} page(s) désactivée(s) avec succès.')
    deactivate_pages.short_description = "✗ Désactiver les pages sélectionnées"
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde avec created_by"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Rendre key et created_by readonly après création"""
        readonly = list(self.readonly_fields)
        if obj:
            # Si l'objet existe déjà, key et created_by sont readonly
            if 'key' not in readonly:
                readonly.append('key')
            if 'created_by' not in readonly:
                readonly.append('created_by')
        return readonly


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    """Admin pour ServiceReview"""
    list_display = ['client_name', 'service', 'rating_stars', 'approved_badge', 'display_badge', 'created_at', 'toggle_approved', 'toggle_display']
    list_filter = ['approved', 'display_on_page', 'rating', 'service', 'created_at']
    search_fields = ['client_name', 'client_email', 'comment', 'service__name']
    readonly_fields = ['created_at', 'updated_at', 'user']
    fieldsets = (
        ('Service', {
            'fields': ('service',)
        }),
        ('Avis', {
            'fields': ('rating', 'comment', 'client_name', 'client_email', 'user')
        }),
        ('Modération', {
            'fields': ('approved', 'display_on_page')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_reviews', 'reject_reviews']
    
    def rating_stars(self, obj):
        """Affiche les étoiles pour la note"""
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span style="color: #fbbf24; font-size: 14px;">{}</span>', stars)
    rating_stars.short_description = 'Note'
    rating_stars.admin_order_field = 'rating'
    
    def approved_badge(self, obj):
        """Affiche un badge pour l'état d'approbation"""
        if obj.approved:
            return format_html('<span style="color: green; font-weight: bold;">✓ Approuvé</span>')
        return format_html('<span style="color: orange; font-weight: bold;">⏳ En attente</span>')
    approved_badge.short_description = 'État'
    approved_badge.admin_order_field = 'approved'
    
    def toggle_approved(self, obj):
        """Bouton pour approuver/rejeter rapidement"""
        if obj.approved:
            return format_html(
                '<a class="button" href="/admin/api/servicereview/{}/change/?approved=false">Rejeter</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="/admin/api/servicereview/{}/change/?approved=true">Approuver</a>',
            obj.id
        )
    toggle_approved.short_description = 'Action rapide'
    
    def display_badge(self, obj):
        """Affiche un badge pour l'état d'affichage"""
        if obj.display_on_page:
            return format_html('<span style="color: green; font-weight: bold;">✓ Affiché</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Masqué</span>')
    display_badge.short_description = 'Affichage'
    display_badge.admin_order_field = 'display_on_page'
    
    def toggle_display(self, obj):
        """Bouton pour activer/désactiver l'affichage rapidement"""
        if obj.display_on_page:
            return format_html(
                '<a class="button" href="/admin/api/servicereview/{}/change/?display_on_page=false">Masquer</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="/admin/api/servicereview/{}/change/?display_on_page=true">Afficher</a>',
            obj.id
        )
    toggle_display.short_description = 'Affichage'
    
    def approve_reviews(self, request, queryset):
        """Action : approuver les avis sélectionnés"""
        count = queryset.update(approved=True)
        self.message_user(request, f'{count} avis approuvé(s) avec succès.')
    approve_reviews.short_description = "✓ Approuver les avis sélectionnés"
    
    def reject_reviews(self, request, queryset):
        """Action : rejeter les avis sélectionnés"""
        count = queryset.update(approved=False)
        self.message_user(request, f'{count} avis rejeté(s).')
    reject_reviews.short_description = "✗ Rejeter les avis sélectionnés"


@admin.register(ServiceFAQ)
class ServiceFAQAdmin(admin.ModelAdmin):
    """Admin pour ServiceFAQ"""
    list_display = ['question_short', 'service', 'active', 'order', 'created_at']
    list_filter = ['active', 'service', 'created_at']
    search_fields = ['question', 'answer', 'service__name']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['order', 'active']
    fieldsets = (
        ('Service', {
            'fields': ('service',)
        }),
        ('Question/Réponse', {
            'fields': ('question', 'answer')
        }),
        ('Affichage', {
            'fields': ('active', 'order')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_faqs', 'deactivate_faqs']
    
    def question_short(self, obj):
        """Affiche une version courte de la question"""
        return obj.question[:60] + '...' if len(obj.question) > 60 else obj.question
    question_short.short_description = 'Question'
    
    def active_badge(self, obj):
        """Affiche un badge pour l'état actif/inactif"""
        if obj.active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Actif</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactif</span>')
    active_badge.short_description = 'État'
    active_badge.admin_order_field = 'active'
    
    def activate_faqs(self, request, queryset):
        """Action : activer les FAQ sélectionnées"""
        count = queryset.update(active=True)
        self.message_user(request, f'{count} FAQ activée(s) avec succès.')
    activate_faqs.short_description = "✓ Activer les FAQ sélectionnées"
    
    def deactivate_faqs(self, request, queryset):
        """Action : désactiver les FAQ sélectionnées"""
        count = queryset.update(active=False)
        self.message_user(request, f'{count} FAQ désactivée(s) avec succès.')
    deactivate_faqs.short_description = "✗ Désactiver les FAQ sélectionnées"


@admin.register(QuoteRequest)
class QuoteRequestAdmin(admin.ModelAdmin):
    """Admin pour QuoteRequest"""
    list_display = ['id', 'client_name', 'service', 'location', 'status_badge', 'created_at', 'quick_actions']
    list_filter = ['status', 'service', 'created_at']
    search_fields = ['client_name', 'client_email', 'client_phone', 'location', 'service__name']
    readonly_fields = ['created_at', 'updated_at', 'contacted_at', 'quoted_at', 'created_by_user']
    fieldsets = (
        ('Service', {
            'fields': ('service',)
        }),
        ('Localisation', {
            'fields': ('location', 'location_lat', 'location_lng')
        }),
        ('Informations client', {
            'fields': ('client_name', 'client_email', 'client_phone')
        }),
        ('Informations supplémentaires', {
            'fields': ('additional_info',),
            'classes': ('collapse',)
        }),
        ('Statut et suivi', {
            'fields': ('status', 'admin_notes', 'contacted_at', 'quoted_at')
        }),
        ('Métadonnées', {
            'fields': ('created_by_user', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_contacted', 'mark_quoted', 'mark_accepted', 'mark_rejected', 'create_invoice']
    
    def status_badge(self, obj):
        """Affiche un badge coloré pour le statut"""
        colors = {
            'PENDING': 'orange',
            'CONTACTED': 'blue',
            'QUOTED': 'purple',
            'ACCEPTED': 'green',
            'REJECTED': 'red',
            'COMPLETED': 'darkgreen',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    status_badge.admin_order_field = 'status'
    
    def quick_actions(self, obj):
        """Boutons d'action rapide"""
        buttons = []
        if obj.status == 'PENDING':
            buttons.append(
                format_html(
                    '<a class="button" href="/admin/api/quoterequest/{}/change/?status=CONTACTED">Marquer contacté</a>',
                    obj.id
                )
            )
        if obj.status in ['PENDING', 'CONTACTED']:
            buttons.append(
                format_html(
                    '<a class="button" href="mailto:{}?subject=Devis pour {}">Envoyer email</a>',
                    obj.client_email,
                    obj.service.name
                )
            )
            buttons.append(
                format_html(
                    '<a class="button" href="tel:{}">Appeler</a>',
                    obj.client_phone
                )
            )
        return format_html(' '.join(buttons)) if buttons else '-'
    quick_actions.short_description = 'Actions'
    
    def mark_contacted(self, request, queryset):
        """Action : marquer comme contacté"""
        from django.utils import timezone
        count = queryset.update(status='CONTACTED', contacted_at=timezone.now())
        self.message_user(request, f'{count} demande(s) marquée(s) comme contactée(s).')
    mark_contacted.short_description = "✓ Marquer comme contacté"
    
    def mark_quoted(self, request, queryset):
        """Action : marquer comme devis envoyé"""
        from django.utils import timezone
        count = queryset.update(status='QUOTED', quoted_at=timezone.now())
        self.message_user(request, f'{count} demande(s) marquée(s) comme devis envoyé(s).')
    mark_quoted.short_description = "✓ Marquer comme devis envoyé"
    
    def mark_accepted(self, request, queryset):
        """Action : marquer comme accepté"""
        count = queryset.update(status='ACCEPTED')
        self.message_user(request, f'{count} demande(s) marquée(s) comme acceptée(s).')
    mark_accepted.short_description = "✓ Marquer comme accepté"
    
    def mark_rejected(self, request, queryset):
        """Action : marquer comme refusé"""
        count = queryset.update(status='REJECTED')
        self.message_user(request, f'{count} demande(s) marquée(s) comme refusée(s).')
    mark_rejected.short_description = "✗ Marquer comme refusé"
    
    def create_invoice(self, request, queryset):
        """Action : créer une facture pour les devis sélectionnés"""
        from django.utils import timezone
        from decimal import Decimal
        
        created_count = 0
        skipped_count = 0
        
        for quote_request in queryset:
            # Vérifier si une facture existe déjà
            if hasattr(quote_request, 'invoice'):
                skipped_count += 1
                continue
            
            # Calculer le montant (utiliser le prix réel du service)
            subtotal = Decimal('0.00')
            if quote_request.service.price_per_hour:
                subtotal = quote_request.service.price_per_hour
            elif hasattr(quote_request.service, 'estimated_price') and quote_request.service.estimated_price:
                subtotal = quote_request.service.estimated_price
            # Si aucun prix n'est défini, laisser 0.00 pour que l'admin puisse le modifier manuellement
            
            # Créer la facture
            invoice = Invoice.objects.create(
                quote_request=quote_request,
                subtotal=subtotal,
                tax_rate=Decimal('0.00'),  # Pas de TVA par défaut
                tax_amount=Decimal('0.00'),
                total=subtotal,
                currency=quote_request.service.currency or 'EUR',
                invoice_date=timezone.now().date(),
                due_date=None,
                created_by=request.user if request.user.is_authenticated else None,
            )
            created_count += 1
            
            # Envoyer la facture par email automatiquement
            try:
                from django.core.mail import EmailMessage
                from django.template.loader import render_to_string
                from django.conf import settings
                from xhtml2pdf import pisa
                from datetime import date
                import io
                
                # Récupérer les paramètres du site
                try:
                    site_settings = SiteSettings.get_settings()
                except SiteSettings.DoesNotExist:
                    site_settings = None
                
                # Préparer le contexte pour le template
                logo_path = None
                if site_settings and site_settings.logo:
                    import os
                    logo_path = site_settings.logo.path
                    if not os.path.exists(logo_path):
                        logo_path = None
                
                context = {
                    'invoice': invoice,
                    'quote_request': quote_request,
                    'site_settings': site_settings,
                    'today': date.today(),
                    'logo_path': logo_path,
                }
                
                # Rendre le template HTML
                html_string = render_to_string('invoice.html', context)
                
                # Générer le PDF
                result = io.BytesIO()
                pdf_file = pisa.pisaDocument(
                    io.BytesIO(html_string.encode("UTF-8")),
                    result,
                    encoding='UTF-8'
                )
                
                if not pdf_file.err:
                    # Créer le message email
                    subject = f'Facture {invoice.invoice_number} - {site_settings.site_name if site_settings else "Services Locaux"}'
                    
                    # Corps de l'email en HTML
                    email_body = render_to_string('invoice_email.html', context)
                    
                    # Créer l'email avec pièce jointe
                    # Utiliser l'email configuré dans les settings
                    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
                    if not from_email:
                        # Si DEFAULT_FROM_EMAIL n'est pas défini, utiliser EMAIL_HOST_USER
                        from_email = getattr(settings, 'EMAIL_HOST_USER', 'noreply@serviceslocaux.ci')
                    
                    email = EmailMessage(
                        subject=subject,
                        body=email_body,
                        from_email=from_email,
                        to=[quote_request.client_email],
                    )
                    email.content_subtype = 'html'
                    
                    # Attacher le PDF
                    email.attach(
                        f'facture-{invoice.invoice_number}.pdf',
                        result.getvalue(),
                        'application/pdf'
                    )
                    
                    # Envoyer l'email et mettre à jour le statut si succès
                    try:
                        email.send(fail_silently=False)
                        # Mettre à jour le statut du devis à "QUOTED" (Devis envoyé)
                        if quote_request.status != 'QUOTED':
                            quote_request.status = 'QUOTED'
                            if not quote_request.quoted_at:
                                quote_request.quoted_at = timezone.now()
                            quote_request.save()
                    except Exception as email_error:
                        # Si l'envoi d'email échoue, on continue quand même
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f'Erreur lors de l\'envoi de la facture par email: {str(email_error)}')
            except Exception as e:
                # Si l'envoi d'email échoue, on continue quand même
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Erreur lors de l\'envoi de la facture par email: {str(e)}')
        
        if created_count > 0:
            self.message_user(request, f'{created_count} facture(s) créée(s) avec succès.')
        if skipped_count > 0:
            self.message_user(request, f'{skipped_count} devis ont déjà une facture.', level='warning')
    create_invoice.short_description = "📄 Créer une facture"


class QuoteFormOptionInline(admin.TabularInline):
    """Inline pour gérer les options directement dans l'étape"""
    model = QuoteFormOption
    extra = 1
    fields = ('label', 'value', 'price', 'price_enabled', 'order', 'active', 'allow_custom_text')
    ordering = ('order',)


@admin.register(QuoteFormStep)
class QuoteFormStepAdmin(admin.ModelAdmin):
    """Admin pour QuoteFormStep"""
    list_display = ['service', 'title', 'step_type', 'order', 'required', 'active', 'field_key', 'options_count']
    list_filter = ['service', 'step_type', 'active', 'required']
    search_fields = ['title', 'description', 'field_key', 'service__name']
    ordering = ['service', 'order']
    list_editable = ['order', 'active', 'required']
    inlines = [QuoteFormOptionInline]
    
    fieldsets = (
        ('Service et type', {
            'fields': ('service', 'step_type', 'field_key'),
            'description': 'Sélectionnez le service et le type d\'étape. La clé du champ (field_key) sera utilisée pour stocker la réponse du client.'
        }),
        ('Contenu', {
            'fields': ('title', 'description'),
            'description': 'Le titre sera affiché comme question à l\'utilisateur. La description est optionnelle.'
        }),
        ('Configuration', {
            'fields': ('order', 'required', 'active'),
            'description': 'L\'ordre détermine l\'ordre d\'affichage des étapes. Si "Obligatoire" est coché, l\'utilisateur doit répondre avant de continuer.'
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('service').prefetch_related('options')
    
    def options_count(self, obj):
        """Afficher le nombre d'options pour cette étape"""
        return obj.options.count()
    options_count.short_description = 'Nombre d\'options'


@admin.register(QuoteFormOption)
class QuoteFormOptionAdmin(admin.ModelAdmin):
    """Admin pour QuoteFormOption (vue séparée si besoin)"""
    list_display = ['step', 'label', 'value', 'price', 'price_enabled', 'order', 'active', 'allow_custom_text']
    list_filter = ['step__service', 'step', 'active', 'price_enabled', 'allow_custom_text']
    search_fields = ['label', 'value', 'step__title', 'step__service__name']
    ordering = ['step__service', 'step__order', 'order']
    list_editable = ['price', 'price_enabled', 'order', 'active', 'allow_custom_text']
    
    fieldsets = (
        ('Étape', {
            'fields': ('step',),
            'description': 'Sélectionnez l\'étape à laquelle cette option appartient.'
        }),
        ('Option', {
            'fields': ('label', 'value', 'price', 'price_enabled'),
            'description': 'Le libellé est affiché à l\'utilisateur. La valeur est stockée dans la base de données. Le prix sera ajouté au total de la facture si cette option est sélectionnée ET si "Prix activé" est coché.'
        }),
        ('Configuration', {
            'fields': ('order', 'active', 'allow_custom_text'),
            'description': 'L\'ordre détermine l\'ordre d\'affichage des options. Si "Permettre texte personnalisé" est coché, l\'utilisateur pourra saisir un texte personnalisé pour cette option.'
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('step', 'step__service')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin pour Invoice"""
    list_display = ['invoice_number', 'quote_request', 'client_name', 'total', 'currency', 'invoice_date', 'invoice_actions']
    list_filter = ['currency', 'invoice_date', 'created_at']
    search_fields = ['invoice_number', 'quote_request__client_name', 'quote_request__client_email']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at', 'created_by']
    fieldsets = (
        ('Informations facture', {
            'fields': ('quote_request', 'invoice_number', 'invoice_date', 'due_date')
        }),
        ('Montants', {
            'fields': ('subtotal', 'tax_rate', 'tax_amount', 'total', 'currency')
        }),
        ('Notes et conditions', {
            'fields': ('notes', 'payment_terms'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def client_name(self, obj):
        return obj.quote_request.client_name
    client_name.short_description = 'Client'
    
    def invoice_actions(self, obj):
        """Boutons d'action pour la facture"""
        buttons = [
            format_html(
                '<a class="button" href="/api/invoices/{}/pdf/" target="_blank">📄 Voir PDF</a>',
                obj.id
            ),
            format_html(
                '<a class="button" href="/api/invoices/{}/send_email/" onclick="return confirm(\'Envoyer la facture par email à {}?\');">📧 Envoyer par email</a>',
                obj.id,
                obj.quote_request.client_email
            ),
            format_html(
                '<a class="button" href="/admin/api/invoice/{}/change/">✏️ Modifier</a>',
                obj.id
            ),
        ]
        return format_html(' '.join(buttons))
    invoice_actions.short_description = 'Actions'


@admin.register(ServiceAdvantage)
class ServiceAdvantageAdmin(admin.ModelAdmin):
    """Admin pour ServiceAdvantage"""
    list_display = ['title', 'icon', 'order', 'active', 'created_at']
    list_filter = ['active', 'icon', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['order', 'active']


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """Admin pour SiteSettings"""
    list_display = ['site_name', 'primary_color', 'secondary_color', 'logo_preview', 'updated_at']
    readonly_fields = ['created_at', 'updated_at', 'logo_preview', 'logo_favicon_preview']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('site_name', 'site_tagline')
        }),
        ('Couleurs principales', {
            'fields': ('primary_color', 'secondary_color', 'tertiary_color'),
            'description': 'Couleurs principales utilisées pour la navigation, titres et éléments visuels (format hex: #DC2626)'
        }),
        ('Couleurs des boutons', {
            'fields': ('button_primary_color', 'button_primary_hover_color', 'button_text_color'),
            'description': 'Couleurs spécifiques pour tous les boutons du site. Si vides, utilisent les couleurs principales.'
        }),
        ('Couleurs des textes et liens', {
            'fields': ('text_primary_color', 'text_link_color', 'text_link_hover_color'),
            'description': 'Couleurs pour les textes importants et les liens cliquables. Si vides, utilisent les couleurs principales.'
        }),
        ('Bannière (bandeau promo)', {
            'fields': ('banner_bg_color', 'banner_text_color'),
        }),
        ('Footer', {
            'fields': ('footer_bg_color', 'footer_text_color', 'footer_link_color', 'footer_link_hover_color', 'footer_border_color'),
        }),
        ('Bordures des boutons', {
            'fields': ('button_border_color', 'button_border_width', 'button_border_radius'),
        }),
        ('Boutons outline (ex. Connexion)', {
            'fields': ('button_outline_border_color', 'button_outline_text_color', 'button_outline_hover_bg_color'),
        }),
        ('Couleurs du nom et slogan (navbar)', {
            'fields': ('site_name_part1_color', 'site_name_part2_color', 'site_tagline_color'),
        }),
        ('Logo et favicon', {
            'fields': ('logo', 'logo_preview', 'logo_favicon', 'logo_favicon_preview')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 200px;" />', obj.logo.url)
        return "Aucun logo"
    logo_preview.short_description = "Aperçu du logo"
    
    def logo_favicon_preview(self, obj):
        if obj.logo_favicon:
            return format_html('<img src="{}" style="max-height: 32px; max-width: 32px;" />', obj.logo_favicon.url)
        return "Aucun favicon"
    logo_favicon_preview.short_description = "Aperçu du favicon"
    
    def has_add_permission(self, request):
        # Ne permettre qu'une seule instance
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Ne pas permettre la suppression
        return False


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Admin pour Patient avec gestion des QR codes"""
    list_display = ['full_name', 'client', 'qr_code_short', 'is_active', 'created_by', 'created_at', 'qr_actions']
    list_filter = ['is_active', 'created_at', 'created_by', 'client']
    search_fields = ['first_name', 'last_name', 'qr_code', 'client__username', 'phone']
    readonly_fields = ['qr_code', 'created_at', 'updated_at', 'created_by', 'qr_code_preview']
    fieldsets = (
        ('Informations patient', {
            'fields': ('first_name', 'last_name', 'phone', 'address')
        }),
        ('Client propriétaire', {
            'fields': ('client',),
            'description': 'Client qui possède ce patient'
        }),
        ('QR Code', {
            'fields': ('qr_code', 'qr_code_image', 'qr_code_preview', 'is_active'),
            'description': 'Le QR code est généré automatiquement. Vous pouvez générer l\'image en cliquant sur "Générer QR Code" dans la liste.'
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_patients', 'deactivate_patients', 'generate_qr_images']
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Nom complet'
    
    def qr_code_short(self, obj):
        return obj.qr_code[:16] + '...' if len(obj.qr_code) > 16 else obj.qr_code
    qr_code_short.short_description = 'QR Code'
    
    def qr_code_preview(self, obj):
        if obj.qr_code_image:
            return format_html('<img src="{}" style="max-height: 200px; max-width: 200px;" />', obj.qr_code_image.url)
        return format_html('<span style="color: orange;">Image QR code non générée. Cliquez sur "Générer QR Code" dans la liste.</span>')
    qr_code_preview.short_description = "Aperçu QR Code"
    
    def qr_actions(self, obj):
        """Boutons d'action pour le QR code"""
        return format_html(
            '<a class="button" href="/api/patients/{}/generate_qr_image/" target="_blank">📱 Générer QR Code</a>',
            obj.id
        )
    qr_actions.short_description = 'Actions QR'
    
    def activate_patients(self, request, queryset):
        """Action : activer les patients sélectionnés"""
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} patient(s) activé(s) avec succès.')
    activate_patients.short_description = "✓ Activer les patients sélectionnés"
    
    def deactivate_patients(self, request, queryset):
        """Action : désactiver les patients sélectionnés"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} patient(s) désactivé(s) avec succès.')
    deactivate_patients.short_description = "✗ Désactiver les patients sélectionnés"
    
    def generate_qr_images(self, request, queryset):
        """Action : générer les images QR code pour les patients sélectionnés (avec nom du patient)"""
        try:
            count = 0
            for patient in queryset:
                # Utiliser la méthode du modèle qui génère le QR code avec le nom
                try:
                    # Supprimer l'ancienne image si elle existe pour forcer la régénération
                    if patient.qr_code_image:
                        patient.qr_code_image.delete(save=False)
                    # Générer la nouvelle image avec le nom
                    patient.generate_qr_image()
                    count += 1
                except Exception as e:
                    # Continuer avec les autres patients même si un échoue
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Erreur lors de la génération du QR code pour le patient {patient.id}: {str(e)}')
            
            self.message_user(request, f'{count} image(s) QR code générée(s) avec succès (avec nom du patient).')
        except ImportError:
            self.message_user(request, 'Bibliothèque qrcode non installée. Installez avec: pip install qrcode[pil]', level='error')
        except Exception as e:
            self.message_user(request, f'Erreur lors de la génération: {str(e)}', level='error')
    generate_qr_images.short_description = "📱 Générer les images QR code"
    
    def save_model(self, request, obj, form, change):
        """Sauvegarde avec created_by"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    """Admin pour Presence"""
    list_display = ['patient', 'employe', 'status_badge', 'scan_time', 'duration_display']
    list_filter = ['status', 'scan_time', 'employe', 'patient__client']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__qr_code', 'employe__username', 'employe__matricule']
    readonly_fields = ['scan_time', 'duration_display']
    date_hierarchy = 'scan_time'
    fieldsets = (
        ('Informations présence', {
            'fields': ('patient', 'employe', 'status', 'scan_time')
        }),
        ('Localisation', {
            'fields': ('latitude', 'longitude'),
            'description': 'Coordonnées GPS du scan (optionnel)'
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Durée', {
            'fields': ('duration_display',),
            'description': 'Durée calculée automatiquement si arrivée et départ sont enregistrés'
        }),
    )
    
    def status_badge(self, obj):
        """Affiche un badge coloré pour le statut"""
        colors = {
            'ARRIVEE': 'green',
            'DEPART': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    status_badge.admin_order_field = 'status'
    
    def duration_display(self, obj):
        """Affiche la durée de la prestation"""
        duration = obj.duration
        if duration:
            hours = int(duration)
            minutes = int((duration - hours) * 60)
            return f"{hours}h {minutes}min"
        return "-"
    duration_display.short_description = 'Durée'


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    """Admin pour EmployeeProfile"""
    list_display = ['user', 'poste_fonction', 'type_contrat', 'statut_compte', 'statut_documents', 'created_at']
    list_filter = ['statut_compte', 'type_contrat', 'temps_travail', 'statut_documents', 'created_at']
    search_fields = [
        'user__username', 'user__email', 'user__matricule',
        'user__first_name', 'user__last_name',
        'poste_fonction', 'service_departement', 'numero_employe_interne'
    ]
    readonly_fields = ['created_at', 'updated_at', 'derniere_connexion']
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Identité', {
            'fields': ('sexe', 'date_naissance', 'nationalite', 'photo_profil', 'signature')
        }),
        ('Coordonnées', {
            'fields': (
                'email_professionnel', 'email_personnel',
                'telephone_principal', 'telephone_secondaire',
                'adresse_numero_rue', 'adresse_ville', 'adresse_code_postal', 'adresse_pays'
            )
        }),
        ('Authentification & Sécurité', {
            'fields': (
                'statut_compte', 'derniere_connexion', 'tentatives_connexion_echouees',
                'appareil_utilise', 'ip_derniere_connexion'
            )
        }),
        ('Informations professionnelles', {
            'fields': (
                'poste_fonction', 'service_departement', 'type_contrat',
                'date_debut_contrat', 'date_fin_contrat', 'temps_travail',
                'taux_horaire', 'salaire', 'mode_paiement',
                'numero_securite_sociale', 'numero_employe_interne'
            )
        }),
        ('Documents', {
            'fields': (
                'contrat_signe', 'avenants', 'clause_non_concurrence',
                'note_information', 'piece_identite', 'diplomes_certifications',
                'documents_administratifs', 'date_signature_electronique', 'statut_documents'
            ),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
