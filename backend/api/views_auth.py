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
from django.utils import timezone
import logging
from .serializers import build_url

logger = logging.getLogger(__name__)
User = get_user_model()

MAX_FAILED_ATTEMPTS = 5

def get_lock_duration(user) -> int:
    """Durée de blocage progressive en minutes selon le nombre de blocages successifs."""
    attempts = user.failed_login_attempts
    if attempts < MAX_FAILED_ATTEMPTS * 2:
        return 15
    elif attempts < MAX_FAILED_ATTEMPTS * 3:
        return 30
    elif attempts < MAX_FAILED_ATTEMPTS * 4:
        return 60
    elif attempts < MAX_FAILED_ATTEMPTS * 5:
        return 120
    else:
        return 240


def get_ip(request):
    ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
    return ip or request.META.get('REMOTE_ADDR', None)


def _log_activity(user=None, action="LOGIN", level="INFO", object_repr="", detail="", ip=None):
    try:
        from api.models import ActivityLog
        ActivityLog.objects.create(
            user=user,
            action=action,
            level=level,
            model_name="Utilisateur",
            object_id=str(user.pk) if user else "",
            object_repr=object_repr,
            detail=detail,
            ip_address=ip or None,
        )
    except Exception:
        pass


def _send_new_ip_alert(user, ip):
    """Envoie un email à tous les SUPERADMIN quand un utilisateur se connecte depuis une nouvelle IP."""
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        admins = User.objects.filter(role='SUPERADMIN', email__isnull=False).exclude(email='')
        if not admins.exists():
            return
        subject = f"[EASE-DOM] Connexion depuis une nouvelle IP — {user.username}"
        message = (
            f"Bonjour,\n\n"
            f"L'utilisateur '{user.username}' ({user.get_full_name() or user.email}) "
            f"vient de se connecter depuis une nouvelle adresse IP.\n\n"
            f"Nouvelle IP : {ip}\n"
            f"Ancienne IP : {user.last_login_ip or 'inconnue'}\n"
            f"Date : {timezone.now().strftime('%d/%m/%Y à %H:%M:%S')}\n\n"
            f"Si cette connexion est légitime, ignorez ce message.\n"
            f"Sinon, bloquez le compte immédiatement depuis l'interface admin.\n\n"
            f"— Système EASE-DOM"
        )
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [a.email for a in admins],
            fail_silently=True,
        )
    except Exception:
        pass


def _handle_successful_login(user, ip):
    """Réinitialise les tentatives, détecte nouvelle IP, envoie alerte si besoin."""
    new_ip = ip != user.last_login_ip and user.last_login_ip is not None
    if new_ip:
        _send_new_ip_alert(user, ip)
        _log_activity(
            user=user, action="LOGIN", level="WARNING",
            object_repr=user.username,
            detail=f"Connexion depuis une NOUVELLE IP: {ip} (ancienne: {user.last_login_ip})",
            ip=ip,
        )
    else:
        _log_activity(
            user=user, action="LOGIN", level="INFO",
            object_repr=user.username,
            detail=f"Connexion de {user.username} ({user.get_full_name() or user.email})",
            ip=ip,
        )
    # Réinitialiser les tentatives + sauvegarder la nouvelle IP
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_ip = ip
    user.save(update_fields=['failed_login_attempts', 'locked_until', 'last_login_ip'])


def _handle_failed_login(user, ip, username_repr):
    """Incrémente les tentatives, bloque si nécessaire avec durée progressive, log l'échec."""
    user.failed_login_attempts += 1
    remaining = MAX_FAILED_ATTEMPTS - (user.failed_login_attempts % MAX_FAILED_ATTEMPTS)

    if user.failed_login_attempts % MAX_FAILED_ATTEMPTS == 0:
        lock_minutes = get_lock_duration(user)
        user.locked_until = timezone.now() + timezone.timedelta(minutes=lock_minutes)
        user.save(update_fields=['failed_login_attempts', 'locked_until'])
        _log_activity(
            user=user, action="LOGIN", level="WARNING",
            object_repr=username_repr,
            detail=(
                f"COMPTE BLOQUÉ {lock_minutes} min après {user.failed_login_attempts} tentatives "
                f"— utilisateur: '{username_repr}' | IP: {ip}"
            ),
            ip=ip,
        )
        logger.warning(f"[AUTH] COMPTE BLOQUÉ {lock_minutes}min — utilisateur: '{username_repr}' | IP: {ip}")
    else:
        user.save(update_fields=['failed_login_attempts', 'locked_until'])
        _log_activity(
            user=user, action="LOGIN", level="WARNING",
            object_repr=username_repr,
            detail=(
                f"ÉCHEC de connexion — {remaining} tentative(s) restante(s) avant blocage "
                f"— utilisateur: '{username_repr}' | IP: {ip}"
            ),
            ip=ip,
        )


