from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from math import radians, cos, sin, asin, sqrt
from decimal import Decimal
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import logging
import traceback

logger = logging.getLogger(__name__)

from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest, QuoteLine, ServiceAdvantage, SiteSettings, Invoice, QuoteFormStep, QuoteFormOption, Patient, Presence, EmployeeProfile, ContactMessage, HeroContent, UserPermission
from .serializers import (
    UserSerializer, ServiceSerializer, ServiceSummarySerializer,
    AgencySerializer, AgencySummarySerializer, ContactSerializer,
    PageContentSerializer, PageContentSummarySerializer, NavbarSerializer,
    CategorySerializer, ServiceReviewSerializer, ServiceFAQSerializer, QuoteRequestSerializer,
    QuoteLineSerializer, ServiceAdvantageSerializer, SiteSettingsSerializer, InvoiceSerializer,
    QuoteFormStepSerializer, QuoteFormOptionSerializer, PatientSerializer, PresenceSerializer,
    EmployeeProfileSerializer, ContactMessageSerializer, HeroContentSerializer,
    ActivityLogSerializer, UserPermissionSerializer, UserPermissionBulkSerializer, UserWithPermissionsSerializer,
    build_url
)
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .permissions import (
    IsSuperAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin, IsClientOrReadOnly,
    IsAdmin, IsEmploye, IsClient, IsSuperAdminOrAdmin, IsSuperAdminOrAdminOrEmploye,
    IsAdminOrPublicReadOnly
)


# ── Soft Delete Mixin ─────────────────────────────────────────────────────────

