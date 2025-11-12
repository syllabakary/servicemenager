from django.db import models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service, Agence, Quote, Contact
from .serializers import (
    ServiceSerializer, AgenceSerializer,
    QuoteSerializer, ContactSerializer
)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(actif=True)
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['actif']
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'note', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        limit = self.request.query_params.get('limit', None)
        min_rating = self.request.query_params.get('minRating', None)
        
        if min_rating:
            try:
                queryset = queryset.filter(note__gte=float(min_rating))
            except ValueError:
                pass
        
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques des services"""
        queryset = self.get_queryset()
        total = queryset.count()
        avg_rating = queryset.aggregate(
            avg=models.Avg('note')
        )['avg'] or 0
        total_reviews = queryset.aggregate(
            total=models.Sum('nombre_avis')
        )['total'] or 0
        
        return Response({
            'total_services': total,
            'avg_rating': round(float(avg_rating), 1),
            'total_reviews': total_reviews
        })


class AgenceViewSet(viewsets.ModelViewSet):
    queryset = Agence.objects.filter(actif=True)
    serializer_class = AgenceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ville', 'actif']
    search_fields = ['nom', 'description', 'ville']
    ordering_fields = ['nom', 'ville', 'note', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        service = self.request.query_params.get('service', None)
        limit = self.request.query_params.get('limit', None)
        
        if service:
            queryset = queryset.filter(services__nom__icontains=service).distinct()
        
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques des agences"""
        queryset = self.get_queryset()
        total = queryset.count()
        avg_rating = queryset.aggregate(
            avg=models.Avg('note')
        )['avg'] or 0
        total_reviews = queryset.aggregate(
            total=models.Sum('nombre_avis')
        )['total'] or 0
        total_clients = queryset.aggregate(
            total=models.Sum('nombre_clients')
        )['total'] or 0
        total_experience = queryset.aggregate(
            total=models.Sum('annee_experience')
        )['total'] or 0
        
        return Response({
            'total_agencies': total,
            'avg_rating': round(float(avg_rating), 1),
            'total_reviews': total_reviews,
            'total_clients': total_clients,
            'total_experience': total_experience
        })


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    http_method_names = ['post', 'get']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    http_method_names = ['post', 'get']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )




