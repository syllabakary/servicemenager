from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from math import radians, cos, sin, asin, sqrt
from decimal import Decimal

from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest, ServiceAdvantage
from .serializers import (
    UserSerializer, ServiceSerializer, ServiceSummarySerializer,
    AgencySerializer, AgencySummarySerializer, ContactSerializer,
    PageContentSerializer, PageContentSummarySerializer, NavbarSerializer,
    CategorySerializer, ServiceReviewSerializer, ServiceFAQSerializer, QuoteRequestSerializer,
    ServiceAdvantageSerializer
)
from .permissions import (
    IsSuperAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin, IsClientOrReadOnly
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet pour CustomUser"""
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['role']
    
    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action == 'create':
            # Création : superadmin peut créer admin, clients peuvent s'inscrire
            return [AllowAny()]  # Géré dans perform_create
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsSuperAdmin() | IsOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filtrage selon le rôle"""
        user = self.request.user
        if user.is_superadmin:
            return CustomUser.objects.all()
        elif user.is_admin:
            # Admin voit tous sauf superadmins
            return CustomUser.objects.exclude(role='SUPERADMIN')
        else:
            # Client voit seulement son propre profil
            return CustomUser.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Endpoint pour récupérer l'utilisateur connecté"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Création avec restrictions"""
        user = self.request.user
        
        # Si pas authentifié, création de client (inscription)
        if not user.is_authenticated:
            serializer.save(role='CLIENT')
            return
        
        # Superadmin peut créer admin ou client
        if user.is_superadmin:
            role = serializer.validated_data.get('role', 'CLIENT')
            # Superadmin ne peut pas créer un autre superadmin via API
            if role == 'SUPERADMIN':
                role = 'ADMIN'
            serializer.save(role=role, created_by=user)
        # Admin ne peut pas créer d'utilisateurs
        else:
            serializer.save(role='CLIENT')


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet pour Service"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description']
    filterset_fields = ['active', 'slug']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = Service.objects.select_related('created_by')
        
        # Filtre par slug si fourni
        slug = self.request.query_params.get('slug')
        if slug:
            queryset = queryset.filter(slug=slug)
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or self.request.user.is_client:
            queryset = queryset.filter(active=True)
        
        return queryset
    
    def get_serializer_class(self):
        """Serializer selon l'action"""
        if self.action == 'list' and self.request.query_params.get('summary') == 'true':
            return ServiceSummarySerializer
        return ServiceSerializer
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrReadOnly])
    def toggle_active(self, request, pk=None):
        """Action pour activer/désactiver un service"""
        service = self.get_object()
        service.active = not service.active
        service.save()
        return Response({
            'id': service.id,
            'active': service.active,
            'message': f'Service {"activé" if service.active else "désactivé"}'
        })