class SoftDeleteMixin:
    """Remplace la suppression définitive par un soft delete (deleted_at)"""

    def destroy(self, request, *args, **kwargs):
        from django.utils import timezone
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['deleted_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Mixin de vérification de permissions granulaires ─────────────────────────

_ACTION_MAP = {
    'list':           'view',
    'retrieve':       'view',
    'create':         'create',
    'update':         'update',
    'partial_update': 'update',
    'destroy':        'delete',
    'send_email':     'email',
    'send_quote':     'email',
    'pdf':            'pdf',
    'download_pdf':   'pdf',
    'generate_pdf':   'pdf',
}


class ModulePermissionMixin:
    """
    Mixin à ajouter sur un ViewSet pour vérifier les permissions granulaires.
    Définir `module_name` sur la classe enfant.
    SUPERADMIN passe toujours. CLIENT/EMPLOYE ne sont pas concernés.
    """
    module_name = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        user = request.user
        if not user or not user.is_authenticated:
            return
        if getattr(user, 'role', None) != 'ADMIN':
            return
        if not self.module_name:
            return
        action_name = _ACTION_MAP.get(self.action, None)
        if not action_name:
            return
        if not UserPermission.has_permission(user, self.module_name, action_name):
            from rest_framework.exceptions import PermissionDenied
            MODULE_LABELS = dict(UserPermission.MODULE_CHOICES)
            ACTION_LABELS = dict(UserPermission.ACTION_CHOICES)
            raise PermissionDenied(detail={
                "code": "permission_denied",
                "message": "Vous n'avez pas la permission d'effectuer cette action.",
                "module": self.module_name,
                "module_label": MODULE_LABELS.get(self.module_name, self.module_name),
                "action": action_name,
                "action_label": ACTION_LABELS.get(action_name, action_name),
            })


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
            # Seuls les admins/superadmins peuvent créer des utilisateurs
            return [IsSuperAdminOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filtrage selon le rôle"""
        user = self.request.user
        if user.is_superadmin:
            return CustomUser.objects.all()
        elif user.is_admin:
            # Admin voit tous sauf superadmins, peut voir employés et clients
            return CustomUser.objects.exclude(role='SUPERADMIN')
        elif user.is_employe:
            # Employé voit seulement son propre profil
            return CustomUser.objects.filter(id=user.id)
        else:
            # Client voit seulement son propre profil
            return CustomUser.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Endpoint pour récupérer l'utilisateur connecté"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        """Endpoint pour que l'employé mette à jour son propre profil (email, phone, photo)"""
        user = request.user
        update_fields = []
        if 'email' in request.data:
            user.email = request.data['email']
            update_fields.append('email')
        if 'phone' in request.data:
            user.phone = request.data['phone']
            update_fields.append('phone')
        if update_fields:
            user.save(update_fields=update_fields)
        # Photo de profil sur le modèle Employe lié
        photo_url = None
        if 'photo' in request.FILES:
            try:
                ep = user.employee_profile
                ep.photo_profil = request.FILES['photo']
                ep.save(update_fields=['photo_profil'])
                photo_url = build_url(ep.photo_profil.url, request)
            except Exception:
                pass
        else:
            try:
                ep = user.employee_profile
                if ep.photo_profil:
                    photo_url = build_url(ep.photo_profil.url, request)
            except Exception:
                pass
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'matricule': user.matricule,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'photo_url': photo_url,
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        """Endpoint pour changer son propre mot de passe"""
        user = self.get_object()
        
        # Vérifier que l'utilisateur change son propre mot de passe
        if user.id != request.user.id:
            return Response(
                {'error': 'Vous ne pouvez changer que votre propre mot de passe.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'error': 'L\'ancien mot de passe et le nouveau mot de passe sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(old_password):
            return Response(
                {'error': 'L\'ancien mot de passe est incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Valider le nouveau mot de passe
        from django.contrib.auth.password_validation import validate_password
        from django.conf import settings
        try:
            if not settings.DEBUG:
                validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {'error': 'Le nouveau mot de passe ne respecte pas les critères de sécurité.', 'details': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        logger.info(f"Mot de passe changé pour l'utilisateur {user.username} (ID: {user.id})")
        
        return Response(
            {'message': 'Mot de passe changé avec succès.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOrAdmin])
    def reset_password(self, request, pk=None):
        """Endpoint pour réinitialiser le mot de passe d'un utilisateur (admin seulement). Envoie le nouveau mot de passe par email si l'utilisateur a un email."""
        user = self.get_object()
        
        # Les admins ne peuvent pas réinitialiser le mot de passe des superadmins
        if user.is_superadmin and not request.user.is_superadmin:
            return Response(
                {'error': 'Vous ne pouvez pas réinitialiser le mot de passe d\'un superadmin.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        import secrets
        import string
        default_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        user.set_password(default_password)
        # Réinitialiser aussi le verrouillage si le compte était bloqué
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save()
        
        logger.info(f"Mot de passe réinitialisé pour l'utilisateur {user.username} (ID: {user.id}) par {request.user.username}")
        
        email_sent = False
        to_email = (getattr(user, 'email', None) or '').strip()
        if to_email:
            try:
                site_settings = SiteSettings.get_settings()
                smtp_host = getattr(site_settings, 'smtp_host', None)
                smtp_username = getattr(site_settings, 'smtp_username', None)
                smtp_password = getattr(site_settings, 'smtp_password', None)
                smtp_port = getattr(site_settings, 'smtp_port', 587)
                smtp_use_tls = getattr(site_settings, 'smtp_use_tls', True)
                smtp_use_ssl = getattr(site_settings, 'smtp_use_ssl', False)
                site_name = getattr(site_settings, 'site_name', None) or 'Services Locaux'
                if smtp_host and smtp_username and smtp_password:
                    timeout = 30
                    if smtp_use_ssl:
                        smtp_server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=timeout)
                    else:
                        smtp_server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                        if smtp_use_tls:
                            smtp_server.starttls()
                    smtp_server.login(smtp_username, smtp_password)
                    subject = f'{site_name} - Réinitialisation de votre mot de passe'
                    # Pour les employés, afficher le matricule comme identifiant de connexion
                    login_id_label = "Matricule" if getattr(user, 'role', '') == 'EMPLOYE' else "Nom d'utilisateur"
                    login_id_value = getattr(user, 'matricule', None) if getattr(user, 'role', '') == 'EMPLOYE' else user.username
                    body = f"""Bonjour {user.first_name or user.username},

Votre mot de passe a été réinitialisé par un administrateur.

{login_id_label} : {login_id_value}
Nouveau mot de passe : {default_password}

Connectez-vous avec ces identifiants. Vous pourrez modifier votre mot de passe une fois connecté (Profil > Changer mot de passe).

—
{site_name}
"""
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = subject
                    msg['From'] = smtp_username
                    msg['To'] = to_email
                    msg.attach(MIMEText(body, 'plain', 'utf-8'))
                    smtp_server.send_message(msg)
                    smtp_server.quit()
                    email_sent = True
                    logger.info(f"Email avec nouveau mot de passe envoyé à {to_email}")
            except Exception as e:
                logger.warning(f"Envoi email réinitialisation mot de passe échoué: {e}")
        
        return Response(
            {
                'message': f'Mot de passe réinitialisé avec succès pour {user.username}.',
                'new_password': default_password,
                'user_id': user.id,
                'username': user.username,
                'email_sent': email_sent,
                'email': to_email or None,
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOrAdmin])
    def unlock(self, request, pk=None):
        """Débloquer un compte verrouillé après trop de tentatives échouées."""
        user = self.get_object()
        if user.is_superadmin and not request.user.is_superadmin:
            return Response(
                {'error': 'Vous ne pouvez pas débloquer un superadmin.'},
                status=status.HTTP_403_FORBIDDEN
            )
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=['failed_login_attempts', 'locked_until'])
        logger.info(f"Compte débloqué: {user.username} par {request.user.username}")
        try:
            from api.models import ActivityLog
            ActivityLog.objects.create(
                user=request.user,
                action="OTHER",
                level="INFO",
                model_name="Utilisateur",
                object_id=str(user.pk),
                object_repr=user.username,
                detail=f"Compte débloqué par {request.user.username}",
            )
        except Exception:
            pass
        return Response({'message': f'Compte {user.username} débloqué avec succès.'}, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        """Création avec restrictions"""
        user = self.request.user
        
        # Si pas authentifié, création de client (inscription)
        if not user.is_authenticated:
            serializer.save(role='CLIENT')
            return
        
        # Superadmin peut créer admin, employé ou client
        if user.is_superadmin:
            role = serializer.validated_data.get('role', 'CLIENT')
            # Superadmin ne peut pas créer un autre superadmin via API
            if role == 'SUPERADMIN':
                role = 'ADMIN'
            try:
                new_user = serializer.save(role=role, created_by=user)
            except DjangoValidationError as e:
                raise DRFValidationError({'password': e.messages})
            # Créer automatiquement le profil employé si c'est un employé
            if role == 'EMPLOYE':
                try:
                    EmployeeProfile.objects.get_or_create(user=new_user)
                except Exception:
                    pass  # Ignorer si le profil existe déjà
        # Admin peut créer employé ou client
        elif user.is_admin:
            role = serializer.validated_data.get('role', 'CLIENT')
            # Admin ne peut créer que des employés ou des clients
            if role not in ['EMPLOYE', 'CLIENT']:
                role = 'CLIENT'
            try:
                new_user = serializer.save(role=role, created_by=user)
            except DjangoValidationError as e:
                raise DRFValidationError({'password': e.messages})
            # Créer automatiquement le profil employé si c'est un employé
            if role == 'EMPLOYE':
                try:
                    EmployeeProfile.objects.get_or_create(user=new_user)
                except Exception:
                    pass  # Ignorer si le profil existe déjà
        # Autres utilisateurs ne peuvent créer que des clients
        else:
            serializer.save(role='CLIENT')
    
    def perform_destroy(self, instance):
        """Suppression avec gestion des relations"""
        logger = logging.getLogger(__name__)
        username = getattr(instance, 'username', 'Unknown')
        user_id = getattr(instance, 'id', None)
        
        try:
            # Si c'est un employé, supprimer d'abord les relations explicites pour éviter les erreurs de contrainte
            if instance.is_employe:
                # Supprimer les présences associées en premier
                try:
                    deleted_info = Presence.objects.filter(employe=instance).delete()
                    deleted_count = deleted_info[0] if isinstance(deleted_info, tuple) else 0
                    if deleted_count > 0:
                        logger.info(f"{deleted_count} présences supprimées pour {username}")
                except Exception as e:
                    logger.warning(f"Erreur lors de la suppression des présences pour {username}: {e}")
                    # Ne pas bloquer si les présences ne peuvent pas être supprimées
                
                # Supprimer le profil employé s'il existe (doit être fait avant la suppression de l'utilisateur)
                try:
                    # Vérifier si le profil existe
                    try:
                        profile = EmployeeProfile.objects.get(user=instance)
                        profile_id = profile.id
                        profile.delete()
                        logger.info(f"Profil employé (ID: {profile_id}) supprimé pour {username}")
                    except EmployeeProfile.DoesNotExist:
                        logger.info(f"Aucun profil employé trouvé pour {username}")
                except Exception as e:
                    logger.warning(f"Erreur lors de la suppression du profil employé pour {username}: {e}")
                    # Ne pas bloquer si le profil ne peut pas être supprimé
            
            # Supprimer l'utilisateur (Django gérera automatiquement les autres relations CASCADE)
            instance.delete()
            logger.info(f"Utilisateur {username} (ID: {user_id}) supprimé avec succès")
        except Exception as e:
            error_msg = f"Erreur lors de la suppression de l'utilisateur {username} (ID: {user_id}): {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            from rest_framework.exceptions import APIException
            # Retourner un message d'erreur plus détaillé avec le type d'erreur
            error_type = type(e).__name__
            raise APIException(f"Erreur lors de la suppression ({error_type}): {str(e)}")


class ServiceViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Service"""
    module_name = 'services'
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description']
    filterset_fields = ['active', 'slug']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = Service.objects.select_related('created_by').filter(deleted_at__isnull=True)

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


class AgencyViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Agency"""
    module_name = 'agences'
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    permission_classes = [IsAdminOrPublicReadOnly]
    pagination_class = None

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'address']
    filterset_fields = ['active', 'city']
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrage : actifs seulement pour API publique"""
        queryset = Agency.objects.select_related('created_by').prefetch_related('contacts').filter(deleted_at__isnull=True)
        
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


class ContactViewSet(SoftDeleteMixin, viewsets.ModelViewSet):
    """ViewSet pour Contact"""
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'email', 'role']
    filterset_fields = ['agency', 'is_headquarter']

    def get_queryset(self):
        """Optimisation avec select_related"""
        return Contact.objects.select_related('agency', 'created_by').filter(deleted_at__isnull=True)
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)


class PageContentViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour PageContent"""
    module_name = 'bannieres'
    queryset = PageContent.objects.all()
    serializer_class = PageContentSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
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


class CategoryViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Category"""
    module_name = 'categories'
    queryset = Category.objects.filter(deleted_at__isnull=True).order_by('order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']

    def get_queryset(self):
        return Category.objects.filter(deleted_at__isnull=True).order_by('order', 'name')


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


class ServiceReviewViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour ServiceReview"""
    module_name = 'avis'
    queryset = ServiceReview.objects.all()
    serializer_class = ServiceReviewSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'approved', 'display_on_page']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtrage : seulement approuvés pour API publique"""
        queryset = ServiceReview.objects.select_related('service', 'user')

        # Si pas authentifié ou client, seulement approuvés ET affichables
        if not self.request.user.is_authenticated or getattr(self.request.user, 'role', None) == 'CLIENT':
            queryset = queryset.filter(approved=True, display_on_page=True)

        return queryset
    
    def get_permissions(self):
        """Permissions : création publique, lecture publique, modification admin seulement"""
        if self.action == 'create':
            return [AllowAny()]  # Permettre à tous de créer un avis
        return [IsAdminOrPublicReadOnly()]


class ServiceFAQViewSet(viewsets.ModelViewSet):
    """ViewSet pour ServiceFAQ — lecture publique (GET) sans auth pour la page détail service"""
    queryset = ServiceFAQ.objects.all()
    serializer_class = ServiceFAQSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'active']
    ordering_fields = ['order', 'question']
    ordering = ['order', 'question']
    
    def get_queryset(self):
        """Filtrage : seulement actifs pour API publique"""
        queryset = ServiceFAQ.objects.select_related('service')
        
        # Si pas authentifié ou client, seulement actifs
        if not self.request.user.is_authenticated or getattr(self.request.user, 'role', None) == 'CLIENT':
            queryset = queryset.filter(active=True)
        
        return queryset


class ServiceAdvantageViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour ServiceAdvantage"""
    module_name = 'avantages'
    queryset = ServiceAdvantage.objects.all()
    serializer_class = ServiceAdvantageSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
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


class QuoteRequestViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour QuoteRequest"""
    module_name = 'devis'
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
        queryset = QuoteRequest.objects.select_related('service', 'created_by_user').filter(deleted_at__isnull=True)
        
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
    
    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrReadOnly])
    def pdf(self, request, pk=None):
        """Générer le PDF du devis"""
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        from xhtml2pdf import pisa
        from datetime import date
        from decimal import Decimal
        import io
        import logging
        
        logger = logging.getLogger(__name__)
        quote_request = self.get_object()
        
        # Récupérer les paramètres du site
        try:
            site_settings = SiteSettings.get_settings()
        except Exception:
            site_settings = None
        
        # Préparer le contexte pour le template
        logo_path = None
        if site_settings:
            try:
                if hasattr(site_settings, 'logo') and site_settings.logo:
                    import os
                    import base64
                    logo_path = site_settings.logo.path
                    if os.path.exists(logo_path):
                        with open(logo_path, 'rb') as logo_file:
                            logo_data = base64.b64encode(logo_file.read()).decode('utf-8')
                            logo_extension = os.path.splitext(logo_path)[1].lower()
                            if logo_extension == '.png':
                                logo_path = f'data:image/png;base64,{logo_data}'
                            elif logo_extension in ['.jpg', '.jpeg']:
                                logo_path = f'data:image/jpeg;base64,{logo_data}'
                            else:
                                logo_path = f'data:image/png;base64,{logo_data}'
                    else:
                        logo_path = None
            except Exception as e:
                logger.error(f'Erreur lors du chargement du logo: {e}')
                logo_path = None
        
        # Logo secondaire (partenaire)
        logo_secondary_path = None
        if site_settings:
            try:
                if hasattr(site_settings, 'logo_secondary') and site_settings.logo_secondary:
                    import os
                    import base64
                    sec_path = site_settings.logo_secondary.path
                    if os.path.exists(sec_path):
                        with open(sec_path, 'rb') as f:
                            sec_data = base64.b64encode(f.read()).decode('utf-8')
                            sec_ext = os.path.splitext(sec_path)[1].lower()
                            mime = 'image/png' if sec_ext == '.png' else 'image/jpeg'
                            logo_secondary_path = f'data:{mime};base64,{sec_data}'
            except Exception as e:
                logger.error(f'Erreur lors du chargement du logo secondaire: {e}')

        # Logo signature (fin de devis)
        logo_signature_path = None
        if site_settings:
            try:
                if hasattr(site_settings, 'logo_signature') and site_settings.logo_signature:
                    import os
                    import base64
                    sig_path = site_settings.logo_signature.path
                    if os.path.exists(sig_path):
                        with open(sig_path, 'rb') as f:
                            sig_data = base64.b64encode(f.read()).decode('utf-8')
                            sig_ext = os.path.splitext(sig_path)[1].lower()
                            mime = 'image/png' if sig_ext == '.png' else 'image/jpeg'
                            logo_signature_path = f'data:{mime};base64,{sig_data}'
            except Exception as e:
                logger.error(f'Erreur lors du chargement du logo signature: {e}')

        # Calculer total A et total B depuis les lignes
        all_lines_for_total = list(quote_request.lines.all())

        def get_total_for_category(lines, category):
            cat_lines = [l for l in lines if l.category == category]
            # Si une ligne bold existe avec un total, c'est le total de la catégorie
            bold_lines = [l for l in cat_lines if l.is_bold and l.total]
            if bold_lines:
                try:
                    return float(bold_lines[-1].total)
                except (ValueError, TypeError):
                    pass
            # Sinon on somme les lignes non-bold
            total = 0.0
            for l in cat_lines:
                if not l.is_bold and l.total:
                    try:
                        total += float(l.total)
                    except (ValueError, TypeError):
                        pass
            return total

        total_a_lines = get_total_for_category(all_lines_for_total, 'A')
        total_b_lines = get_total_for_category(all_lines_for_total, 'B')
        total_ab = total_a_lines + total_b_lines

        # Utiliser le total calculé depuis les lignes si disponible, sinon fallback sur calculated_price
        base_price = total_ab if total_ab > 0 else float(quote_request.calculated_price or 0)

        # Remise sur partie A
        remise_a = float(quote_request.remise_partie_a or 0)
        remise_a_commentaire = quote_request.remise_partie_a_commentaire or ''
        remise_a_montant = total_a_lines * (remise_a / 100) if remise_a > 0 else 0
        total_a_apres_remise = total_a_lines - remise_a_montant

        # Prise en charge sur partie B
        taux_pec = float(quote_request.taux_prise_en_charge or 0)
        has_b_lines = total_b_lines > 0
        has_a_lines = total_a_lines > 0
        if has_b_lines and taux_pec > 0:
            prise_en_charge = total_b_lines * (taux_pec / 100)
            reste_a_charge_b = total_b_lines - prise_en_charge
            final_price = total_a_apres_remise + reste_a_charge_b
            discount = 0
            discount_amount = 0
        else:
            prise_en_charge = 0
            reste_a_charge_b = total_b_lines
            discount = 0
            discount_amount = 0
            final_price = total_a_apres_remise + total_b_lines if (total_a_lines + total_b_lines) > 0 else base_price

        pdf_primary = '#087A00'
        if site_settings:
            pdf_primary = (getattr(site_settings, 'devis_pdf_primary_color', None) or getattr(site_settings, 'primary_color', None) or '').strip() or '#087A00'

        # Grouper les lignes par catégorie pour simplifier le template
        all_lines = list(quote_request.lines.all().order_by('order'))
        lines_a = [l for l in all_lines if l.category == 'A']
        lines_b = [l for l in all_lines if l.category == 'B']

        context = {
            'quote_request': quote_request,
            'site_settings': site_settings,
            'today': date.today(),
            'logo_path': logo_path,
            'logo_secondary_path': logo_secondary_path,
            'logo_signature_path': logo_signature_path,
            'base_price': base_price,
            'total_a': total_a_lines,
            'total_b': total_b_lines,
            'remise_a': remise_a,
            'remise_a_montant': remise_a_montant,
            'remise_a_commentaire': remise_a_commentaire,
            'total_a_apres_remise': total_a_apres_remise,
            'has_a_lines': has_a_lines,
            'taux_pec': taux_pec,
            'has_b_lines': has_b_lines,
            'prise_en_charge': prise_en_charge,
            'reste_a_charge_b': reste_a_charge_b,
            'discount': discount,
            'discount_amount': discount_amount,
            'final_price': final_price,
            'pdf_primary_color': pdf_primary,
            'lines_a': lines_a,
            'lines_b': lines_b,
            'has_lines': bool(all_lines),
        }
        
        # Rendre le template HTML
        try:
            html_string = render_to_string('quote.html', context)
        except Exception as e:
            logger.error(f'Erreur lors du rendu du template: {e}')
            return Response({
                'error': f'Erreur lors du rendu du template: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Générer le PDF
        result = io.BytesIO()
        pdf_file = pisa.pisaDocument(
            io.BytesIO(html_string.encode("UTF-8")),
            result,
            encoding='UTF-8'
        )
        
        if pdf_file.err:
            logger.error(f'Erreur lors de la génération du PDF: {pdf_file.err}')
            return Response({
                'error': 'Erreur lors de la génération du PDF'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Retourner le PDF en réponse
        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="devis-{quote_request.id}.pdf"'
        return response
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def send_quote(self, request, pk=None):
        """Envoyer le devis par email au client avec PDF en pièce jointe"""
        logger = logging.getLogger(__name__)
        # Initialiser les variables SMTP avec des valeurs par défaut pour éviter NameError
        smtp_host = None
        smtp_port = 587
        smtp_username = None
        smtp_password = None
        smtp_use_tls = True
        smtp_use_ssl = False
        
        try:
            from django.core.mail import EmailMessage, get_connection
            from django.template.loader import render_to_string
            from xhtml2pdf import pisa
            from datetime import date
            from decimal import Decimal
            import io
            
            quote_request = self.get_object()
            
            # Récupérer les paramètres SMTP depuis SiteSettings
            try:
                site_settings = SiteSettings.get_settings()
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de la récupération des paramètres: {e}\n{error_details}')
                return Response({
                    'success': False,
                    'message': 'Paramètres du site non configurés. Veuillez configurer les paramètres SMTP dans /admin/parametres'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier que les paramètres SMTP sont configurés (avec gestion des champs qui pourraient ne pas exister)
            try:
                smtp_host = getattr(site_settings, 'smtp_host', None)
                smtp_username = getattr(site_settings, 'smtp_username', None)
                smtp_password = getattr(site_settings, 'smtp_password', None)
                logger.info(f'Paramètres SMTP récupérés depuis la base de données:')
                logger.info(f'  - Host: {smtp_host}')
                logger.info(f'  - Username: {smtp_username}')
                logger.info(f'  - Password: {"***" + smtp_password[-4:] if smtp_password and len(smtp_password) > 4 else "None"}')
                logger.info(f'  - Password length: {len(smtp_password) if smtp_password else 0}')
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de l\'accès aux champs SMTP: {e}\n{error_details}')
                smtp_host = None
                smtp_username = None
                smtp_password = None
            
            if not smtp_host or not smtp_username or not smtp_password:
                missing = []
                if not smtp_host:
                    missing.append('serveur SMTP')
                if not smtp_username:
                    missing.append('email expéditeur')
                if not smtp_password:
                    missing.append('mot de passe')
                error_msg = f'Configuration SMTP incomplète. Paramètres manquants: {", ".join(missing)}. Veuillez configurer les paramètres SMTP dans /admin/parametres'
                logger.error(error_msg)
                return Response({
                    'success': False,
                    'message': error_msg
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Préparer le contexte pour le template
            logo_path = None
            if site_settings and site_settings.logo:
                import os
                import base64
                try:
                    logo_path = site_settings.logo.path
                    if os.path.exists(logo_path):
                        # Convertir l'image en base64 pour l'inclure dans le PDF
                        with open(logo_path, 'rb') as logo_file:
                            logo_data = base64.b64encode(logo_file.read()).decode('utf-8')
                            logo_extension = os.path.splitext(logo_path)[1].lower()
                            if logo_extension == '.png':
                                logo_path = f'data:image/png;base64,{logo_data}'
                            elif logo_extension in ['.jpg', '.jpeg']:
                                logo_path = f'data:image/jpeg;base64,{logo_data}'
                            else:
                                logo_path = f'data:image/png;base64,{logo_data}'
                    else:
                        logo_path = None
                except Exception as e:
                    logger.error(f'Erreur lors du chargement du logo: {e}')
                    logo_path = None
            
            # Logo secondaire
            logo_secondary_path = None
            if site_settings:
                try:
                    if hasattr(site_settings, 'logo_secondary') and site_settings.logo_secondary:
                        sec_path = site_settings.logo_secondary.path
                        if os.path.exists(sec_path):
                            with open(sec_path, 'rb') as f:
                                sec_data = base64.b64encode(f.read()).decode('utf-8')
                                sec_ext = os.path.splitext(sec_path)[1].lower()
                                mime = 'image/png' if sec_ext == '.png' else 'image/jpeg'
                                logo_secondary_path = f'data:{mime};base64,{sec_data}'
                except Exception as e:
                    logger.error(f'Erreur logo secondaire: {e}')

            # Logo signature (fin de devis)
            logo_signature_path = None
            if site_settings:
                try:
                    if hasattr(site_settings, 'logo_signature') and site_settings.logo_signature:
                        sig_path = site_settings.logo_signature.path
                        if os.path.exists(sig_path):
                            with open(sig_path, 'rb') as f:
                                sig_data = base64.b64encode(f.read()).decode('utf-8')
                                sig_ext = os.path.splitext(sig_path)[1].lower()
                                mime = 'image/png' if sig_ext == '.png' else 'image/jpeg'
                                logo_signature_path = f'data:{mime};base64,{sig_data}'
                except Exception as e:
                    logger.error(f'Erreur logo signature: {e}')

            # Calculer le prix final avec réduction depuis les lignes A+B
            all_lines_calc = list(quote_request.lines.all())
            def get_total_cat(lines, category):
                cat_lines = [l for l in lines if l.category == category]
                bold_lines = [l for l in cat_lines if l.is_bold and l.total]
                if bold_lines:
                    try: return float(bold_lines[-1].total)
                    except: pass
                t = 0.0
                for l in cat_lines:
                    if not l.is_bold and l.total:
                        try: t += float(l.total)
                        except: pass
                return t
            total_a_lines = get_total_cat(all_lines_calc, 'A')
            total_b_lines = get_total_cat(all_lines_calc, 'B')
            total_ab = total_a_lines + total_b_lines
            base_price = total_ab if total_ab > 0 else float(quote_request.calculated_price or 0)
            remise_a = float(quote_request.remise_partie_a or 0)
            remise_a_commentaire = quote_request.remise_partie_a_commentaire or ''
            remise_a_montant = total_a_lines * (remise_a / 100) if remise_a > 0 else 0
            total_a_apres_remise = total_a_lines - remise_a_montant
            has_a_lines = total_a_lines > 0
            taux_pec = float(quote_request.taux_prise_en_charge or 0)
            has_b_lines = total_b_lines > 0
            if has_b_lines and taux_pec > 0:
                prise_en_charge = total_b_lines * (taux_pec / 100)
                reste_a_charge_b = total_b_lines - prise_en_charge
                final_price = total_a_apres_remise + reste_a_charge_b
                discount = 0
                discount_amount = 0
            else:
                prise_en_charge = 0
                reste_a_charge_b = total_b_lines
                discount = 0
                discount_amount = 0
                final_price = total_a_apres_remise + total_b_lines if (total_a_lines + total_b_lines) > 0 else base_price

            pdf_primary = (getattr(site_settings, 'devis_pdf_primary_color', None) or getattr(site_settings, 'primary_color', None) or '').strip() if site_settings else ''
            pdf_primary = pdf_primary or '#087A00'

            # URL publique du logo pour l'email (base64 bloqué par Gmail)
            logo_url_email = None
            if site_settings and site_settings.logo:
                try:
                    logo_url_email = build_url(site_settings.logo.url, request)
                except Exception:
                    logo_url_email = None

            # Grouper les lignes par catégorie
            all_lines = list(quote_request.lines.all().order_by('order'))
            lines_a = [l for l in all_lines if l.category == 'A']
            lines_b = [l for l in all_lines if l.category == 'B']

            context = {
                'quote_request': quote_request,
                'site_settings': site_settings,
                'today': date.today(),
                'logo_path': logo_path,
                'logo_url_email': logo_url_email,
                'logo_secondary_path': logo_secondary_path,
                'logo_signature_path': logo_signature_path,
                'lines_a': lines_a,
                'lines_b': lines_b,
                'has_lines': len(all_lines) > 0,
                'base_price': base_price,
                'total_a': total_a_lines,
                'total_b': total_b_lines,
                'remise_a': remise_a,
                'remise_a_montant': remise_a_montant,
                'remise_a_commentaire': remise_a_commentaire,
                'total_a_apres_remise': total_a_apres_remise,
                'has_a_lines': has_a_lines,
                'taux_pec': taux_pec,
                'has_b_lines': has_b_lines,
                'prise_en_charge': prise_en_charge,
                'reste_a_charge_b': reste_a_charge_b,
                'discount': discount,
                'discount_amount': discount_amount,
                'final_price': final_price,
                'pdf_primary_color': pdf_primary,
            }

            # Générer le PDF du devis
            result = None
            try:
                logger.info('Génération du PDF du devis...')
                html_string = render_to_string('quote.html', context)
                result = io.BytesIO()
                pdf_file = pisa.pisaDocument(
                    io.BytesIO(html_string.encode("UTF-8")),
                    result,
                    encoding='UTF-8'
                )
                
                if pdf_file.err:
                    logger.error(f'Erreur lors de la génération du PDF: {pdf_file.err}')
                    return Response({
                        'success': False,
                        'message': f'Erreur lors de la génération du PDF du devis: {pdf_file.err}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                logger.info('PDF généré avec succès')
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de la génération du PDF: {str(e)}\n{error_details}')
                return Response({
                    'success': False,
                    'message': f'Erreur lors de la génération du PDF: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Vérifier que le PDF a bien été généré
            if result is None or result.getvalue() is None or len(result.getvalue()) == 0:
                logger.error('Le PDF généré est vide')
                return Response({
                    'success': False,
                    'message': 'Erreur: Le PDF généré est vide'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Créer le message email
            try:
                site_name = getattr(site_settings, 'site_name', None) if site_settings else None
                subject = f'Devis {str(quote_request.id).zfill(4)} - {site_name or "Services Locaux"}'
            except Exception as e:
                logger.error(f'Erreur lors de la création du sujet: {e}')
                subject = f'Devis {str(quote_request.id).zfill(4)}'
            
            # Corps de l'email en HTML
            try:
                email_body = render_to_string('quote_email.html', context)
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors du rendu du template email: {e}\n{error_details}')
                logger.error(f'Détails: {error_details}')
                return Response({
                    'success': False,
                    'message': f'Erreur lors de la préparation de l\'email: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Récupérer les paramètres SMTP avec gestion des valeurs par défaut
            try:
                smtp_port = getattr(site_settings, 'smtp_port', 587)
                smtp_use_tls = getattr(site_settings, 'smtp_use_tls', True)
                smtp_use_ssl = getattr(site_settings, 'smtp_use_ssl', False)
                logger.info(f'Paramètres SMTP supplémentaires: Port={smtp_port}, TLS={smtp_use_tls}, SSL={smtp_use_ssl}')
            except Exception as e:
                logger.error(f'Erreur lors de la récupération des paramètres SMTP supplémentaires: {e}')
                smtp_port = 587
                smtp_use_tls = True
                smtp_use_ssl = False
            
            # Configurer la connexion SMTP avec les paramètres de SiteSettings
            # Utiliser smtplib directement pour avoir un meilleur contrôle sur le timeout
            try:
                # Créer une connexion SMTP avec timeout plus long (60 secondes)
                timeout = 60
                logger.info(f'Tentative de connexion SMTP à {smtp_host}:{smtp_port} avec timeout de {timeout}s')
                logger.info(f'Configuration: TLS={smtp_use_tls}, SSL={smtp_use_ssl}, Username={smtp_username}')
                
                smtp_server = None
                # Essayer d'abord avec TLS (port 587) si configuré
                if not smtp_use_ssl and smtp_use_tls:
                    # Pour TLS (port 587) - méthode recommandée pour Gmail
                    logger.info(f'Connexion TCP sur le port {smtp_port} avec TLS...')
                    try:
                        smtp_server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                        logger.info('Connexion TCP établie')
                        logger.info('Activation TLS...')
                        smtp_server.starttls()
                        logger.info('TLS activé avec succès')
                    except Exception as e:
                        logger.error(f'Erreur lors de la connexion TLS: {e}')
                        if smtp_server:
                            try:
                                smtp_server.quit()
                            except:
                                pass
                        raise
                elif smtp_use_ssl:
                    # Pour SSL (port 465)
                    logger.info(f'Connexion SSL sur le port {smtp_port}...')
                    try:
                        smtp_server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=timeout)
                        logger.info('Connexion SSL établie')
                    except Exception as e:
                        logger.error(f'Erreur lors de la connexion SSL: {e}')
                        raise
                else:
                    # Connexion sans chiffrement (non recommandé)
                    logger.warning('Connexion SMTP sans chiffrement (non recommandé)')
                    smtp_server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                
                # Authentification
                logger.info(f'Authentification avec {smtp_username}...')
                try:
                    smtp_server.login(smtp_username, smtp_password)
                    logger.info('Authentification réussie')
                except Exception as e:
                    logger.error(f'Erreur lors de l\'authentification: {e}')
                    if smtp_server:
                        try:
                            smtp_server.quit()
                        except:
                            pass
                    raise
                
                # Créer le message email avec pièce jointe
                msg = MIMEMultipart('mixed')
                msg['Subject'] = subject
                msg['From'] = smtp_username
                msg['To'] = quote_request.client_email

                # Partie related pour HTML + images inline CID
                msg_related = MIMEMultipart('related')
                msg.attach(msg_related)

                # Remplacer base64 par CID dans l'email body pour le logo
                email_body_cid = email_body
                logo_cid_data = None
                logo_cid_mime = None
                if site_settings and site_settings.logo:
                    try:
                        import os
                        logo_file_path = site_settings.logo.path
                        if os.path.exists(logo_file_path):
                            ext = os.path.splitext(logo_file_path)[1].lower()
                            mime_type = 'image/png' if ext == '.png' else 'image/jpeg'
                            with open(logo_file_path, 'rb') as lf:
                                logo_cid_data = lf.read()
                                logo_cid_mime = mime_type
                            # Remplacer la src base64 par cid:logo_main
                            import re
                            email_body_cid = re.sub(
                                r'src="data:image/[^;]+;base64,[^"]*"(\s+alt="[^"]*")',
                                r'src="cid:logo_main"\1',
                                email_body_cid,
                                count=1
                            )
                    except Exception as e:
                        logger.error(f'Erreur CID logo: {e}')

                # Ajouter le corps HTML
                msg_related.attach(MIMEText(email_body_cid, 'html', 'utf-8'))

                # Attacher le logo comme image inline CID
                if logo_cid_data and logo_cid_mime:
                    logo_img = MIMEBase('image', logo_cid_mime.split('/')[1])
                    logo_img.set_payload(logo_cid_data)
                    encoders.encode_base64(logo_img)
                    logo_img.add_header('Content-ID', '<logo_main>')
                    logo_img.add_header('Content-Disposition', 'inline', filename='logo.png')
                    msg_related.attach(logo_img)

                # Ajouter le PDF en pièce jointe
                pdf_attachment = MIMEBase('application', 'pdf')
                pdf_attachment.set_payload(result.getvalue())
                encoders.encode_base64(pdf_attachment)
                pdf_attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename=devis-{quote_request.id}.pdf'
                )
                msg.attach(pdf_attachment)
                
                # Envoyer l'email
                logger.info(f'Envoi de l\'email à {quote_request.client_email}')
                smtp_server.send_message(msg)
                smtp_server.quit()
                logger.info('Email envoyé avec succès')
                
                # Mettre à jour le statut du devis
                from django.utils import timezone
                quote_request.status = 'QUOTED'
                if not quote_request.quoted_at:
                    quote_request.quoted_at = timezone.now()
                quote_request.save()
                
                return Response({
                    'success': True,
                    'message': f'Devis envoyé avec succès à {quote_request.client_email}',
                    'status_updated': True
                })
                
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f'Erreur d\'authentification SMTP: {e}')
                error_message = "Échec d'authentification SMTP. Vérifiez votre email et mot de passe d'application dans /admin/parametres. Pour Gmail, utilisez un mot de passe d'application."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, ConnectionError, OSError, TimeoutError) as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur de connexion SMTP: {e}\n{error_details}')
                error_message = str(e)
                # Utiliser les variables SMTP avec des valeurs par défaut si elles ne sont pas définies
                host_str = smtp_host if smtp_host else "non configuré"
                port_str = str(smtp_port) if smtp_port else "non configuré"
                if "10060" in error_message or "timeout" in error_message.lower() or "timed out" in error_message.lower() or "timed out" in error_details.lower() or isinstance(e, TimeoutError) or "SMTPServerDisconnected" in str(type(e).__name__) or "Connection unexpectedly closed" in error_message:
                    error_message = f"Timeout de connexion au serveur SMTP ({host_str}:{port_str}). Le serveur n'a pas répondu dans les délais. Causes possibles: firewall bloquant, réseau lent, ou serveur SMTP surchargé. Vérifiez votre connexion internet et réessayez."
                elif "Connection unexpectedly closed" in error_message or "SMTPServerDisconnected" in str(type(e).__name__):
                    error_message = f"La connexion au serveur SMTP ({host_str}:{port_str}) a été fermée de manière inattendue. Cela peut être dû à un timeout, un problème réseau, ou le serveur a fermé la connexion. Vérifiez votre connexion internet et réessayez."
                elif "Connection refused" in error_message or "refused" in error_message.lower() or "111" in error_message:
                    error_message = f"Connexion refusée par le serveur SMTP ({host_str}:{port_str}). Vérifiez l'adresse du serveur et le port dans /admin/parametres."
                elif "Name or service not known" in error_message or "getaddrinfo failed" in error_message.lower():
                    error_message = f"Impossible de résoudre le nom du serveur SMTP ({host_str}). Vérifiez que l'adresse est correcte dans /admin/parametres."
                else:
                    error_message = f"Impossible de se connecter au serveur SMTP ({host_str}:{port_str}). Erreur: {str(e)}. Vérifiez la configuration dans /admin/parametres."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except smtplib.SMTPException as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur SMTP: {e}\n{error_details}')
                error_message = f"Erreur SMTP: {str(e)}. Vérifiez la configuration dans /admin/parametres."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                error_details = traceback.format_exc()
                error_message = str(e)
                logger.error(f'Erreur inattendue lors de l\'envoi de l\'email: {error_message}\n{error_details}')
                
                # Messages d'erreur plus explicites
                if "Authentication failed" in error_message or "535" in error_message or "authentication" in error_message.lower():
                    error_message = "Échec d'authentification SMTP. Vérifiez votre email et mot de passe d'application dans /admin/parametres. Pour Gmail, utilisez un mot de passe d'application."
                elif "Connection refused" in error_message or "Connection timed out" in error_message or "timeout" in error_message.lower():
                    error_message = "Impossible de se connecter au serveur SMTP. Vérifiez l'adresse et le port dans /admin/parametres"
                elif "TLS/SSL" in error_message or "STARTTLS" in error_message or "ssl" in error_message.lower():
                    error_message = "Erreur de configuration TLS/SSL. Assurez-vous que TLS est activé pour le port 587 dans /admin/parametres"
                elif "smtp_host" in error_message.lower() or "smtp_username" in error_message.lower() or "smtp_password" in error_message.lower():
                    error_message = "Configuration SMTP incomplète. Veuillez configurer tous les paramètres SMTP dans /admin/parametres"
                
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            # Catch-all pour toutes les exceptions non gérées au niveau supérieur
            error_details = traceback.format_exc()
            logger.error(f'Erreur critique dans send_quote: {str(e)}\n{error_details}')
            return Response({
                'success': False,
                'message': f'Erreur inattendue lors de l\'envoi de l\'email: {str(e)}. Veuillez vérifier les logs du serveur pour plus de détails.',
                'status_updated': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InvoiceViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Invoice"""
    module_name = 'factures'
    queryset = Invoice.objects.filter(deleted_at__isnull=True)
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'quote_request__client_name', 'quote_request__client_email']
    filterset_fields = ['quote_request', 'currency']
    ordering_fields = ['invoice_date', 'created_at']
    ordering = ['-invoice_date', '-created_at']
    
    def create(self, request, *args, **kwargs):
        """Créer une facture avec vérification de l'unicité"""
        # Vérifier si une facture existe déjà pour ce devis
        quote_request_id = request.data.get('quote_request')
        if quote_request_id:
            try:
                existing_invoice = Invoice.objects.get(quote_request_id=quote_request_id)
                return Response({
                    'detail': f'Une facture existe déjà pour ce devis (Facture {existing_invoice.invoice_number})',
                    'invoice_id': existing_invoice.id,
                    'invoice_number': existing_invoice.invoice_number
                }, status=status.HTTP_400_BAD_REQUEST)
            except Invoice.DoesNotExist:
                pass  # Pas de facture existante, on continue
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Auto-calculer due_date depuis payment_terms si non fournie"""
        from datetime import date, timedelta
        due_date = serializer.validated_data.get('due_date')
        payment_terms = serializer.validated_data.get('payment_terms')
        invoice_date = serializer.validated_data.get('invoice_date', date.today())
        if not due_date and payment_terms:
            try:
                days = int(str(payment_terms).strip())
                due_date = invoice_date + timedelta(days=days)
            except (ValueError, TypeError):
                pass
        serializer.save(due_date=due_date)

    def perform_update(self, serializer):
        """Auto-calculer due_date depuis payment_terms si non fournie"""
        from datetime import date, timedelta
        due_date = serializer.validated_data.get('due_date', serializer.instance.due_date)
        payment_terms = serializer.validated_data.get('payment_terms', serializer.instance.payment_terms)
        invoice_date = serializer.validated_data.get('invoice_date', serializer.instance.invoice_date)
        if not due_date and payment_terms:
            try:
                days = int(str(payment_terms).strip())
                due_date = invoice_date + timedelta(days=days)
            except (ValueError, TypeError):
                pass
        serializer.save(due_date=due_date)

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrReadOnly])
    def pdf(self, request, pk=None):
        """Générer le PDF de la facture"""
        import logging
        import traceback
        from django.http import Http404
        from rest_framework.exceptions import APIException
        logger = logging.getLogger(__name__)

        try:
            from django.http import HttpResponse
            from django.template.loader import render_to_string
            from django.conf import settings
            from xhtml2pdf import pisa
            from datetime import date
            import io

            invoice = self.get_object()
            
            # Récupérer les paramètres du site (logo, etc.)
            try:
                site_settings = SiteSettings.get_settings()
            except Exception as e:
                logger.warning(f'Erreur lors de la récupération des paramètres du site: {e}')
                site_settings = None
            
            # Préparer le contexte pour le template
            logo_path = None
            if site_settings:
                try:
                    if hasattr(site_settings, 'logo') and site_settings.logo:
                        import os
                        import base64
                        logo_path = site_settings.logo.path
                        if os.path.exists(logo_path):
                            # Convertir l'image en base64 pour l'inclure dans le PDF
                            with open(logo_path, 'rb') as logo_file:
                                logo_data = base64.b64encode(logo_file.read()).decode('utf-8')
                                logo_extension = os.path.splitext(logo_path)[1].lower()
                                if logo_extension == '.png':
                                    logo_path = f'data:image/png;base64,{logo_data}'
                                elif logo_extension in ['.jpg', '.jpeg']:
                                    logo_path = f'data:image/jpeg;base64,{logo_data}'
                                else:
                                    logo_path = f'data:image/png;base64,{logo_data}'
                        else:
                            logo_path = None
                except Exception as e:
                    logger.error(f'Erreur lors du chargement du logo: {e}')
                    logo_path = None

            pdf_primary = (getattr(site_settings, 'devis_pdf_primary_color', None) or getattr(site_settings, 'primary_color', None) or '').strip() if site_settings else ''
            pdf_primary = pdf_primary or '#087A00'

            # Signature
            signature_path = None
            if site_settings and getattr(site_settings, 'logo_signature', None):
                try:
                    import os, base64
                    sig_path = site_settings.logo_signature.path
                    if os.path.exists(sig_path):
                        with open(sig_path, 'rb') as f:
                            sig_data = base64.b64encode(f.read()).decode('utf-8')
                            ext = os.path.splitext(sig_path)[1].lower()
                            mime = 'image/png' if ext == '.png' else 'image/jpeg'
                            signature_path = f'data:{mime};base64,{sig_data}'
                except Exception as e:
                    logger.error(f'Erreur signature: {e}')

            context = {
                'invoice': invoice,
                'quote_request': invoice.quote_request,
                'client_name': invoice.get_client_name(),
                'client_email': invoice.get_client_email(),
                'site_settings': site_settings,
                'today': date.today(),
                'logo_path': logo_path,
                'pdf_primary_color': pdf_primary,
                'signature_path': signature_path,
            }

            # Rendre le template HTML
            try:
                html_string = render_to_string('invoice.html', context)
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors du rendu du template: {e}\n{error_details}')
                return Response({
                    'error': f'Erreur lors du rendu du template: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Générer le PDF
            result = io.BytesIO()
            try:
                pdf_file = pisa.CreatePDF(html_string, dest=result)

                if pdf_file.err:
                    logger.error(f'Erreur lors de la génération du PDF: {pdf_file.err}')
                    return Response({
                        'error': f'Erreur lors de la génération du PDF: {pdf_file.err}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de la génération du PDF: {e}\n{error_details}')
                return Response({
                    'error': f'Erreur lors de la génération du PDF: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Vérifier que le PDF n'est pas vide
            if result.getvalue() is None or len(result.getvalue()) == 0:
                logger.error('Le PDF généré est vide')
                return Response({
                    'error': 'Le PDF généré est vide'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Retourner le PDF en réponse
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="facture-{invoice.invoice_number}.pdf"'
            return response
            
        except (Http404, APIException):
            raise
        except Exception as e:
            error_details = traceback.format_exc()
            logger.error(f'Erreur critique dans pdf: {str(e)}\n{error_details}')
            return Response({
                'error': f'Erreur inattendue lors de la génération du PDF: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def send_email(self, request, pk=None):
        """Envoyer la facture par email au client avec PDF en pièce jointe"""
        from django.http import Http404
        from rest_framework.exceptions import APIException
        logger = logging.getLogger(__name__)
        # Initialiser les variables SMTP avec des valeurs par défaut
        smtp_host = None
        smtp_port = 587
        smtp_username = None
        smtp_password = None
        smtp_use_tls = True
        smtp_use_ssl = False
        
        try:
            from django.template.loader import render_to_string
            from xhtml2pdf import pisa
            from datetime import date
            import io
            
            invoice = self.get_object()
            
            # Récupérer les paramètres SMTP depuis SiteSettings
            try:
                site_settings = SiteSettings.get_settings()
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de la récupération des paramètres: {e}\n{error_details}')
                return Response({
                    'success': False,
                    'message': 'Paramètres du site non configurés. Veuillez configurer les paramètres SMTP dans /admin/parametres'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier que les paramètres SMTP sont configurés
            try:
                smtp_host = getattr(site_settings, 'smtp_host', None)
                smtp_username = getattr(site_settings, 'smtp_username', None)
                smtp_password = getattr(site_settings, 'smtp_password', None)
                logger.info(f'Paramètres SMTP récupérés depuis la base de données:')
                logger.info(f'  - Host: {smtp_host}')
                logger.info(f'  - Username: {smtp_username}')
                logger.info(f'  - Password: {"***" + smtp_password[-4:] if smtp_password and len(smtp_password) > 4 else "None"}')
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de l\'accès aux champs SMTP: {e}\n{error_details}')
                smtp_host = None
                smtp_username = None
                smtp_password = None
            
            if not smtp_host or not smtp_username or not smtp_password:
                missing = []
                if not smtp_host:
                    missing.append('serveur SMTP')
                if not smtp_username:
                    missing.append('email expéditeur')
                if not smtp_password:
                    missing.append('mot de passe')
                error_msg = f'Configuration SMTP incomplète. Paramètres manquants: {", ".join(missing)}. Veuillez configurer les paramètres SMTP dans /admin/parametres'
                logger.error(error_msg)
                return Response({
                    'success': False,
                    'message': error_msg
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Préparer le contexte pour le template
            logo_path = None
            if site_settings and site_settings.logo:
                import os
                import base64
                try:
                    logo_path = site_settings.logo.path
                    if os.path.exists(logo_path):
                        with open(logo_path, 'rb') as logo_file:
                            logo_data = base64.b64encode(logo_file.read()).decode('utf-8')
                            logo_extension = os.path.splitext(logo_path)[1].lower()
                            if logo_extension == '.png':
                                logo_path = f'data:image/png;base64,{logo_data}'
                            elif logo_extension in ['.jpg', '.jpeg']:
                                logo_path = f'data:image/jpeg;base64,{logo_data}'
                            else:
                                logo_path = f'data:image/png;base64,{logo_data}'
                    else:
                        logo_path = None
                except Exception as e:
                    logger.error(f'Erreur lors du chargement du logo: {e}')
                    logo_path = None

            pdf_primary = (getattr(site_settings, 'devis_pdf_primary_color', None) or getattr(site_settings, 'primary_color', None) or '').strip() if site_settings else ''
            pdf_primary = pdf_primary or '#087A00'

            # Signature
            signature_path = None
            if site_settings and getattr(site_settings, 'logo_signature', None):
                try:
                    import os, base64
                    sig_path = site_settings.logo_signature.path
                    if os.path.exists(sig_path):
                        with open(sig_path, 'rb') as f:
                            sig_data = base64.b64encode(f.read()).decode('utf-8')
                            ext = os.path.splitext(sig_path)[1].lower()
                            mime = 'image/png' if ext == '.png' else 'image/jpeg'
                            signature_path = f'data:{mime};base64,{sig_data}'
                except Exception as e:
                    logger.error(f'Erreur signature: {e}')

            context = {
                'invoice': invoice,
                'quote_request': invoice.quote_request,
                'site_settings': site_settings,
                'today': date.today(),
                'logo_path': logo_path,
                'pdf_primary_color': pdf_primary,
                'signature_path': signature_path,
            }

            # Générer le PDF de la facture
            result = None
            try:
                logger.info('Generation du PDF de la facture...')
                html_string = render_to_string('invoice.html', context)
                result = io.BytesIO()
                pdf_file = pisa.CreatePDF(html_string, dest=result)

                if pdf_file.err:
                    logger.error(f'Erreur lors de la generation du PDF: {pdf_file.err}')
                    return Response({
                        'success': False,
                        'message': f'Erreur lors de la generation du PDF de la facture: {pdf_file.err}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                logger.info('PDF généré avec succès')
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors de la génération du PDF: {str(e)}\n{error_details}')
                return Response({
                    'success': False,
                    'message': f'Erreur lors de la génération du PDF: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Vérifier que le PDF a bien été généré
            if result is None or result.getvalue() is None or len(result.getvalue()) == 0:
                logger.error('Le PDF généré est vide')
                return Response({
                    'success': False,
                    'message': 'Erreur: Le PDF généré est vide'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Créer le message email
            try:
                site_name = getattr(site_settings, 'site_name', None) if site_settings else None
                subject = f'Facture {invoice.invoice_number} - {site_name or "Services Locaux"}'
            except Exception as e:
                logger.error(f'Erreur lors de la création du sujet: {e}')
                subject = f'Facture {invoice.invoice_number}'
            
            # Corps de l'email en HTML
            try:
                email_body = render_to_string('invoice_email.html', context)
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur lors du rendu du template email: {e}\n{error_details}')
                return Response({
                    'success': False,
                    'message': f'Erreur lors de la préparation de l\'email: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Récupérer les paramètres SMTP avec gestion des valeurs par défaut
            try:
                smtp_port = getattr(site_settings, 'smtp_port', 587)
                smtp_use_tls = getattr(site_settings, 'smtp_use_tls', True)
                smtp_use_ssl = getattr(site_settings, 'smtp_use_ssl', False)
                logger.info(f'Paramètres SMTP supplémentaires: Port={smtp_port}, TLS={smtp_use_tls}, SSL={smtp_use_ssl}')
            except Exception as e:
                logger.error(f'Erreur lors de la récupération des paramètres SMTP supplémentaires: {e}')
                smtp_port = 587
                smtp_use_tls = True
                smtp_use_ssl = False
            
            # Configurer la connexion SMTP avec les paramètres de SiteSettings
            try:
                timeout = 60
                logger.info(f'Tentative de connexion SMTP à {smtp_host}:{smtp_port} avec timeout de {timeout}s')
                logger.info(f'Configuration: TLS={smtp_use_tls}, SSL={smtp_use_ssl}, Username={smtp_username}')
                
                smtp_server = None
                if not smtp_use_ssl and smtp_use_tls:
                    logger.info(f'Connexion TCP sur le port {smtp_port} avec TLS...')
                    try:
                        smtp_server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                        logger.info('Connexion TCP établie')
                        logger.info('Activation TLS...')
                        smtp_server.starttls()
                        logger.info('TLS activé avec succès')
                    except Exception as e:
                        logger.error(f'Erreur lors de la connexion TLS: {e}')
                        if smtp_server:
                            try:
                                smtp_server.quit()
                            except:
                                pass
                        raise
                elif smtp_use_ssl:
                    logger.info(f'Connexion SSL sur le port {smtp_port}...')
                    try:
                        smtp_server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=timeout)
                        logger.info('Connexion SSL établie')
                    except Exception as e:
                        logger.error(f'Erreur lors de la connexion SSL: {e}')
                        raise
                else:
                    logger.warning('Connexion SMTP sans chiffrement (non recommandé)')
                    smtp_server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                
                # Authentification
                logger.info(f'Authentification avec {smtp_username}...')
                try:
                    smtp_server.login(smtp_username, smtp_password)
                    logger.info('Authentification réussie')
                except Exception as e:
                    logger.error(f'Erreur lors de l\'authentification: {e}')
                    if smtp_server:
                        try:
                            smtp_server.quit()
                        except:
                            pass
                    raise
                
                # Créer le message email avec pièce jointe
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = smtp_username
                msg['To'] = invoice.quote_request.client_email
                
                # Ajouter le corps HTML
                msg.attach(MIMEText(email_body, 'html', 'utf-8'))
                
                # Ajouter le PDF en pièce jointe
                pdf_attachment = MIMEBase('application', 'pdf')
                pdf_attachment.set_payload(result.getvalue())
                encoders.encode_base64(pdf_attachment)
                pdf_attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename=facture-{invoice.invoice_number}.pdf'
                )
                msg.attach(pdf_attachment)
                
                # Envoyer l'email
                logger.info(f'Envoi de l\'email à {invoice.quote_request.client_email}')
                smtp_server.send_message(msg)
                smtp_server.quit()
                logger.info('Email envoyé avec succès')
                
                # Mettre à jour le statut du devis
                from django.utils import timezone
                quote_request = invoice.quote_request
                if quote_request.status != 'QUOTED':
                    quote_request.status = 'QUOTED'
                    if not quote_request.quoted_at:
                        quote_request.quoted_at = timezone.now()
                    quote_request.save()
                
                return Response({
                    'success': True,
                    'message': f'Facture envoyée avec succès à {invoice.quote_request.client_email}',
                    'status_updated': True
                })
                
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f'Erreur d\'authentification SMTP: {e}')
                error_message = "Échec d'authentification SMTP. Vérifiez votre email et mot de passe d'application dans /admin/parametres. Pour Gmail, utilisez un mot de passe d'application."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, ConnectionError, OSError, TimeoutError) as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur de connexion SMTP: {e}\n{error_details}')
                error_message = str(e)
                host_str = smtp_host if smtp_host else "non configuré"
                port_str = str(smtp_port) if smtp_port else "non configuré"
                if "10060" in error_message or "timeout" in error_message.lower() or "timed out" in error_message.lower() or "timed out" in error_details.lower() or isinstance(e, TimeoutError) or "SMTPServerDisconnected" in str(type(e).__name__):
                    error_message = f"Timeout de connexion au serveur SMTP ({host_str}:{port_str}). Le serveur n'a pas répondu dans les délais. Causes possibles: firewall bloquant, réseau lent, ou serveur SMTP surchargé. Vérifiez votre connexion internet et réessayez."
                elif "Connection refused" in error_message or "refused" in error_message.lower() or "111" in error_message:
                    error_message = f"Connexion refusée par le serveur SMTP ({host_str}:{port_str}). Vérifiez l'adresse du serveur et le port dans /admin/parametres."
                elif "Name or service not known" in error_message or "getaddrinfo failed" in error_message.lower():
                    error_message = f"Impossible de résoudre le nom du serveur SMTP ({host_str}). Vérifiez que l'adresse est correcte dans /admin/parametres."
                elif "Connection unexpectedly closed" in error_message or "SMTPServerDisconnected" in str(type(e).__name__):
                    error_message = f"La connexion au serveur SMTP ({host_str}:{port_str}) a été fermée de manière inattendue. Cela peut être dû à un timeout, un problème réseau, ou le serveur a fermé la connexion. Vérifiez votre connexion internet et réessayez."
                else:
                    error_message = f"Impossible de se connecter au serveur SMTP ({host_str}:{port_str}). Erreur: {str(e)}. Vérifiez la configuration dans /admin/parametres."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except smtplib.SMTPException as e:
                error_details = traceback.format_exc()
                logger.error(f'Erreur SMTP: {e}\n{error_details}')
                error_message = f"Erreur SMTP: {str(e)}. Vérifiez la configuration dans /admin/parametres."
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                error_details = traceback.format_exc()
                error_message = str(e)
                logger.error(f'Erreur inattendue lors de l\'envoi de l\'email: {error_message}\n{error_details}')
                
                if "Authentication failed" in error_message or "535" in error_message or "authentication" in error_message.lower():
                    error_message = "Échec d'authentification SMTP. Vérifiez votre email et mot de passe d'application dans /admin/parametres. Pour Gmail, utilisez un mot de passe d'application."
                elif "Connection refused" in error_message or "Connection timed out" in error_message or "timeout" in error_message.lower():
                    error_message = "Impossible de se connecter au serveur SMTP. Vérifiez l'adresse et le port dans /admin/parametres"
                elif "TLS/SSL" in error_message or "STARTTLS" in error_message or "ssl" in error_message.lower():
                    error_message = "Erreur de configuration TLS/SSL. Assurez-vous que TLS est activé pour le port 587 dans /admin/parametres"
                elif "smtp_host" in error_message.lower() or "smtp_username" in error_message.lower() or "smtp_password" in error_message.lower():
                    error_message = "Configuration SMTP incomplète. Veuillez configurer tous les paramètres SMTP dans /admin/parametres"
                
                return Response({
                    'success': False,
                    'message': f'Erreur lors de l\'envoi de l\'email: {error_message}',
                    'status_updated': False,
                    'error': error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except (Http404, APIException):
            raise
        except Exception as e:
            # Catch-all pour toutes les exceptions non gérées au niveau supérieur
            error_details = traceback.format_exc()
            logger.error(f'Erreur critique dans send_email: {str(e)}\n{error_details}')
            return Response({
                'success': False,
                'message': f'Erreur inattendue lors de l\'envoi de l\'email: {str(e)}. Veuillez vérifier les logs du serveur pour plus de détails.',
                'status_updated': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuoteFormStepViewSet(viewsets.ModelViewSet):
    """ViewSet pour QuoteFormStep"""
    queryset = QuoteFormStep.objects.prefetch_related('options').all()
    serializer_class = QuoteFormStepSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service', 'step_type', 'active']
    ordering_fields = ['order', 'created_at']
    ordering = ['service', 'order']
    
    def get_queryset(self):
        queryset = QuoteFormStep.objects.prefetch_related('options').all()
        return queryset


class QuoteFormOptionViewSet(viewsets.ModelViewSet):
    """ViewSet pour QuoteFormOption avec support hiérarchique"""
    queryset = QuoteFormOption.objects.prefetch_related('sub_options').all()
    serializer_class = QuoteFormOptionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['step', 'parent', 'active']
    ordering_fields = ['order', 'created_at']
    ordering = ['step', 'order', 'id']  # Ne pas inclure 'parent' pour éviter la boucle infinie
    
    def get_queryset(self):
        queryset = QuoteFormOption.objects.prefetch_related('sub_options').all()
        # Filtrer par parent si spécifié
        parent = self.request.query_params.get('parent')
        if parent:
            if parent == 'null' or parent == '':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent)
        return queryset


class QuoteLineViewSet(viewsets.ModelViewSet):
    """ViewSet pour les lignes de tableau d'un devis"""
    queryset = QuoteLine.objects.all()
    serializer_class = QuoteLineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['quote_request', 'category']
    ordering_fields = ['order']
    ordering = ['order']

    def get_queryset(self):
        queryset = QuoteLine.objects.all()
        quote_request = self.request.query_params.get('quote_request')
        if quote_request:
            queryset = queryset.filter(quote_request_id=quote_request)
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    def bulk_create(self, request, *args, **kwargs):
        """Créer plusieurs lignes en une seule requête"""
        lines_data = request.data.get('lines', [])
        quote_request_id = request.data.get('quote_request')
        created = []
        for line_data in lines_data:
            line_data['quote_request'] = quote_request_id
            serializer = self.get_serializer(data=line_data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            created.append(serializer.data)
        return Response(created, status=status.HTTP_201_CREATED)


class SiteSettingsViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour SiteSettings"""
    module_name = 'parametres'
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = [IsAdminOrPublicReadOnly]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        # Toujours retourner l'instance unique (pk=1)
        # Vérifier si les champs SMTP existent dans le modèle
        try:
            # Essayer d'accéder à un champ SMTP pour voir s'il existe
            SiteSettings._meta.get_field('smtp_host')
            # Si on arrive ici, les champs existent, on peut faire une requête normale
            return SiteSettings.objects.filter(pk=1)
        except:
            # Les champs SMTP n'existent pas encore, on utilise only() pour ne sélectionner que les champs qui existent
            # Cela évite que Django essaie d'accéder à des colonnes qui n'existent pas
            return SiteSettings.objects.filter(pk=1).only(
                'id', 'primary_color', 'secondary_color', 'tertiary_color',
                'button_primary_color', 'button_primary_hover_color', 'button_text_color',
                'text_primary_color', 'text_link_color', 'text_link_hover_color',
                'banner_bg_color', 'banner_text_color',
                'footer_bg_color', 'footer_text_color', 'footer_link_color',
                'footer_link_hover_color', 'footer_border_color',
                'button_border_color', 'button_border_width', 'button_border_radius',
                'button_outline_border_color', 'button_outline_text_color', 'button_outline_hover_bg_color',
                'site_name_part1_color', 'site_name_part2_color', 'site_tagline_color',
                'logo', 'logo_favicon', 'site_name', 'site_tagline',
                'created_at', 'updated_at'
            )
    
    def list(self, request, *args, **kwargs):
        from rest_framework.exceptions import APIException
        from django.http import Http404
        # Récupérer ou créer l'instance unique
        try:
            settings = SiteSettings.get_settings()
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        except (APIException, Http404):
            raise
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Erreur lors de la récupération des paramètres: {e}')
            # Réponse de secours pour éviter 500 (ex: migration SMTP non appliquée)
            try:
                settings = SiteSettings.get_settings()
                serializer = self.get_serializer(settings)
                data = serializer.data
            except Exception:
                data = self._default_site_settings_response()
            for key in ('smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password'):
                if key not in data or data.get(key) is None:
                    data.setdefault(key, None if key != 'smtp_port' else 587)
            if data.get('smtp_port') is None:
                data['smtp_port'] = 587
            data.setdefault('smtp_use_tls', True)
            data.setdefault('smtp_use_ssl', False)
            return Response(data)
    
    def _default_site_settings_response(self):
        """Réponse minimale quand la base est inaccessible ou migrations manquantes."""
        return {
            'id': 1,
            'site_name': 'Services Locaux',
            'site_tagline': '',
            'primary_color': '#087A00',
            'secondary_color': '#066300',
            'logo_url': None,
            'logo_favicon_url': None,
            'smtp_host': None,
            'smtp_port': 587,
            'smtp_use_tls': True,
            'smtp_use_ssl': False,
            'smtp_username': None,
            'smtp_password': None,
        }
    
    def retrieve(self, request, *args, **kwargs):
        from rest_framework.exceptions import APIException
        from django.http import Http404
        try:
            settings = SiteSettings.get_settings()
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        except (APIException, Http404):
            raise
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Erreur lors de la récupération des paramètres: {e}')
            try:
                settings = SiteSettings.get_settings()
                serializer = self.get_serializer(settings)
                data = serializer.data
            except Exception:
                data = self._default_site_settings_response()
            for key in ('smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password'):
                data.setdefault(key, None if key != 'smtp_port' else 587)
            data.setdefault('smtp_port', 587)
            data.setdefault('smtp_use_tls', True)
            data.setdefault('smtp_use_ssl', False)
            return Response(data)
    
    def update(self, request, *args, **kwargs):
        from rest_framework.exceptions import APIException
        from django.http import Http404
        # Mettre à jour l'instance unique
        try:
            settings = SiteSettings.get_settings()
            serializer = self.get_serializer(settings, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except (APIException, Http404):
            raise
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Erreur lors de la mise à jour des paramètres: {e}')
            settings = SiteSettings.get_settings()
            filtered_data = request.data.copy()
            if not hasattr(SiteSettings, 'smtp_host'):
                for field in ['smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password']:
                    filtered_data.pop(field, None)
            serializer = self.get_serializer(settings, data=filtered_data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class PatientViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Patient avec gestion des QR codes"""
    module_name = 'patients'
    queryset = Patient.objects.select_related('client', 'created_by').all()
    serializer_class = PatientSerializer
    permission_classes = [IsSuperAdminOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'qr_code', 'client__username']
    filterset_fields = ['client', 'is_active', 'created_by']
    ordering_fields = ['created_at', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrage selon le rôle"""
        user = self.request.user
        # Précharger les relations pour optimiser les requêtes
        try:
            queryset = Patient.objects.select_related('client', 'created_by').prefetch_related('assigned_employees').filter(deleted_at__isnull=True)
        except Exception:
            # Si le champ assigned_employees n'existe pas encore, ne pas précharger
            queryset = Patient.objects.select_related('client', 'created_by').filter(deleted_at__isnull=True)
        
        if user.is_superadmin:
            return queryset
        elif user.is_admin:
            # Admin voit tous les patients
            return queryset
        elif user.is_client:
            # Client voit seulement ses propres patients
            return queryset.filter(client=user)
        else:
            # Employé ne peut pas voir les patients (sauf via scan)
            return Patient.objects.none()
    
    def perform_create(self, serializer):
        """Création avec created_by"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def by_qr_code(self, request):
        """Permettre aux employés de rechercher un patient par QR code"""
        qr_code = request.query_params.get('qr_code')
        if not qr_code:
            return Response(
                {'error': 'Paramètre qr_code requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient = Patient.objects.get(qr_code=qr_code, is_active=True)
            serializer = self.get_serializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient non trouvé ou inactif'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsEmploye])
    def my_assigned_patients(self, request):
        """Retourne les patients assignés à l'employé connecté (exclut ceux avec mission terminée aujourd'hui)"""
        from django.utils import timezone
        
        # Pour ManyToManyField, utiliser __in
        patients = Patient.objects.filter(
            assigned_employees__in=[request.user],
            is_active=True
        ).select_related('client').prefetch_related('assigned_employees').distinct()
        
        # Date de début d'aujourd'hui
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Retourner seulement les informations limitées pour les employés
        # Les employés ne voient PAS le QR code ni l'image du QR code
        # On affiche tous les patients assignés (plus de restriction sur les missions terminées)
        # car un employé peut visiter le même patient plusieurs fois
        data = []
        for patient in patients:
            data.append({
                'id': patient.id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'phone': patient.phone,
                'address': patient.address,
                # qr_code et qr_code_image_url ne sont PAS inclus pour les employés
                'client_username': patient.client.username if patient.client else None,
                'is_active': patient.is_active,
            })
        
        return Response(data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsEmploye])
    def my_patient_detail(self, request, pk=None):
        """Détails d'un patient assigné à l'employé (informations limitées)"""
        try:
            # Pour ManyToManyField, utiliser filter avec __in
            patient = Patient.objects.filter(
                pk=pk,
                assigned_employees__in=[request.user],
                is_active=True
            ).select_related('client').first()
            
            if not patient:
                return Response(
                    {'error': 'Patient non trouvé ou non assigné à cet employé'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serializer limité pour les employés - informations de base seulement
            # Les employés ne voient PAS le QR code ni l'image du QR code
            data = {
                'id': patient.id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'phone': patient.phone,
                'address': patient.address,
                # qr_code et qr_code_image_url ne sont PAS inclus pour les employés
                'client_username': patient.client.username if patient.client else None,
                'is_active': patient.is_active,
            }
            return Response(data)
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération du patient: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsSuperAdminOrAdmin])
    def qr_code_image(self, request, pk=None):
        """Retourne directement l'image QR code en tant que réponse HTTP"""
        from django.http import HttpResponse
        from rest_framework.response import Response
        from rest_framework import status
        
        try:
            patient = self.get_object()
        except Exception as e:
            return Response(
                {'error': f'Patient non trouvé: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le patient a un QR code, sinon le générer
        if not patient.qr_code:
            import uuid
            import hashlib
            client_id = patient.client.id if patient.client else "anonymous"
            unique_string = f"{client_id}_{uuid.uuid4()}"
            patient.qr_code = hashlib.sha256(unique_string.encode()).hexdigest()[:32].upper()
            patient.save(update_fields=['qr_code'])
        
        # Vérifier que le patient a un prénom et nom
        if not patient.first_name or not patient.last_name:
            return Response(
                {'error': 'Le patient doit avoir un prénom et un nom pour générer le QR code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            import qrcode
            from io import BytesIO
            from PIL import Image, ImageDraw, ImageFont
            
            print(f"[DEBUG] Début génération QR pour patient {patient.id}")
            print(f"[DEBUG] QR code du patient: {patient.qr_code}")
            print(f"[DEBUG] Nom: {patient.first_name} {patient.last_name}")
            
            # Créer le QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(patient.qr_code)
            qr.make(fit=True)
            print(f"[DEBUG] QR code créé avec succès")
            
            # Créer l'image du QR code
            qr_img = qr.make_image(fill_color="black", back_color="white")
            print(f"[DEBUG] Image QR code créée, mode: {qr_img.mode}, size: {qr_img.size}")
            
            # Obtenir les dimensions AVANT conversion
            qr_width, qr_height = qr_img.size
            print(f"[DEBUG] Dimensions QR: {qr_width}x{qr_height}, mode: {qr_img.mode}")
            
            # FORCER la conversion en RGB - qr.make_image peut retourner '1' (bitmap) ou 'L' (grayscale)
            qr_img = qr_img.convert('RGB')
            print(f"[DEBUG] Image convertie en RGB")
            
            # Créer une image plus grande pour inclure le nom
            padding = 20
            text_height = 60
            total_height = qr_height + padding + text_height
            
            final_img = Image.new('RGB', (qr_width, total_height), 'white')
            print(f"[DEBUG] Image finale créée: {qr_width}x{total_height}, mode: {final_img.mode}")
            
            # Coller le QR code - utiliser un tuple de 4 éléments (x0, y0, x1, y1) pour la région
            # Cela évite l'erreur "cannot determine region size"
            final_img.paste(qr_img, (0, 0, qr_width, qr_height))
            print(f"[DEBUG] QR code collé avec succès")
            
            # Ajouter le nom du patient - version ultra-simplifiée
            try:
                draw = ImageDraw.Draw(final_img)
                
                # Nom en majuscules
                patient_name = f"{patient.first_name.upper()} {patient.last_name.upper()}"
                print(f"[DEBUG] Nom du patient: {patient_name}")
                
                # Essayer de charger une police simple
                font = None
                font_size = 24
                
                try:
                    import platform
                    import os
                    if platform.system() == 'Windows':
                        windir = os.environ.get('WINDIR', 'C:\\Windows')
                        font_paths = [
                            os.path.join(windir, 'Fonts', 'arial.ttf'),
                            os.path.join(windir, 'Fonts', 'arialbd.ttf'),
                        ]
                    else:
                        font_paths = [
                            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                        ]
                    
                    for font_path in font_paths:
                        try:
                            if os.path.exists(font_path):
                                font = ImageFont.truetype(font_path, font_size)
                                print(f"[DEBUG] Police chargée: {font_path}")
                                break
                        except Exception:
                            continue
                except Exception:
                    pass
                
                # Si aucune police trouvée, ne pas utiliser de police (texte simple)
                if font is None:
                    print(f"[DEBUG] Aucune police trouvée, utilisation du texte simple")
                
                # Estimation TRÈS simple de la largeur (sans utiliser textbbox/textlength)
                # Environ 14 pixels par caractère pour une police de taille 24
                char_width = 14 if font else 12
                text_width = len(patient_name) * char_width
                
                # Centrer le texte horizontalement
                text_x = max(0, (qr_width - text_width) // 2)
                text_y = qr_height + padding + 10
                
                print(f"[DEBUG] Position texte: x={text_x}, y={text_y}, width={text_width}")
                
                # Dessiner le texte - méthode simple sans calcul complexe
                try:
                    if font:
                        draw.text((text_x, text_y), patient_name, fill='black', font=font)
                    else:
                        draw.text((text_x, text_y), patient_name, fill='black')
                    print(f"[DEBUG] Texte dessiné avec succès")
                except Exception as draw_error:
                    print(f"[DEBUG] Erreur lors du dessin (ignorée): {str(draw_error)}")
                    # Essayer sans police
                    try:
                        draw.text((text_x, text_y), patient_name, fill='black')
                        print(f"[DEBUG] Texte dessiné sans police")
                    except:
                        print(f"[DEBUG] Impossible de dessiner le texte, continuer sans texte")
                        pass
            except Exception as text_error:
                # Si le dessin du texte échoue complètement, continuer sans texte
                print(f"[DEBUG] Erreur globale lors du dessin du texte (ignorée): {str(text_error)}")
                import traceback
                print(traceback.format_exc())
                pass
            
            print(f"[DEBUG] Conversion en bytes...")
            # Convertir en bytes
            buffer = BytesIO()
            try:
                final_img.save(buffer, format='PNG')
                buffer.seek(0)
                print(f"[DEBUG] Image sauvegardée dans le buffer, taille: {len(buffer.getvalue())} bytes")
            except Exception as save_error:
                print(f"[DEBUG] Erreur lors de la sauvegarde: {str(save_error)}")
                import traceback
                print(traceback.format_exc())
                raise
            
            # Retourner l'image directement
            print(f"[DEBUG] Création de la réponse HTTP...")
            response = HttpResponse(buffer.getvalue(), content_type='image/png')
            response['Content-Disposition'] = f'inline; filename="qr_{patient.qr_code}.png"'
            print(f"[DEBUG] Réponse créée, retour de l'image")
            return response
            
        except ImportError as e:
            import traceback
            print(f"ImportError génération QR code: {str(e)}")
            print(traceback.format_exc())
            # Retourner une réponse HTTP avec erreur JSON
            from rest_framework.response import Response
            return Response(
                {'error': 'Bibliothèque qrcode non installée. Installez avec: pip install qrcode[pil]'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            import traceback
            import sys
            error_msg = str(e)
            error_type = type(e).__name__
            exc_info = sys.exc_info()
            
            # Log détaillé de l'erreur
            print("=" * 80)
            print(f"ERREUR GÉNÉRATION QR CODE - Patient ID: {patient.id}")
            print(f"Type d'erreur: {error_type}")
            print(f"Message: {error_msg}")
            print("Traceback complet:")
            print(traceback.format_exc())
            print("=" * 80)
            
            # Retourner une réponse HTTP avec erreur JSON
            from rest_framework.response import Response
            return Response(
                {
                    'error': f'Erreur lors de la génération du QR code: {error_msg}',
                    'error_type': error_type,
                    'patient_id': patient.id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOrAdmin])
    def generate_qr_image(self, request, pk=None):
        """Générer et sauvegarder l'image du QR code pour un patient"""
        patient = self.get_object()
        
        try:
            import os
            from django.conf import settings
            
            # Supprimer l'ancienne image si elle existe pour forcer la régénération
            if patient.qr_code_image:
                try:
                    file_path = os.path.join(settings.MEDIA_ROOT, patient.qr_code_image.name)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    patient.qr_code_image.delete(save=False)
                except Exception as e:
                    print(f"Erreur lors de la suppression de l'ancien QR code: {str(e)}")
            
            # Utiliser la méthode du modèle
            patient.generate_qr_image()
            
            # Rafraîchir l'instance
            patient.refresh_from_db()
            
            # Vérifier que le fichier a bien été créé
            if patient.qr_code_image:
                file_path = os.path.join(settings.MEDIA_ROOT, patient.qr_code_image.name)
                if not os.path.exists(file_path):
                    # Si le fichier n'existe toujours pas, essayer de régénérer
                    patient.generate_qr_image()
                    patient.refresh_from_db()
            
            serializer = self.get_serializer(patient)
            return Response({
                'message': 'Image QR code générée avec succès',
                'patient': serializer.data
            })
        except ImportError:
            return Response(
                {'error': 'Bibliothèque qrcode non installée. Installez avec: pip install qrcode[pil]'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            import traceback
            print(f"Erreur génération QR code: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': f'Erreur lors de la génération du QR code: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsSuperAdminOrAdmin])
    def regenerate_all_qr_codes(self, request):
        """Régénérer tous les QR codes existants avec le nom du patient"""
        try:
            import os
            from django.conf import settings
            
            patients = Patient.objects.all()
            count = 0
            missing_count = 0
            errors = []
            
            for patient in patients:
                try:
                    # Vérifier si le fichier existe
                    file_exists = False
                    if patient.qr_code_image:
                        file_path = os.path.join(settings.MEDIA_ROOT, patient.qr_code_image.name)
                        file_exists = os.path.exists(file_path)
                    
                    # Si le fichier n'existe pas ou si on force la régénération
                    if not file_exists or request.data.get('force', False):
                        # Supprimer l'ancienne image si elle existe
                        if patient.qr_code_image:
                            try:
                                patient.qr_code_image.delete(save=False)
                            except Exception:
                                pass  # Ignorer si le fichier n'existe pas
                        
                        # Régénérer avec le nom
                        patient.generate_qr_image()
                        count += 1
                        if not file_exists:
                            missing_count += 1
                except Exception as e:
                    errors.append(f"Patient {patient.id} ({patient.first_name} {patient.last_name}): {str(e)}")
            
            message = f'{count} QR code(s) régénéré(s) avec succès.'
            if missing_count > 0:
                message += f' {missing_count} fichier(s) manquant(s) régénéré(s).'
            if errors:
                message += f' {len(errors)} erreur(s): {", ".join(errors[:5])}'
            
            return Response({
                'message': message,
                'regenerated_count': count,
                'missing_files_regenerated': missing_count,
                'errors': errors
            })
        except ImportError:
            return Response(
                {'error': 'Bibliothèque qrcode non installée. Installez avec: pip install qrcode[pil]'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la régénération: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdminOrAdmin])
    def check_missing_qr_files(self, request):
        """Vérifier quels patients ont des QR codes manquants"""
        try:
            import os
            from django.conf import settings
            
            patients = Patient.objects.filter(qr_code_image__isnull=False)
            missing = []
            
            for patient in patients:
                if patient.qr_code_image:
                    file_path = os.path.join(settings.MEDIA_ROOT, patient.qr_code_image.name)
                    if not os.path.exists(file_path):
                        missing.append({
                            'id': patient.id,
                            'name': f"{patient.first_name} {patient.last_name}",
                            'qr_code': patient.qr_code,
                            'expected_path': patient.qr_code_image.name
                        })
            
            return Response({
                'missing_count': len(missing),
                'missing_files': missing
            })
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la vérification: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PresenceViewSet(SoftDeleteMixin, ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour Presence avec scan QR code"""
    module_name = 'scans'
    queryset = Presence.objects.select_related('patient', 'employe', 'patient__client').all()
    serializer_class = PresenceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__qr_code', 'employe__username']
    filterset_fields = ['patient', 'employe', 'status']
    ordering_fields = ['scan_time']
    ordering = ['-scan_time']
    
    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action in ['update', 'partial_update', 'destroy']:
            # Seuls les admins et superadmins peuvent modifier ou supprimer les scans
            return [IsSuperAdminOrAdmin()]
        return [IsAuthenticated()]
    
    def update(self, request, *args, **kwargs):
        """Mise à jour d'une présence - réservée aux admins"""
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Mise à jour partielle d'une présence - réservée aux admins"""
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete d'une présence - réservée aux admins"""
        return SoftDeleteMixin.destroy(self, request, *args, **kwargs)
    
    def get_queryset(self):
        """Filtrage selon le rôle et filtres additionnels"""
        user = self.request.user
        queryset = Presence.objects.select_related('patient', 'employe', 'patient__client').filter(deleted_at__isnull=True)
        
        if user.is_superadmin or user.is_admin:
            # SuperAdmin et Admin voient toutes les présences
            pass
        elif user.is_employe:
            # Employé voit seulement ses propres présences
            queryset = queryset.filter(employe=user)
        elif user.is_client:
            # Client voit les présences de ses patients
            queryset = queryset.filter(patient__client=user)
        else:
            return Presence.objects.none()
        
        # Filtres additionnels par date
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        
        if date_debut:
            try:
                from django.utils.dateparse import parse_datetime, parse_date
                from django.utils import timezone
                # Essayer de parser comme datetime d'abord
                parsed = parse_datetime(date_debut)
                if parsed:
                    queryset = queryset.filter(scan_time__gte=parsed)
                else:
                    # Sinon, parser comme date et utiliser minuit
                    parsed_date = parse_date(date_debut)
                    if parsed_date:
                        queryset = queryset.filter(scan_time__gte=timezone.make_aware(
                            timezone.datetime.combine(parsed_date, timezone.datetime.min.time())
                        ))
            except (ValueError, TypeError):
                pass  # Ignorer les dates invalides
        
        if date_fin:
            try:
                from django.utils.dateparse import parse_datetime, parse_date
                from django.utils import timezone
                # Essayer de parser comme datetime d'abord
                parsed = parse_datetime(date_fin)
                if parsed:
                    queryset = queryset.filter(scan_time__lte=parsed)
                else:
                    # Sinon, parser comme date et utiliser fin de journée
                    parsed_date = parse_date(date_fin)
                    if parsed_date:
                        queryset = queryset.filter(scan_time__lte=timezone.make_aware(
                            timezone.datetime.combine(parsed_date, timezone.datetime.max.time())
                        ))
            except (ValueError, TypeError):
                pass  # Ignorer les dates invalides
        
        return queryset

    def _format_hours(self, total_seconds):
        """Formate des secondes en 'XhYY' — logique identique à formatHours() dans Scans.tsx."""
        total_hours = total_seconds / 3600
        h = int(total_hours)
        m = round((total_hours - h) * 60)
        if m == 60:  # arrondi peut provoquer 60min → 1h de plus
            h += 1
            m = 0
        if h == 0:
            return f"{m}min"
        if m == 0:
            return f"{h}h"
        return f"{h}h{m:02d}"

    def _build_monthly_data(self, qs, debut, periode_label=None):
        """Construit les données du rapport organisées par PATIENT, avec sous-groupes par employé."""
        from collections import defaultdict
        import zoneinfo
        TZ_PARIS = zoneinfo.ZoneInfo("Europe/Paris")

        if not periode_label:
            MOIS_LABELS = {
                1: 'Janvier', 2: 'Février', 3: 'Mars', 4: 'Avril', 5: 'Mai', 6: 'Juin',
                7: 'Juillet', 8: 'Août', 9: 'Septembre', 10: 'Octobre', 11: 'Novembre', 12: 'Décembre'
            }
            periode_label = f"{MOIS_LABELS[debut.month]} {debut.year}"

        # Grouper par (patient, employe)
        # Logique identique à Scans.tsx :
        # - trier du plus récent au plus ancien
        # - pour chaque ARRIVEE, trouver le DEPART le plus proche chronologiquement après
        # - ne compter les heures que sur les paires complètes (arrivée+départ)
        groupes = defaultdict(list)
        for p in qs:
            key = (p.patient_id, p.employe_id)
            groupes[key].append(p)

        patients_map = {}
        total_seconds_global = 0
        nb_visites_global = 0
        employes_ids = set()

        visites_intermediaires = []

        for (pat_id, emp_id), scans in groupes.items():
            # Trier du plus récent au plus ancien (identique à Scans.tsx)
            scans_sorted = sorted(scans, key=lambda s: s.scan_time, reverse=True)

            arrivees = [s for s in scans_sorted if s.status == 'ARRIVEE']
            departs  = [s for s in scans_sorted if s.status == 'DEPART']
            processed_ids = set()

            ref = scans_sorted[0]
            patient_obj = ref.patient
            employe_obj = ref.employe
            fn = (employe_obj.first_name or '').strip()
            ln = (employe_obj.last_name or '').strip()
            if fn.lower() == ln.lower():
                employe_nom = fn or employe_obj.username
            else:
                employe_nom = f"{fn} {ln}".strip() or employe_obj.username
            employes_ids.add(emp_id)

            for arrivee in arrivees:
                if arrivee.id in processed_ids:
                    continue
                # Départ le plus proche après cette arrivée (trié par date croissante)
                matching = sorted(
                    [d for d in departs
                     if d.id not in processed_ids and d.scan_time >= arrivee.scan_time],
                    key=lambda d: d.scan_time
                )
                depart = matching[0] if matching else None

                processed_ids.add(arrivee.id)
                if depart:
                    processed_ids.add(depart.id)

                # Ne compter les heures que sur paires complètes (comme Scans.tsx)
                if not depart:
                    continue

                delta = depart.scan_time - arrivee.scan_time
                duree_sec = max(0, int(delta.total_seconds()))
                duree_min_affichage = duree_sec // 60
                h, m = divmod(duree_min_affichage, 60)
                duree_str = f"{h}h{m:02d}" if duree_min_affichage > 0 else "—"

                arrivee_paris = arrivee.scan_time.astimezone(TZ_PARIS)
                depart_paris = depart.scan_time.astimezone(TZ_PARIS)
                date_str = arrivee_paris.strftime('%d/%m/%Y')
                visite = {
                    'date': date_str,
                    'employe_id': emp_id,
                    'employe': employe_nom,
                    'heure_arrivee': arrivee_paris.strftime('%H:%M'),
                    'heure_depart': depart_paris.strftime('%H:%M'),
                    'duree_minutes': duree_min_affichage,
                    'duree_str': duree_str,
                    'duree_sec': duree_sec,
                }
                visites_intermediaires.append((pat_id, emp_id, patient_obj, employe_nom, duree_sec, visite))

        for (pat_id, emp_id, patient_obj, employe_nom, duree_sec, visite) in visites_intermediaires:

            if pat_id not in patients_map:
                patients_map[pat_id] = {
                    'patient_id': pat_id,
                    'patient_nom': (lambda f, l: f if f.lower() == l.lower() else f"{f} {l}".strip())(
                        (patient_obj.first_name or '').strip(), (patient_obj.last_name or '').strip()
                    ) or patient_obj.username,
                    'patient_email': getattr(patient_obj, 'email', '') or '',
                    'visites': [],
                    'employes_map': {},
                    'total_seconds': 0,
                    'nb_visites': 0,
                }

            pat = patients_map[pat_id]
            pat['visites'].append(visite)
            pat['total_seconds'] += duree_sec
            pat['nb_visites'] += 1
            total_seconds_global += duree_sec
            nb_visites_global += 1

            # Sous-groupe employé
            if emp_id not in pat['employes_map']:
                pat['employes_map'][emp_id] = {
                    'employe_id': emp_id,
                    'employe_nom': employe_nom,
                    'visites': [],
                    'total_seconds': 0,
                }
            pat['employes_map'][emp_id]['visites'].append(visite)
            pat['employes_map'][emp_id]['total_seconds'] += duree_sec

        patients_data = []
        for pd in patients_map.values():
            pd['visites'].sort(key=lambda v: v['date'])
            pd['total_minutes'] = pd['total_seconds'] // 60
            pd['total_heures_str'] = self._format_hours(pd['total_seconds'])

            employes_list = []
            for emp_data in pd['employes_map'].values():
                emp_data['visites'].sort(key=lambda v: v['date'])
                emp_data['total_minutes'] = emp_data['total_seconds'] // 60
                emp_data['total_heures_str'] = self._format_hours(emp_data['total_seconds'])
                emp_data['nb_visites'] = len(emp_data['visites'])
                employes_list.append(emp_data)
            employes_list.sort(key=lambda e: e['employe_nom'])
            pd['employes'] = employes_list
            del pd['employes_map']

            patients_data.append(pd)

        patients_data.sort(key=lambda p: p['patient_nom'])

        total_heures_str_global = self._format_hours(total_seconds_global)
        return {
            'patients_data': patients_data,
            'nb_patients': len(patients_map),
            'nb_employes': len(employes_ids),
            'nb_visites': nb_visites_global,
            'total_minutes': total_seconds_global // 60,
            'total_heures_str': total_heures_str_global,
            'mois_label': periode_label,
        }

    def _get_period(self, mois_str=None, date_debut_str=None, date_fin_str=None):
        from datetime import datetime, timezone as dt_tz
        import calendar
        today = datetime.now(tz=dt_tz.utc)

        # Intervalle personnalisé
        if date_debut_str and date_fin_str:
            try:
                debut = datetime.strptime(date_debut_str, '%Y-%m-%d').replace(tzinfo=dt_tz.utc)
                fin = datetime.strptime(date_fin_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=dt_tz.utc)
                return debut, fin, today, f"{debut.strftime('%d/%m/%Y')} — {fin.strftime('%d/%m/%Y')}"
            except ValueError:
                pass

        # Mois YYYY-MM
        if mois_str:
            try:
                debut = datetime.strptime(mois_str, '%Y-%m').replace(day=1, tzinfo=dt_tz.utc)
            except ValueError:
                debut = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            debut = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        last_day = calendar.monthrange(debut.year, debut.month)[1]
        fin = debut.replace(day=last_day, hour=23, minute=59, second=59)
        MOIS_LABELS = {
            1:'Janvier',2:'Février',3:'Mars',4:'Avril',5:'Mai',6:'Juin',
            7:'Juillet',8:'Août',9:'Septembre',10:'Octobre',11:'Novembre',12:'Décembre'
        }
        label = f"{MOIS_LABELS[debut.month]} {debut.year}"
        return debut, fin, today, label

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def monthly_report(self, request):
        """Rapport des heures par patient — JSON ou PDF — supporte mois ou intervalle date_debut/date_fin"""
        mois = request.query_params.get('mois')
        date_debut_str = request.query_params.get('date_debut')
        date_fin_str = request.query_params.get('date_fin')
        patient_id = request.query_params.get('patient')
        format_out = request.query_params.get('output', request.query_params.get('format', 'json'))

        debut, fin, today, periode_label = self._get_period(mois, date_debut_str, date_fin_str)
        user = request.user

        qs = Presence.objects.select_related('patient', 'employe').filter(
            scan_time__gte=debut, scan_time__lte=fin
        ).order_by('patient', 'scan_time')

        if not (user.is_superadmin or user.is_admin):
            qs = qs.filter(employe=user)

        if patient_id:
            qs = qs.filter(patient_id=int(patient_id))

        data = self._build_monthly_data(qs, debut, periode_label)

        if format_out == 'pdf':
            return self._generate_pdf(data, debut, periode_label)

        return Response({
            'mois': mois or debut.strftime('%Y-%m'),
            'date_debut': debut.strftime('%Y-%m-%d'),
            'date_fin': fin.strftime('%Y-%m-%d'),
            **data,
        })

    def _load_image_b64(self, image_field):
        """Charge une image depuis un FileField et retourne une data URI base64."""
        import os, base64
        try:
            if not image_field:
                return None
            path = image_field.path
            if not os.path.exists(path):
                return None
            with open(path, 'rb') as f:
                data = base64.b64encode(f.read()).decode('utf-8')
            ext = os.path.splitext(path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/jpeg'
            return f'data:{mime};base64,{data}'
        except Exception:
            return None

    def _generate_pdf(self, data, debut, periode_label=None):
        from xhtml2pdf import pisa
        from django.template.loader import render_to_string
        from django.http import HttpResponse
        from io import BytesIO
        from datetime import datetime

        try:
            site_settings = SiteSettings.objects.first()
        except Exception:
            site_settings = None

        logo_path = self._load_image_b64(getattr(site_settings, 'logo', None)) if site_settings else None
        logo_secondary_path = self._load_image_b64(getattr(site_settings, 'logo_secondary', None)) if site_settings else None
        logo_signature_path = self._load_image_b64(getattr(site_settings, 'logo_signature', None)) if site_settings else None

        pdf_primary = '#087A00'
        if site_settings:
            pdf_primary = (getattr(site_settings, 'devis_pdf_primary_color', None) or getattr(site_settings, 'primary_color', None) or '').strip() or '#087A00'

        context = {
            **data,
            'mois_label': periode_label or data.get('mois_label', ''),
            'date_generation': datetime.now().strftime('%d/%m/%Y'),
            'site_settings': site_settings,
            'logo_path': logo_path,
            'logo_secondary_path': logo_secondary_path,
            'logo_signature_path': logo_signature_path,
            'pdf_primary_color': pdf_primary,
        }

        html = render_to_string('monthly_report.html', context)
        buffer = BytesIO()
        pisa.CreatePDF(html, dest=buffer, encoding='utf-8')
        buffer.seek(0)
        filename = f"rapport-heures-{debut.strftime('%Y-%m-%d')}.pdf"
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def send_monthly_report(self, request):
        """Envoie le rapport mensuel par email au patient"""
        from xhtml2pdf import pisa
        from django.template.loader import render_to_string
        from io import BytesIO
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.base import MIMEBase
        from email import encoders

        mois = request.data.get('mois')
        date_debut_str = request.data.get('date_debut')
        date_fin_str = request.data.get('date_fin')
        patient_id = request.data.get('patient_id')
        email_dest = request.data.get('email')

        if not patient_id:
            return Response({'error': 'patient_id requis'}, status=400)

        debut, fin, today, periode_label = self._get_period(mois, date_debut_str, date_fin_str)

        qs = Presence.objects.select_related('patient', 'employe').filter(
            scan_time__gte=debut, scan_time__lte=fin,
            patient_id=patient_id
        ).order_by('patient', 'scan_time')

        data = self._build_monthly_data(qs, debut, periode_label)

        if not data['patients_data']:
            return Response({'error': 'Aucune donnée pour ce patient ce mois-ci'}, status=404)

        patient_data = data['patients_data'][0]
        dest_email = email_dest or patient_data.get('patient_email', '')
        if not dest_email:
            return Response({'error': 'Aucun email pour ce patient'}, status=400)

        # Générer le PDF via _generate_pdf
        pdf_response = self._generate_pdf(data, debut, data.get('mois_label'))
        pdf_bytes = pdf_response.content

        # Envoyer l'email
        try:
            smtp_host = getattr(site_settings, 'smtp_host', None) if site_settings else None
            smtp_port = getattr(site_settings, 'smtp_port', 587) if site_settings else 587
            smtp_use_tls = getattr(site_settings, 'smtp_use_tls', True) if site_settings else True
            smtp_username = getattr(site_settings, 'smtp_username', None) if site_settings else None
            smtp_password = getattr(site_settings, 'smtp_password', None) if site_settings else None
            site_name = getattr(site_settings, 'site_name', 'EASE-DOM') if site_settings else 'EASE-DOM'

            if not smtp_host or not smtp_username:
                return Response({'error': 'SMTP non configuré dans les paramètres'}, status=500)

            msg = MIMEMultipart()
            msg['From'] = smtp_username
            msg['To'] = dest_email
            msg['Subject'] = f"{site_name} — Rapport heures {data['mois_label']}"

            body = f"""Bonjour {patient_data['patient_nom']},

Veuillez trouver ci-joint votre rapport des heures de prestations pour le mois de {data['mois_label']}.

Récapitulatif :
- Nombre de visites : {patient_data['nb_visites']}
- Total heures effectuées : {patient_data['total_heures_str']}

Cordialement,
{site_name}"""

            msg.attach(MIMEText(body, 'plain'))

            part = MIMEBase('application', 'octet-stream')
            part.set_payload(pdf_bytes)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="rapport-heures-{debut.strftime("%Y-%m")}.pdf"')
            msg.attach(part)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                if smtp_use_tls:
                    server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, dest_email, msg.as_string())

            return Response({'success': True, 'message': f'Rapport envoyé à {dest_email}'})

        except Exception as e:
            return Response({'error': f'Erreur envoi email: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'], permission_classes=[IsEmploye])
    def scan_qr_code(self, request):
        """Endpoint pour scanner un QR code (arrivée ou départ)"""
        qr_code = request.data.get('qr_code')
        status_scan = request.data.get('status')  # ARRIVEE ou DEPART
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        notes = request.data.get('notes', '')
        
        if not qr_code:
            return Response(
                {'error': 'QR code requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not status_scan or status_scan not in ['ARRIVEE', 'DEPART']:
            return Response(
                {'error': 'Le statut (ARRIVEE ou DEPART) est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trouver le patient par QR code
        try:
            patient = Patient.objects.get(qr_code=qr_code, is_active=True)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'QR code invalide ou patient inactif'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier les scans existants pour ce patient aujourd'hui
        from django.utils import timezone
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_presences = Presence.objects.filter(
            patient=patient,
            employe=request.user,
            scan_time__gte=today_start
        ).order_by('-scan_time')
        
        # Compter les scans par type
        arrivals_count = today_presences.filter(status='ARRIVEE').count()
        departures_count = today_presences.filter(status='DEPART').count()
        
        # Logique : Premier scan = Arrivée obligatoire, ensuite Départ
        # Après un Départ, on peut recommencer une nouvelle mission (Arrivée puis Départ)
        
        if status_scan == 'ARRIVEE':
            # Pour une arrivée, vérifier le dernier scan (le plus récent)
            # Si le dernier scan est une arrivée sans départ, on ne peut pas créer une nouvelle arrivée
            # Si le dernier scan est un départ (ou aucun scan), on peut créer une arrivée
            last_presence = today_presences.first()
            
            if last_presence and last_presence.status == 'ARRIVEE':
                # Vérifier s'il y a un départ après cette dernière arrivée
                departure_after_last_arrival = today_presences.filter(
                    status='DEPART',
                    scan_time__gt=last_presence.scan_time
                ).exists()
                
                if not departure_after_last_arrival:
                    # Il y a déjà une arrivée sans départ, on ne peut pas créer une nouvelle arrivée
                    return Response(
                        {'error': 'Vous devez d\'abord enregistrer le départ pour la mission en cours avant de commencer une nouvelle arrivée.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        elif status_scan == 'DEPART':
            # Pour un départ, vérifier s'il y a une arrivée "ouverte" (sans départ correspondant)
            # On cherche la dernière arrivée qui n'a pas encore de départ après elle
            last_arrival = today_presences.filter(status='ARRIVEE').first()
            
            # Log pour débogage
            logger.info(f"Scan DEPART - Patient: {patient.id}, Employé: {request.user.id}")
            logger.info(f"Scans aujourd'hui: {today_presences.count()}")
            logger.info(f"Arrivées aujourd'hui: {today_presences.filter(status='ARRIVEE').count()}")
            logger.info(f"Départs aujourd'hui: {today_presences.filter(status='DEPART').count()}")
            logger.info(f"Dernière arrivée trouvée: {last_arrival}")
            
            if not last_arrival:
                # Aucune arrivée aujourd'hui - vérifier aussi toutes les arrivées (pas seulement aujourd'hui)
                all_arrivals = Presence.objects.filter(
                    patient=patient,
                    employe=request.user,
                    status='ARRIVEE'
                ).order_by('-scan_time').first()
                
                if all_arrivals:
                    logger.warning(f"Aucune arrivée aujourd'hui mais arrivée trouvée hier/avant: {all_arrivals.scan_time}")
                    return Response(
                        {
                            'error': 'Aucune arrivée enregistrée aujourd\'hui. Veuillez d\'abord scanner l\'arrivée pour aujourd\'hui.',
                            'last_arrival_date': all_arrivals.scan_time.isoformat() if all_arrivals.scan_time else None
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    logger.warning("Aucune arrivée trouvée (ni aujourd'hui ni avant)")
                    return Response(
                        {'error': 'Impossible d\'enregistrer un départ sans arrivée. Veuillez d\'abord scanner l\'arrivée.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Vérifier s'il y a déjà un départ après cette dernière arrivée
            departure_after_last_arrival = today_presences.filter(
                status='DEPART',
                scan_time__gt=last_arrival.scan_time
            ).exists()
            
            logger.info(f"Départ après dernière arrivée: {departure_after_last_arrival}")
            
            if departure_after_last_arrival:
                # Il y a déjà un départ après la dernière arrivée, on ne peut pas créer un nouveau départ
                return Response(
                    {'error': 'Vous devez d\'abord enregistrer une nouvelle arrivée avant de pouvoir enregistrer un départ.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Créer la présence
        presence_data = {
            'patient': patient.id,
            'employe': request.user.id,
            'status': status_scan,
            'notes': notes
        }
        
        if latitude and longitude:
            # Arrondir les coordonnées GPS à 6 décimales (précision d'environ 10 cm)
            # Le modèle DecimalField accepte max_digits=9, decimal_places=6
            try:
                from decimal import Decimal, ROUND_HALF_UP
                # Convertir en Decimal et arrondir à 6 décimales
                lat_decimal = Decimal(str(latitude)).quantize(
                    Decimal('0.000001'), 
                    rounding=ROUND_HALF_UP
                )
                lon_decimal = Decimal(str(longitude)).quantize(
                    Decimal('0.000001'), 
                    rounding=ROUND_HALF_UP
                )
                # Vérifier que les valeurs sont dans les limites acceptables
                if abs(lat_decimal) <= 90 and abs(lon_decimal) <= 180:
                    presence_data['latitude'] = float(lat_decimal)
                    presence_data['longitude'] = float(lon_decimal)
                else:
                    logger.warning(f"Coordonnées GPS hors limites: lat={lat_decimal}, lon={lon_decimal}")
            except (ValueError, TypeError, Exception) as e:
                logger.warning(f"Erreur lors du traitement des coordonnées GPS: {str(e)}")
                # Ne pas inclure les coordonnées si elles sont invalides
        
        serializer = self.get_serializer(data=presence_data)
        if not serializer.is_valid():
            # Logger les erreurs de validation pour le débogage
            error_details = serializer.errors
            logger.error(f"Erreur de validation du serializer pour scan {status_scan}: {error_details}")
            logger.error(f"Données envoyées: {presence_data}")
            return Response(
                {
                    'error': 'Erreur de validation des données',
                    'message': 'Les données envoyées ne sont pas valides',
                    'details': error_details,
                    'received_data': presence_data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si une date/heure personnalisée est fournie
        scan_time = request.data.get('scan_time')
        try:
            if scan_time:
                from django.utils.dateparse import parse_datetime
                parsed_time = parse_datetime(scan_time)
                if parsed_time:
                    presence = serializer.save(scan_time=parsed_time)
                else:
                    presence = serializer.save(scan_time=timezone.now())
            else:
                presence = serializer.save(scan_time=timezone.now())
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de la présence: {str(e)}")
            return Response(
                {
                    'error': 'Erreur lors de la sauvegarde',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Calculer la durée si c'est un départ
        duration = None
        if status_scan == 'DEPART':
            # Chercher l'arrivée la plus récente (peut être dans today_presences ou avant)
            # D'abord dans les scans d'aujourd'hui
            arrival = today_presences.filter(status='ARRIVEE').order_by('-scan_time').first()
            
            # Si pas d'arrivée aujourd'hui, chercher la plus récente avant aujourd'hui
            if not arrival:
                arrival = Presence.objects.filter(
                    patient=patient,
                    employe=request.user,
                    status='ARRIVEE',
                    scan_time__lt=presence.scan_time
                ).order_by('-scan_time').first()
            
            if arrival and presence.scan_time and arrival.scan_time:
                try:
                    delta = presence.scan_time - arrival.scan_time
                    if delta.total_seconds() > 0:  # S'assurer que le départ est après l'arrivée
                        duration = round(delta.total_seconds() / 3600, 2)  # En heures
                        # Mettre à jour la durée dans la base de données si possible
                        # Note: duration est une propriété calculée, donc on ne peut pas la sauvegarder directement
                        # Mais on peut la retourner dans la réponse
                except (AttributeError, TypeError, ValueError) as e:
                    # Si scan_time est None ou autre problème, ignorer
                    logger.warning(f"Erreur lors du calcul de la durée: {str(e)}")
                    duration = None
        
        # Rafraîchir l'instance depuis la base de données pour avoir toutes les données
        presence.refresh_from_db()
        
        # Utiliser le serializer avec l'instance rafraîchie
        response_serializer = self.get_serializer(presence)
        response_data = response_serializer.data
        response_data['duration_hours'] = duration
        response_data['patient_name'] = f"{patient.first_name} {patient.last_name}"
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsEmploye])
    def my_statistics(self, request):
        """Endpoint pour récupérer les statistiques d'un employé"""
        from django.utils import timezone
        from datetime import timedelta
        
        user = request.user
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Patients assignés à cet employé (pas tous les patients)
        assigned_patients = Patient.objects.filter(
            assigned_employees__in=[user],
            is_active=True
        ).distinct()
        
        # Compter tous les patients assignés (plus de restriction sur les missions terminées)
        # car un employé peut visiter le même patient plusieurs fois
        total_patients = assigned_patients.count()
        
        # Patients visités aujourd'hui (avec au moins une présence)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        patients_visited_today = Presence.objects.filter(
            employe=user,
            scan_time__gte=today_start
        ).values('patient').distinct().count()
        
        # Total des visites aujourd'hui
        # Une visite = 1 cycle complet : Arrivée → Départ
        # Exemple : Arrivée 1 → Départ 1 = 1 visite, Arrivée 2 → Départ 2 = 1 autre visite
        today_presences = Presence.objects.filter(
            employe=user,
            scan_time__gte=today_start
        ).order_by('scan_time')
        
        # Trier toutes les présences par ordre chronologique
        all_presences = list(today_presences.order_by('scan_time'))
        
        # Compter les cycles complets (Arrivée suivie d'un Départ)
        # On utilise une file d'attente : chaque arrivée attend un départ
        complete_visits = 0
        pending_arrivals = []  # Liste des arrivées en attente d'un départ
        
        for presence in all_presences:
            if presence.status == 'ARRIVEE':
                # Ajouter cette arrivée à la file d'attente
                pending_arrivals.append(presence)
            elif presence.status == 'DEPART':
                # Si on a une arrivée en attente, c'est un cycle complet = 1 visite
                if pending_arrivals:
                    # Utiliser la première arrivée en attente (FIFO - First In First Out)
                    complete_visits += 1
                    pending_arrivals.pop(0)  # Retirer l'arrivée utilisée
        
        total_visits_today = complete_visits
        
        # Visites de la semaine (même logique)
        week_start = today_start - timedelta(days=7)
        week_presences = Presence.objects.filter(
            employe=user,
            scan_time__gte=week_start
        ).order_by('scan_time')
        
        # Trier toutes les présences de la semaine par ordre chronologique
        all_presences_week = list(week_presences.order_by('scan_time'))
        
        # Compter les cycles complets (Arrivée suivie d'un Départ)
        complete_visits_week = 0
        pending_arrivals_week = []  # Liste des arrivées en attente d'un départ
        
        for presence in all_presences_week:
            if presence.status == 'ARRIVEE':
                # Ajouter cette arrivée à la liste des arrivées en attente
                pending_arrivals_week.append(presence)
            elif presence.status == 'DEPART':
                # Si on a une arrivée en attente, c'est un cycle complet
                if pending_arrivals_week:
                    # Utiliser la première arrivée en attente (la plus ancienne)
                    complete_visits_week += 1
                    pending_arrivals_week.pop(0)  # Retirer l'arrivée utilisée
        
        total_visits_week = complete_visits_week
        
        # Liste des patients visités aujourd'hui avec détails
        presences_today = Presence.objects.filter(
            employe=user,
            scan_time__gte=today_start
        ).select_related('patient', 'patient__client').order_by('-scan_time')
        
        # Grouper les présences par patient pour calculer le statut de progression
        patient_progress = {}
        for presence in presences_today:
            patient_id = presence.patient.id
            if patient_id not in patient_progress:
                patient_progress[patient_id] = {
                    'patient_id': patient_id,
                    'patient_name': f"{presence.patient.first_name} {presence.patient.last_name}",
                    'client_name': f"{presence.patient.client.first_name} {presence.patient.client.last_name}" if presence.patient.client else "N/A",
                    'has_arrival': False,
                    'has_departure': False,
                    'last_presence': presence,
                    'arrival_time': None,
                    'departure_time': None,
                    'duration_hours': None,
                }
            
            # Mettre à jour les statuts
            if presence.status == 'ARRIVEE':
                patient_progress[patient_id]['has_arrival'] = True
                if not patient_progress[patient_id]['arrival_time'] or presence.scan_time > patient_progress[patient_id]['arrival_time']:
                    patient_progress[patient_id]['arrival_time'] = presence.scan_time
            elif presence.status == 'DEPART':
                patient_progress[patient_id]['has_departure'] = True
                if not patient_progress[patient_id]['departure_time'] or presence.scan_time > patient_progress[patient_id]['departure_time']:
                    patient_progress[patient_id]['departure_time'] = presence.scan_time
                    patient_progress[patient_id]['duration_hours'] = presence.duration if presence.duration else None
            
            # Garder la présence la plus récente
            if presence.scan_time > patient_progress[patient_id]['last_presence'].scan_time:
                patient_progress[patient_id]['last_presence'] = presence
        
        # Construire la liste des visites avec le statut de progression
        visits_list = []
        for patient_id, progress_data in patient_progress.items():
            # Calculer le pourcentage de progression
            if progress_data['has_arrival'] and progress_data['has_departure']:
                progress_percentage = 100
                mission_status = "terminée"
            elif progress_data['has_arrival']:
                progress_percentage = 50
                mission_status = "en cours"
            else:
                progress_percentage = 0
                mission_status = "non commencée"
            
            # Utiliser la dernière présence pour les détails d'affichage
            last_presence = progress_data['last_presence']
            visits_list.append({
                'id': last_presence.id,
                'patient_id': patient_id,
                'patient_name': progress_data['patient_name'],
                'client_name': progress_data['client_name'],
                'status': last_presence.status,
                'scan_time': last_presence.scan_time,
                'duration_hours': progress_data['duration_hours'],
                'progress_percentage': progress_percentage,
                'mission_status': mission_status,
            })
        
        # Trier par heure de scan (plus récent en premier)
        visits_list.sort(key=lambda x: x['scan_time'], reverse=True)
        
        # Patients à visiter (non visités aujourd'hui)
        patients_visited_ids = set(patient_progress.keys())
        patients_to_visit_list = []
        for patient in assigned_patients:
            if patient.id not in patients_visited_ids:
                patients_to_visit_list.append({
                    'id': patient.id,
                    'first_name': patient.first_name,
                    'last_name': patient.last_name,
                    'phone': patient.phone,
                    'address': patient.address,
                    'client_name': f"{patient.client.first_name} {patient.client.last_name}" if patient.client else "N/A",
                })
        
        # Patients déjà visités aujourd'hui avec détails
        patients_visited_list = []
        for patient_id, progress_data in patient_progress.items():
            patients_visited_list.append({
                'id': patient_id,
                'patient_name': progress_data['patient_name'],
                'client_name': progress_data['client_name'],
                'has_arrival': progress_data['has_arrival'],
                'has_departure': progress_data['has_departure'],
                'arrival_time': progress_data['arrival_time'],
                'departure_time': progress_data['departure_time'],
                'duration_hours': progress_data['duration_hours'],
                'progress_percentage': 100 if (progress_data['has_arrival'] and progress_data['has_departure']) else 50,
                'mission_status': "terminée" if (progress_data['has_arrival'] and progress_data['has_departure']) else "en cours",
                'last_scan_time': progress_data['last_presence'].scan_time,
            })
        
        # Trier les patients visités par dernière activité (plus récent en premier)
        patients_visited_list.sort(key=lambda x: x['last_scan_time'], reverse=True)
        
        return Response({
            'total_patients': total_patients,
            'patients_visited_today': patients_visited_today,
            'patients_to_visit_count': len(patients_to_visit_list),
            'total_visits_today': total_visits_today,
            'total_visits_week': total_visits_week,
            'recent_presences': visits_list,
            'patients_to_visit': patients_to_visit_list,
            'patients_visited': patients_visited_list,
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsEmploye])
    def update_notes(self, request, pk=None):
        """Permet à un employé de modifier uniquement les notes d'une présence"""
        try:
            presence = self.get_object()
        except Presence.DoesNotExist:
            return Response(
                {'error': 'Présence non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que l'employé est bien le propriétaire de cette présence
        if presence.employe != request.user:
            return Response(
                {'error': 'Vous n\'avez pas la permission de modifier cette présence'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupérer uniquement le champ notes
        notes = request.data.get('notes', '')
        
        # Mettre à jour uniquement les notes (pas l'heure)
        presence.notes = notes
        presence.save(update_fields=['notes'])
        
        # Retourner la présence mise à jour
        serializer = self.get_serializer(presence)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdminOrAdmin])
    def realtime(self, request):
        """Endpoint pour le dashboard temps réel des présences"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Présences du jour
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_presences = Presence.objects.filter(
            scan_time__gte=today_start
        ).select_related('patient', 'employe', 'patient__client').order_by('-scan_time')
        
        # Statistiques
        total_scans = today_presences.count()
        arrivals = today_presences.filter(status='ARRIVEE').count()
        departures = today_presences.filter(status='DEPART').count()
        
        # Employés actifs (avec arrivée sans départ) et missions terminées
        active_employees = []
        completed_missions = []
        
        # Récupérer toutes les arrivées d'aujourd'hui
        arrivals_today = today_presences.filter(status='ARRIVEE').order_by('scan_time')
        
        # Récupérer tous les départs d'aujourd'hui
        departures_today = today_presences.filter(status='DEPART').order_by('scan_time')
        
        # Créer un dictionnaire pour mapper rapidement les départs aux arrivées
        # Clé: (patient_id, employe_id), Valeur: liste des départs triés par heure
        departures_map = {}
        for departure in departures_today:
            key = (departure.patient.id, departure.employe.id)
            if key not in departures_map:
                departures_map[key] = []
            departures_map[key].append(departure)
        
        # Traiter chaque arrivée
        for arrival in arrivals_today:
            key = (arrival.patient.id, arrival.employe.id)
            
            # Chercher le premier départ après cette arrivée
            departure = None
            if key in departures_map:
                for dep in departures_map[key]:
                    if dep.scan_time > arrival.scan_time:
                        departure = dep
                        break
            
            mission_data = {
                'employe': arrival.employe.username,
                'employe_matricule': arrival.employe.matricule,
                'patient': f"{arrival.patient.first_name} {arrival.patient.last_name}",
                'patient_id': arrival.patient.id,
                'arrival_time': arrival.scan_time,
                'arrival_id': arrival.id,
                'arrival_notes': arrival.notes or '',  # Notes de l'arrivée
            }
            
            if departure:
                # Mission terminée - ajouter les coordonnées GPS
                mission_data['departure_time'] = departure.scan_time
                mission_data['departure_id'] = departure.id
                mission_data['departure_notes'] = departure.notes or ''  # Notes du départ
                mission_data['arrival_latitude'] = float(arrival.latitude) if arrival.latitude else None
                mission_data['arrival_longitude'] = float(arrival.longitude) if arrival.longitude else None
                mission_data['departure_latitude'] = float(departure.latitude) if departure.latitude else None
                mission_data['departure_longitude'] = float(departure.longitude) if departure.longitude else None
                mission_data['mission_status'] = 'TERMINEE'
                mission_data['duration_hours'] = round((departure.scan_time - arrival.scan_time).total_seconds() / 3600, 2)
                completed_missions.append(mission_data)
            else:
                # Mission en cours - vérifier aussi dans toutes les présences (pas seulement aujourd'hui)
                # au cas où le départ serait dans une autre journée
                departure_anytime = Presence.objects.filter(
                    patient=arrival.patient,
                    employe=arrival.employe,
                    status='DEPART',
                    scan_time__gt=arrival.scan_time
                ).order_by('scan_time').first()
                
                if not departure_anytime:
                    # Mission en cours - ajouter les coordonnées GPS de l'arrivée
                    mission_data['mission_status'] = 'EN_COURS'
                    mission_data['duration_hours'] = round((timezone.now() - arrival.scan_time).total_seconds() / 3600, 2)
                    mission_data['arrival_latitude'] = float(arrival.latitude) if arrival.latitude else None
                    mission_data['arrival_longitude'] = float(arrival.longitude) if arrival.longitude else None
                    active_employees.append(mission_data)
                else:
                    # Mission terminée (départ dans une autre journée)
                    mission_data['departure_time'] = departure_anytime.scan_time
                    mission_data['departure_id'] = departure_anytime.id
                    mission_data['departure_notes'] = departure_anytime.notes or ''  # Notes du départ
                    mission_data['departure_latitude'] = float(departure_anytime.latitude) if departure_anytime.latitude else None
                    mission_data['departure_longitude'] = float(departure_anytime.longitude) if departure_anytime.longitude else None
                    mission_data['mission_status'] = 'TERMINEE'
                    mission_data['duration_hours'] = round((departure_anytime.scan_time - arrival.scan_time).total_seconds() / 3600, 2)
                    completed_missions.append(mission_data)
        
        # Alertes (retards, absences, etc.)
        alerts = []
        # TODO: Implémenter la logique d'alertes selon les besoins
        
        return Response({
            'total_scans': total_scans,
            'arrivals': arrivals,
            'departures': departures,
            'active_employees': active_employees,
            'completed_missions': completed_missions,
            'alerts': alerts,
            'recent_presences': PresenceSerializer(today_presences[:20], many=True, context={'request': request}).data
        })

    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdminOrAdmin])
    def dashboard_stats(self, request):
        """Statistiques d'évolution par employé pour les graphiques du dashboard.
        Paramètres: period = 7 | 30 | 90 (jours), défaut 30
        """
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count, Q
        from django.db.models.functions import TruncDate

        period = int(request.query_params.get('period', 30))
        period = min(max(period, 7), 365)

        end_date = timezone.now()
        start_date = end_date - timedelta(days=period)

        presences = Presence.objects.filter(scan_time__gte=start_date).select_related('employe')

        # ── Liste des employés actifs sur la période ──────────────────────────
        employees_qs = (
            presences
            .filter(status='ARRIVEE')
            .values('employe__id', 'employe__username', 'employe__first_name', 'employe__last_name')
            .annotate(total=Count('id'))  # force GROUP BY sur tous les champs
            .order_by('employe__id')
        )
        seen_ids = set()
        employees = []
        for e in employees_qs:
            if e['employe__id'] in seen_ids:
                continue
            seen_ids.add(e['employe__id'])
            name = f"{e['employe__first_name'] or ''} {e['employe__last_name'] or ''}".strip() or e['employe__username']
            employees.append({'id': e['employe__id'], 'name': name})

        # ── Scans par jour et par employé ─────────────────────────────────────
        daily_by_emp = (
            presences
            .filter(status='ARRIVEE')
            .annotate(date=TruncDate('scan_time'))
            .values('date', 'employe__id')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Indexer : {date: {employe_id: count}}
        emp_date_map: dict = {}
        for row in daily_by_emp:
            d = row['date']
            if d not in emp_date_map:
                emp_date_map[d] = {}
            emp_date_map[d][row['employe__id']] = row['count']

        # Construire la liste evolution avec une clé par employé
        evolution = []
        current = start_date.date()
        while current <= end_date.date():
            point: dict = {'date': current.strftime('%d/%m')}
            day_data = emp_date_map.get(current, {})
            for emp in employees:
                point[emp['name']] = day_data.get(emp['id'], 0)
            evolution.append(point)
            current += timedelta(days=1)

        # ── Résumé global ─────────────────────────────────────────────────────
        total_arrivals = presences.filter(status='ARRIVEE').count()
        total_departures = presences.filter(status='DEPART').count()
        unique_employees = presences.values('employe').distinct().count()
        unique_patients = presences.values('patient').distinct().count()

        return Response({
            'period': period,
            'evolution': evolution,
            'employees': [e['name'] for e in employees],
            'summary': {
                'total_arrivals': total_arrivals,
                'total_departures': total_departures,
                'unique_employees': unique_employees,
                'unique_patients': unique_patients,
            },
        })


class EmployeeProfileViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """ViewSet pour EmployeeProfile"""
    module_name = 'employes'
    queryset = EmployeeProfile.objects.select_related('user').all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsSuperAdminOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__username', 'user__email', 'user__matricule',
        'user__first_name', 'user__last_name',
        'poste_fonction', 'service_departement', 'numero_employe_interne'
    ]
    filterset_fields = ['statut_compte', 'type_contrat', 'temps_travail', 'statut_documents']
    ordering_fields = ['created_at', 'date_debut_contrat', 'user__username']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrage selon le rôle"""
        user = self.request.user
        queryset = EmployeeProfile.objects.select_related('user').all()
        
        if user.is_superadmin:
            return queryset
        elif user.is_admin:
            return queryset
        else:
            return EmployeeProfile.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Création avec vérification que l'utilisateur est un employé"""
        try:
            user = serializer.validated_data.get('user')
            if user and hasattr(user, 'role') and user.role != 'EMPLOYE':
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Le profil employé ne peut être créé que pour un utilisateur avec le rôle EMPLOYE.")
            serializer.save()
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Erreur lors de la création du profil: {str(e)}")
    
    def perform_update(self, serializer):
        """Mise à jour avec gestion des erreurs"""
        try:
            serializer.save()
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Erreur lors de la mise à jour du profil: {str(e)}")


class ContactMessageViewSet(ModulePermissionMixin, viewsets.ModelViewSet):
    """Messages de contact entrants — création publique, lecture admin seulement"""
    module_name = 'messages'
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ContactMessage.objects.none()
        if getattr(user, 'role', None) not in ('ADMIN', 'SUPERADMIN'):
            return ContactMessage.objects.none()
        return ContactMessage.objects.all()

    def partial_update(self, request, *args, **kwargs):
        """Permet de mettre à jour uniquement le statut"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class HeroContentView(generics.RetrieveUpdateAPIView):
    """Endpoint singleton GET/PATCH pour le contenu hero de la page d'accueil"""
    serializer_class = HeroContentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self):
        obj, _ = HeroContent.objects.get_or_create(id=1)
        return obj


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Journal d'activité — lecture seule, SUPERADMIN uniquement"""
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'object_repr', 'detail', 'model_name']
    filterset_fields = ['action', 'model_name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        from api.models import ActivityLog
        user = self.request.user
        if getattr(user, 'role', None) != 'SUPERADMIN':
            return ActivityLog.objects.none()
        qs = ActivityLog.objects.select_related('user').all()
        # Filtres optionnels via query params
        model_name = self.request.query_params.get('model_name')
        action = self.request.query_params.get('action')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        if model_name:
            qs = qs.filter(model_name__icontains=model_name)
        if action:
            qs = qs.filter(action=action)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(object_repr__icontains=search) |
                Q(detail__icontains=search) |
                Q(model_name__icontains=search) |
                Q(user__username__icontains=search)
            )
        return qs


# ── Décorateur de vérification de permissions granulaires ─────────────────────

def check_module_permission(module, action):
    """
    Décorateur pour les actions de ViewSet.
    Vérifie UserPermission en DB. SUPERADMIN passe toujours.
    Retourne 403 avec message clair si refusé.
    """
    from functools import wraps

    def decorator(view_func):
        @wraps(view_func)
        def wrapped(self, request, *args, **kwargs):
            user = request.user
            if not user or not user.is_authenticated:
                from rest_framework.exceptions import NotAuthenticated
                raise NotAuthenticated()
            # SUPERADMIN : accès total
            if getattr(user, 'role', None) == 'SUPERADMIN':
                return view_func(self, request, *args, **kwargs)
            # Vérification permission DB
            if not UserPermission.has_permission(user, module, action):
                from rest_framework.exceptions import PermissionDenied
                MODULE_LABELS = dict(UserPermission.MODULE_CHOICES)
                ACTION_LABELS = dict(UserPermission.ACTION_CHOICES)
                mod_label = MODULE_LABELS.get(module, module)
                act_label = ACTION_LABELS.get(action, action)
                raise PermissionDenied(
                    detail={
                        "code": "permission_denied",
                        "message": f"Vous n'avez pas la permission d'effectuer cette action.",
                        "module": module,
                        "module_label": mod_label,
                        "action": action,
                        "action_label": act_label,
                    }
                )
            return view_func(self, request, *args, **kwargs)
        return wrapped
    return decorator


# ── ViewSet gestion des permissions (SUPERADMIN) ──────────────────────────────

class UserPermissionViewSet(viewsets.ViewSet):
    """Gestion des permissions — SUPERADMIN pour list/update, ADMIN pour lire ses propres droits"""
    from .permissions import IsSuperAdmin

    def get_permissions(self):
        from .permissions import IsSuperAdmin, IsAdmin
        # Un admin peut lire ses propres permissions (endpoint retrieve avec son propre ID)
        if self.action in ('retrieve', 'my_permissions'):
            return [IsAdmin()]
        return [IsSuperAdmin()]

    def list(self, request):
        """Liste tous les admins avec leurs permissions (SUPERADMIN)"""
        users = CustomUser.objects.filter(role='ADMIN').order_by('username')
        data = UserWithPermissionsSerializer(users, many=True).data
        return Response(data)

    def retrieve(self, request, pk=None):
        """Permissions d'un utilisateur — un admin peut lire les siennes, SUPERADMIN peut lire celles de n'importe qui"""
        user = request.user
        # Un ADMIN ne peut lire que ses propres permissions
        if user.role == 'ADMIN' and str(user.pk) != str(pk):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        try:
            target = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserWithPermissionsSerializer(target)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='me')
    def my_permissions(self, request):
        """Retourne les permissions de l'utilisateur connecté"""
        serializer = UserWithPermissionsSerializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request, pk=None):
        """Met à jour toutes les permissions d'un utilisateur en une seule requête"""
        try:
            user = CustomUser.objects.get(pk=pk, role='ADMIN')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

        permissions_data = request.data.get('permissions', [])
        for item in permissions_data:
            module = item.get('module')
            action_name = item.get('action')
            granted = item.get('granted', False)
            if module and action_name:
                UserPermission.objects.update_or_create(
                    user=user,
                    module=module,
                    action=action_name,
                    defaults={'granted': granted}
                )
        serializer = UserWithPermissionsSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='schema')
    def schema(self, request):
        """Retourne les modules et actions disponibles"""
        return Response({
            'modules': [{'value': v, 'label': l} for v, l in UserPermission.MODULE_CHOICES],
            'actions': [{'value': v, 'label': l} for v, l in UserPermission.ACTION_CHOICES],
        })


# ── Corbeille (Trash) ──────────────────────────────────────────────────────────

class TrashViewSet(viewsets.ViewSet):
    """Corbeille — liste et gestion des éléments soft-supprimés"""
    permission_classes = [IsAuthenticated]

    TRASH_MODELS = {
        'devis':       (QuoteRequest,  QuoteRequestSerializer),
        'factures':    (Invoice,       InvoiceSerializer),
        'services':    (Service,       ServiceSerializer),
        'agences':     (Agency,        AgencySerializer),
        'patients':    (Patient,       PatientSerializer),
        'scans':       (Presence,      PresenceSerializer),
        'categories':  (Category,      CategorySerializer),
        'contacts':    (Contact,       ContactSerializer),
    }

    LABELS = {
        'devis':      'Devis',
        'factures':   'Factures',
        'services':   'Services',
        'agences':    'Agences',
        'patients':   'Patients',
        'scans':      'Scans',
        'categories': 'Catégories',
        'contacts':   'Contacts',
    }

    def _require_admin(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Non authentifié'}, status=401)
        role = getattr(request.user, 'role', None)
        if role not in ('ADMIN', 'SUPERADMIN'):
            return Response({'error': 'Accès refusé'}, status=403)
        return None

    def list(self, request):
        """Liste tous les éléments supprimés groupés par type"""
        err = self._require_admin(request)
        if err:
            return err
        result = {}
        for key, (Model, Serializer) in self.TRASH_MODELS.items():
            deleted = Model.objects.filter(deleted_at__isnull=False).order_by('-deleted_at')
            items = []
            for obj in deleted:
                s = Serializer(obj, context={'request': request})
                d = dict(s.data)
                d['_trash_type'] = key
                d['_trash_label'] = self.LABELS[key]
                d['_deleted_at'] = obj.deleted_at.isoformat() if obj.deleted_at else None
                # Nom lisible
                if hasattr(obj, 'client_name'):
                    d['_display_name'] = str(obj.client_name)
                elif hasattr(obj, 'first_name'):
                    d['_display_name'] = f"{obj.first_name} {obj.last_name}".strip()
                elif hasattr(obj, 'name'):
                    d['_display_name'] = str(obj.name)
                elif hasattr(obj, 'invoice_number'):
                    d['_display_name'] = str(obj.invoice_number or obj.id)
                else:
                    d['_display_name'] = str(obj)
                items.append(d)
            result[key] = items
        return Response(result)

    @action(detail=False, methods=['post'], url_path=r'restore/(?P<model>[^/.]+)/(?P<pk>[0-9]+)')
    def restore(self, request, model=None, pk=None):
        """Restaurer un élément"""
        err = self._require_admin(request)
        if err:
            return err
        if model not in self.TRASH_MODELS:
            return Response({'error': 'Modèle inconnu'}, status=400)
        Model, _ = self.TRASH_MODELS[model]
        try:
            instance = Model.objects.get(pk=pk, deleted_at__isnull=False)
            instance.deleted_at = None
            instance.save(update_fields=['deleted_at'])
            return Response({'success': True})
        except Model.DoesNotExist:
            return Response({'error': 'Élément non trouvé dans la corbeille'}, status=404)

    @action(detail=False, methods=['post', 'delete'], url_path=r'hard-delete/(?P<model>[^/.]+)/(?P<pk>[0-9]+)')
    def hard_delete(self, request, model=None, pk=None):
        """Supprimer définitivement un élément"""
        err = self._require_admin(request)
        if err:
            return err
        if model not in self.TRASH_MODELS:
            return Response({'error': 'Modèle inconnu'}, status=400)
        Model, _ = self.TRASH_MODELS[model]
        try:
            instance = Model.objects.get(pk=pk, deleted_at__isnull=False)
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Model.DoesNotExist:
            return Response({'error': 'Élément non trouvé dans la corbeille'}, status=404)

    @action(detail=False, methods=['post'], url_path='restore-all')
    def restore_all(self, request):
        """Restaurer tous les éléments"""
        err = self._require_admin(request)
        if err:
            return err
        for Model, _ in self.TRASH_MODELS.values():
            Model.objects.filter(deleted_at__isnull=False).update(deleted_at=None)
        return Response({'success': True})

    @action(detail=False, methods=['post', 'delete'], url_path='empty')
    def empty(self, request):
        """Vider définitivement la corbeille"""
        err = self._require_admin(request)
        if err:
            return err
        for Model, _ in self.TRASH_MODELS.values():
            Model.objects.filter(deleted_at__isnull=False).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
