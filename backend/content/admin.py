from django.contrib import admin
from .models import ContentBlock


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = ['type', 'titre', 'actif', 'ordre', 'created_at']
    list_filter = ['type', 'actif', 'created_at']
    search_fields = ['titre', 'description']
    readonly_fields = ['created_at', 'updated_at']