class LoggedTokenObtainPairView(TokenObtainPairView):
    """TokenObtainPairView avec blocage de compte, alerte nouvelle IP et logging."""

    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '—')
        ip = get_ip(request)

        # Vérifier si le compte est bloqué avant même de tenter l'auth
        try:
            user_check = User.objects.get(username=username)
            if user_check.locked_until and user_check.locked_until > timezone.now():
                remaining = int((user_check.locked_until - timezone.now()).total_seconds() / 60) + 1
                return Response(
                    {'error': f'Compte temporairement bloqué. Réessayez dans {remaining} minute(s).'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            pass

        try:
            response = super().post(request, *args, **kwargs)
            logger.info(f"[AUTH] Connexion réussie — utilisateur: {username} | IP: {ip}")
            try:
                user = User.objects.get(username=username)
                _handle_successful_login(user, ip)
            except Exception:
                pass
            return response
        except Exception as e:
            logger.warning(
                f"[AUTH] ÉCHEC de connexion — utilisateur: '{username}' | IP: {ip} | Erreur: {type(e).__name__}"
            )
            try:
                user_obj = User.objects.get(username=username)
                _handle_failed_login(user_obj, ip, username)
                # Recharger pour avoir les valeurs à jour
                user_obj.refresh_from_db()
                remaining = MAX_FAILED_ATTEMPTS - (user_obj.failed_login_attempts % MAX_FAILED_ATTEMPTS)
                is_locked = user_obj.locked_until and user_obj.locked_until > timezone.now()
                if is_locked:
                    lock_minutes = int((user_obj.locked_until - timezone.now()).total_seconds() / 60) + 1
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed({
                        'error': 'locked',
                        'message': f"Compte bloqué pendant {lock_minutes} minute(s). Contactez un administrateur ou réessayez plus tard.",
                        'locked_until': user_obj.locked_until.isoformat(),
                        'lock_minutes': lock_minutes,
                    })
                else:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed({
                        'error': 'invalid_credentials',
                        'message': f"Identifiants incorrects. Il vous reste {remaining} tentative(s) avant blocage du compte.",
                        'remaining_attempts': remaining,
                    })
            except User.DoesNotExist:
                _log_activity(
                    user=None, action="LOGIN", level="WARNING",
                    object_repr=username,
                    detail=f"ÉCHEC de connexion — utilisateur inconnu: '{username}' | IP: {ip}",
                    ip=ip,
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

    from django.conf import settings
    if not settings.DEBUG:
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error': 'Mot de passe invalide', 'details': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role='CLIENT'
    )

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
    """
    matricule = request.data.get('matricule')
    password = request.data.get('password')

    if not matricule or not password:
        return Response(
            {'error': 'matricule et password sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    matricule = matricule.strip().upper()
    ip = get_ip(request)

    # Trouver l'utilisateur par matricule
    try:
        user = User.objects.get(matricule=matricule, role='EMPLOYE')
    except User.DoesNotExist:
        logger.warning(f"[AUTH] ÉCHEC login matricule — matricule: '{matricule}' | IP: {ip}")
        _log_activity(
            user=None, action="LOGIN", level="WARNING",
            object_repr=matricule,
            detail=f"ÉCHEC connexion employé — matricule inconnu: '{matricule}' | IP: {ip}",
            ip=ip,
        )
        return Response(
            {'error': 'Matricule ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Vérifier si le compte est bloqué
    if user.locked_until and user.locked_until > timezone.now():
        remaining = int((user.locked_until - timezone.now()).total_seconds() / 60) + 1
        return Response(
            {
                'error': 'locked',
                'message': f"Compte bloqué pendant {remaining} minute(s). Contactez un administrateur.",
                'lock_minutes': remaining,
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # Vérifier le mot de passe
    if not user.check_password(password):
        logger.warning(f"[AUTH] ÉCHEC login matricule — matricule: '{matricule}' | IP: {ip} | mot de passe incorrect")
        _handle_failed_login(user, ip, matricule)
        user.refresh_from_db()
        remaining_att = MAX_FAILED_ATTEMPTS - (user.failed_login_attempts % MAX_FAILED_ATTEMPTS)
        is_now_locked = user.locked_until and user.locked_until > timezone.now()
        if is_now_locked:
            lock_min = int((user.locked_until - timezone.now()).total_seconds() / 60) + 1
            return Response(
                {
                    'error': 'locked',
                    'message': f"Compte bloqué pendant {lock_min} minute(s). Contactez un administrateur.",
                    'lock_minutes': lock_min,
                },
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(
            {
                'error': 'invalid_credentials',
                'message': f"Identifiants incorrects. Il vous reste {remaining_att} tentative(s) avant blocage.",
                'remaining_attempts': remaining_att,
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Vérifier que l'utilisateur est actif
    if not user.is_active:
        return Response(
            {'error': 'Ce compte est désactivé'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Connexion réussie
    refresh = RefreshToken.for_user(user)
    _handle_successful_login(user, ip)

    # Récupérer la photo de profil depuis le profil employé si elle existe
    photo_url = None
    try:
        ep = user.employee_profile
        if ep.photo_profil:
            photo_url = build_url(ep.photo_profil.url, request)
    except Exception:
        pass

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'matricule': user.matricule,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'photo_url': photo_url,
        },
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    }, status=status.HTTP_200_OK)