class AgencyViewSet(viewsets.ModelViewSet):
    """ViewSet pour Agency"""
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'address']
    filterset_fields = ['active', 'city']
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = Agency.objects.select_related('created_by').prefetch_related('contacts')
        
        # Recherche par proximité
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius_km = self.request.query_params.get('radius_km', 10)
        
        if lat and lng:
            try:
                lat = Decimal(lat)
                lng = Decimal(lng)
                radius_km = Decimal(radius_km)
                queryset = self._filter_by_proximity(queryset, lat, lng, radius_km)
            except (ValueError, TypeError):
                pass
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or self.request.user.is_client:
            queryset = queryset.filter(active=True)
        
        return queryset
    
    def _filter_by_proximity(self, queryset, lat, lng, radius_km):
        """Filtre les agences par proximité (formule Haversine)"""
        # Conversion en radians
        lat_rad = radians(float(lat))
        lng_rad = radians(float(lng))
        radius_m = float(radius_km) * 1000
        
        # Filtre approximatif d'abord (bounding box)
        # 1 degré ≈ 111 km
        lat_delta = float(radius_km) / 111
        lng_delta = float(radius_km) / (111 * cos(lat_rad))
        
        # Filtre initial
        nearby = queryset.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=lat - Decimal(str(lat_delta)),
            latitude__lte=lat + Decimal(str(lat_delta)),
            longitude__gte=lng - Decimal(str(lng_delta)),
            longitude__lte=lng + Decimal(str(lng_delta))
        )
        
        # Calcul Haversine pour chaque agence
        results = []
        for agency in nearby:
            if agency.latitude and agency.longitude:
                distance = self._haversine(
                    float(lat), float(lng),
                    float(agency.latitude), float(agency.longitude)
                )
                if distance <= radius_m:
                    agency._distance = distance / 1000  # en km
                    results.append(agency)
        
        # Trier par distance
        results.sort(key=lambda x: x._distance)
        
        # Retourner un queryset avec les IDs
        ids = [a.id for a in results]
        return queryset.filter(id__in=ids).order_by('id')  # Note: ordre par distance perdu
    
    def _haversine(self, lat1, lon1, lat2, lon2):
        """Calcule la distance Haversine entre deux points GPS (en mètres)"""
        R = 6371000  # Rayon de la Terre en mètres
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
        c = 2 * asin(sqrt(a))
        
        return R * c
    
    def get_serializer_class(self):
        """Serializer selon l'action"""
        if self.action == 'list' and self.request.query_params.get('summary') == 'true':
            return AgencySummarySerializer
        return AgencySerializer
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrReadOnly])
    def toggle_active(self, request, pk=None):
        """Action pour activer/désactiver une agence"""
        agency = self.get_object()
        agency.active = not agency.active
        agency.save()
        return Response({
            'id': agency.id,
            'active': agency.active,
            'message': f'Agence {"activée" if agency.active else "désactivée"}'
        })
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def headquarters(self, request):
        """Récupère le siège social (contact avec is_headquarter=True)"""
        from .models import Contact
        contact = Contact.objects.filter(is_headquarter=True).first()
        if contact and contact.agency:
            serializer = AgencySerializer(contact.agency, context={'request': request})
            return Response(serializer.data)
        return Response({'detail': 'Siège social non trouvé'}, status=404)


class ContactViewSet(viewsets.ModelViewSet):
    """ViewSet pour Contact"""
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'email', 'role']
    filterset_fields = ['agency', 'is_headquarter']
    
    def get_queryset(self):
        """Optimisation avec select_related"""
        return Contact.objects.select_related('agency', 'created_by')
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)


class PageContentViewSet(viewsets.ModelViewSet):
    """ViewSet pour PageContent"""
    queryset = PageContent.objects.all()
    serializer_class = PageContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['key', 'title', 'body']
    filterset_fields = ['is_active', 'key']
    lookup_field = 'key'
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = PageContent.objects.select_related('created_by')
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or self.request.user.is_client:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def get_serializer_class(self):
        """Serializer selon l'action"""
        if self.action == 'list' and self.request.query_params.get('summary') == 'true':
            return PageContentSummarySerializer
        return PageContentSerializer
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet pour Category"""
    queryset = Category.objects.all().order_by('order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']


class NavbarViewSet(viewsets.ViewSet):
    """ViewSet pour l'endpoint navbar (meta endpoint)"""
    permission_classes = [AllowAny]
    
    def list(self, request):
        """Endpoint /api/navbar/ ou /api/meta/navbar/ qui renvoie services, agences et pages actifs"""
        # Services actifs triés par order et groupés par catégorie
        services = Service.objects.filter(active=True).select_related('category').order_by('category__order', 'category__name', 'order', 'name')
        services_data = ServiceSummarySerializer(services, many=True, context={'request': request}).data
        
        # Grouper les services par catégorie (seulement les catégories avec show_in_navbar=True)
        services_by_category = {}
        # Récupérer toutes les catégories avec show_in_navbar=True
        visible_categories = Category.objects.filter(show_in_navbar=True).order_by('order', 'name')
        visible_category_names = set(visible_categories.values_list('name', flat=True))
        
        for service in services_data:
            category_name = service.get('category_name')
            if category_name and category_name in visible_category_names:
                if category_name not in services_by_category:
                    services_by_category[category_name] = []
                services_by_category[category_name].append(service)
        
        # Agences actives
        agencies = Agency.objects.filter(active=True).order_by('name')
        agencies_data = AgencySummarySerializer(agencies, many=True, context={'request': request}).data
        
        # Pages actives triées par order
        pages = PageContent.objects.filter(is_active=True).order_by('order', 'key')
        pages_data = PageContentSummarySerializer(pages, many=True, context={'request': request}).data
        
        return Response({
            'services': services_data,  # Liste plate pour compatibilité
            'services_by_category': services_by_category,  # Groupés par catégorie (seulement show_in_navbar=True)
            'agencies': agencies_data,
            'pages': pages_data
        })
    
    # Alias pour compatibilité
    navbar = list


