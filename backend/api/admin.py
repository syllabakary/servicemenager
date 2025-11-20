from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin pour CustomUser"""
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'phone')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'phone', 'email')
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
    
    actions = ['mark_contacted', 'mark_quoted', 'mark_accepted', 'mark_rejected']
    
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
