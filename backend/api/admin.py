from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import CustomUser, Service, Agency, Contact, PageContent, Category


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
            'fields': ('duration', 'price_per_hour', 'price_label'),
            'description': 'Informations sur la durée et le prix du service'
        }),
        ('Note et avis', {
            'fields': ('rating', 'review_count'),
            'description': 'Note sur 5 et nombre d\'avis clients'
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
