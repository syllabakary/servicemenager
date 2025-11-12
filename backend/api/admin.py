from django.contrib import admin
from .models import Service, Agence, Quote, Contact


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'note', 'nombre_avis', 'actif', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Agence)
class AgenceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ville', 'note', 'actif', 'created_at']
    list_filter = ['ville', 'actif', 'created_at']
    search_fields = ['nom', 'ville', 'description']
    filter_horizontal = ['services']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'service', 'statut', 'created_at']
    list_filter = ['statut', 'created_at']
    search_fields = ['nom', 'email', 'service']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'sujet', 'lu', 'created_at']
    list_filter = ['lu', 'created_at']
    search_fields = ['nom', 'email', 'sujet']
    readonly_fields = ['created_at']




