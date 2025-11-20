"""
Vues d'authentification supplémentaires
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


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

