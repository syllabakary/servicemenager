from rest_framework import serializers
from .models import Service, Agence, Quote, Contact


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'id', 'nom', 'description', 'description_longue',
            'icone', 'image', 'avantages', 'duree', 'prix',
            'note', 'nombre_avis', 'actif', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AgenceSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    services_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),
        source='services',
        write_only=True,
        required=False
    )

    class Meta:
        model = Agence
        fields = [
            'id', 'nom', 'description', 'ville', 'adresse',
            'telephone', 'email', 'horaires', 'image',
            'services', 'services_ids', 'note', 'nombre_avis',
            'annee_experience', 'nombre_clients', 'actif',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'id', 'localisation', 'service', 'type_aide',
            'sous_type_aide', 'besoins', 'destinataire',
            'nom', 'email', 'telephone', 'message', 'statut',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'statut']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'nom', 'email', 'sujet', 'message', 'lu', 'created_at']
        read_only_fields = ['lu', 'created_at']




