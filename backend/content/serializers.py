from rest_framework import serializers
from .models import ContentBlock


class ContentBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'type', 'titre', 'description', 'contenu',
            'image', 'actif', 'ordre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']




