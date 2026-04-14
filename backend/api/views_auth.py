"""
Vues d'authentification supplémentaires
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class LoggedTokenObtainPairView(TokenObtainPairView):
    """TokenObtainPairView avec logging des tentatives de connexion échouées"""

    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '—')
        ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR', '—')
        )
        try:
            response = super().post(request, *args, **kwargs)
            logger.info(f"[AUTH] Connexion réussie — utilisateur: {username} | IP: {ip}")
            return response
        except Exception as e:
            logger.warning(
                f"[AUTH] ÉCHEC de connexion — utilisateur: '{username}' | IP: {ip} | Erreur: {type(e).__name__}"
            )
            raise


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Déconnexion : blackliste le refresh token pour l'invalider immédiatement.
    POST /api/logout/
    Body: { "refresh": "<refresh_token>" }
    """
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'refresh token requis'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        logger.info(f"[AUTH] Déconnexion — utilisateur: {request.user.username}")
        return Response({'detail': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
    except TokenError:
        return Response({'error': 'Token invalide ou déjà révoqué'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Endpoint d'inscription pour les clients
    POST /api/register/
    Body: {
        "username": "client",
        "email": "client@example.com",
        "password": "ClientPass123!",
        "first_name": "Prénom",
        "last_name": "Nom"
    }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response(
            {'error': 'username, email et password sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Ce nom d\'utilisateur existe déjà'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Cet email est déjà utilisé'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validation du mot de passe (seulement si pas en DEBUG)
    from django.conf import settings
    from django.contrib.auth.password_validation import validate_password
    if not settings.DEBUG:
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error': 'Mot de passe invalide', 'details': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Création de l'utilisateur (toujours CLIENT)
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role='CLIENT'
    )
    
    # Génération des tokens JWT
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_with_matricule(request):
    """
    Endpoint d'authentification par matricule pour les employés
    POST /api/login-matricule/
    Body: {
        "matricule": "EMP123456",
        "password": "MotDePasse123!"
    }
    """
    matricule = request.data.get('matricule')
    password = request.data.get('password')
    
    if not matricule or not password:
        return Response(
            {'error': 'matricule et password sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Normaliser le matricule (trim et uppercase)
    matricule = matricule.strip().upper()
    
    ip = (
        request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
        or request.META.get('REMOTE_ADDR', '—')
    )

    # Trouver l'utilisateur par matricule
    try:
        user = User.objects.get(matricule=matricule, role='EMPLOYE')
    except User.DoesNotExist:
        logger.warning(f"[AUTH] ÉCHEC login matricule — matricule: '{matricule}' | IP: {ip}")
        try:
            user_with_matricule = User.objects.get(matricule=matricule)
            return Response(
                {'error': f'Ce matricule existe mais n\'est pas associé à un employé (rôle: {user_with_matricule.role})'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Matricule ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    # Vérifier le mot de passe
    if not user.check_password(password):
        logger.warning(f"[AUTH] ÉCHEC login matricule — matricule: '{matricule}' | IP: {ip} | mot de passe incorrect")
        return Response(
            {'error': 'Matricule ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Vérifier que l'utilisateur est actif
    if not user.is_active:
        return Response(
            {'error': 'Ce compte est désactivé'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Génération des tokens JWT
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'matricule': user.matricule,
            'first_name': user.first_name,
            'last_name': user.last_name
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    }, status=status.HTTP_200_OK)