class ServiceReviewViewSet(viewsets.ModelViewSet):
    """ViewSet pour ServiceReview"""
    queryset = ServiceReview.objects.all()
    serializer_class = ServiceReviewSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'approved']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrage : seulement approuvés pour API publique"""
        queryset = ServiceReview.objects.select_related('service', 'user')
        
        # Si pas authentifié ou client, seulement approuvés ET affichables
        if not self.request.user.is_authenticated or self.request.user.is_client:
            queryset = queryset.filter(approved=True, display_on_page=True)
        
        return queryset
    
    def get_permissions(self):
        """Permissions : création publique, modification admin seulement"""
        if self.action == 'create':
            return [AllowAny()]  # Permettre à tous de créer un avis
        return [IsAdminOrReadOnly()]


class ServiceFAQViewSet(viewsets.ModelViewSet):
    """ViewSet pour ServiceFAQ"""
    queryset = ServiceFAQ.objects.all()
    serializer_class = ServiceFAQSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'active']
    ordering_fields = ['order', 'question']
    ordering = ['order', 'question']
    
    def get_queryset(self):
        """Filtrage : seulement actifs pour API publique"""
        queryset = ServiceFAQ.objects.select_related('service')
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or self.request.user.is_client:
            queryset = queryset.filter(active=True)
        
        return queryset


class ServiceAdvantageViewSet(viewsets.ModelViewSet):
    """ViewSet pour ServiceAdvantage"""
    queryset = ServiceAdvantage.objects.all()
    serializer_class = ServiceAdvantageSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    filterset_fields = ['active', 'icon']
    ordering_fields = ['order', 'title']
    ordering = ['order', 'title']
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = ServiceAdvantage.objects.all()
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or (hasattr(self.request.user, 'is_client') and self.request.user.is_client):
            queryset = queryset.filter(active=True)
        
        return queryset.order_by('order', 'title')


class QuoteRequestViewSet(viewsets.ModelViewSet):
    """ViewSet pour QuoteRequest"""
    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['client_name', 'client_email', 'client_phone', 'location', 'service__name']
    filterset_fields = ['service', 'status']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrage selon le rôle"""
        queryset = QuoteRequest.objects.select_related('service', 'created_by_user')
        
        # Si pas authentifié ou client, seulement leurs propres demandes
        if not self.request.user.is_authenticated or self.request.user.is_client:
            if self.request.user.is_authenticated:
                queryset = queryset.filter(created_by_user=self.request.user)
            else:
                # Pour les non authentifiés, on ne peut pas filtrer par utilisateur
                # On retourne un queryset vide ou on permet la création seulement
                queryset = QuoteRequest.objects.none()
        
        return queryset
    
    def get_permissions(self):
        """Permissions : création publique, modification admin seulement"""
        if self.action == 'create':
            return [AllowAny()]  # Permettre à tous de créer une demande
        return [IsAdminOrReadOnly()]
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrReadOnly])
    def mark_contacted(self, request, pk=None):
        """Marquer la demande comme contactée"""
        quote_request = self.get_object()
        from django.utils import timezone
        quote_request.status = 'CONTACTED'
        quote_request.contacted_at = timezone.now()
        quote_request.save()
        serializer = self.get_serializer(quote_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrReadOnly])
    def mark_quoted(self, request, pk=None):
        """Marquer la demande comme devis envoyé"""
        quote_request = self.get_object()
        from django.utils import timezone
        quote_request.status = 'QUOTED'
        quote_request.quoted_at = timezone.now()
        quote_request.save()
        serializer = self.get_serializer(quote_request)
        return Response(serializer.data)
