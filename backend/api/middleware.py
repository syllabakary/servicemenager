"""
Middleware + Handler de logging pour ActivityLog.
- CurrentUserMiddleware : stocke user/IP dans thread-local (accessible par signals)
- ErrorLogMiddleware   : capture les exceptions 500
- DatabaseLogHandler  : handler Python logging qui écrit dans ActivityLog (pas de console)
- drf_exception_handler: custom DRF handler qui logue les erreurs 400/403/404/etc.
"""
import threading
import traceback
import logging

_thread_local = threading.local()


# ── Thread-local helpers ──────────────────────────────────────────────────────

def get_current_user():
    return getattr(_thread_local, 'user', None)

def get_current_ip():
    return getattr(_thread_local, 'ip', None)


# ── Middleware : résolution JWT + stockage thread-local ───────────────────────

class CurrentUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user is None or not user.is_authenticated:
            user = self._resolve_jwt_user(request)

        _thread_local.user = user if (user and getattr(user, 'is_authenticated', False)) else None

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        _thread_local.ip = ip or None

        response = self.get_response(request)

        _thread_local.user = None
        _thread_local.ip = None
        return response

    def _resolve_jwt_user(self, request):
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if not auth_header.startswith('Bearer '):
                return None
            token = auth_header.split(' ', 1)[1]
            from rest_framework_simplejwt.tokens import AccessToken
            from api.models import CustomUser
            decoded = AccessToken(token)
            user_id = decoded.get('user_id')
            if user_id:
                return CustomUser.objects.get(pk=user_id)
        except Exception:
            pass
        return None


# ── Middleware : capture exceptions 500 ──────────────────────────────────────

class ErrorLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        try:
            from api.models import ActivityLog
            tb = traceback.format_exc()
            detail = (
                f"{request.method} {request.path}\n"
                f"Exception: {type(exception).__name__}: {str(exception)}\n\n"
                f"Traceback:\n{tb}"
            )
            ActivityLog.objects.create(
                user=get_current_user(),
                action="ERROR",
                level="ERROR",
                logger_name="django.request",
                model_name="Erreur système",
                object_repr=f"{type(exception).__name__}: {str(exception)[:200]}",
                detail=detail,
                ip_address=get_current_ip(),
                extra={
                    "method": request.method,
                    "path": request.path,
                    "exception_type": type(exception).__name__,
                    "exception_msg": str(exception),
                }
            )
        except Exception:
            pass
        return None


# ── Custom DRF exception handler → logue les erreurs 4xx ─────────────────────

def drf_exception_handler(exc, context):
    """
    Custom DRF exception handler : logue toutes les erreurs API (400, 403, 404, etc.)
    dans ActivityLog, puis délègue à la réponse DRF standard.
    """
    from rest_framework.views import exception_handler as drf_default_handler
    from rest_framework import exceptions as drf_exc

    response = drf_default_handler(exc, context)

    # Ne logger que les erreurs qui ont une réponse DRF (pas les 500 non gérées,
    # déjà capturées par ErrorLogMiddleware)
    if response is None:
        return response

    try:
        from api.models import ActivityLog
        import json

        request = context.get('request')
        view = context.get('view')

        status_code = response.status_code
        # Ignorer les 401 non authentifiés (trop de bruit) sauf si on veut les voir
        if status_code == 401:
            return response

        # Déterminer le niveau
        if status_code >= 500:
            level = "ERROR"
        elif status_code == 403:
            level = "WARNING"
        elif status_code == 400:
            level = "WARNING"
        else:
            level = "INFO"

        # Construire le détail
        try:
            errors_str = json.dumps(response.data, ensure_ascii=False, indent=2)
        except Exception:
            errors_str = str(response.data)

        method = request.method if request else "?"
        path = request.path if request else "?"
        detail = (
            f"{method} {path} → {status_code}\n"
            f"Erreur: {type(exc).__name__}: {str(exc)}\n\n"
            f"Détail de validation:\n{errors_str}"
        )

        view_name = view.__class__.__name__ if view else "?"
        user = get_current_user() if request else None
        ip = get_current_ip() if request else None

        ActivityLog.objects.create(
            user=user,
            action="ERROR",
            level=level,
            logger_name="api.validation",
            model_name=view_name,
            object_repr=f"{type(exc).__name__} {status_code}: {str(exc)[:200]}",
            detail=detail,
            ip_address=ip,
            extra={
                "method": method,
                "path": path,
                "status_code": status_code,
                "exception_type": type(exc).__name__,
                "view": view_name,
            }
        )
    except Exception:
        pass

    return response


# ── Handler Python logging → ActivityLog ─────────────────────────────────────

# Mapping niveau Python → action ActivityLog
_LEVEL_TO_ACTION = {
    logging.DEBUG:    "OTHER",
    logging.INFO:     "OTHER",
    logging.WARNING:  "OTHER",
    logging.ERROR:    "ERROR",
    logging.CRITICAL: "ERROR",
}

# Loggers internes à ignorer pour éviter les boucles infinies
_IGNORED_LOGGERS = {
    'django.db.backends',
    'django.db',
}


class DatabaseLogHandler(logging.Handler):
    """
    Handler Python logging qui persiste chaque log record dans ActivityLog.
    Utilise le thread-local pour associer l'user/IP de la requête courante.
    """

    def emit(self, record):
        # Éviter les boucles infinies et les logs DB trop verbeux
        if record.name in _IGNORED_LOGGERS or record.name.startswith('django.db'):
            return

        try:
            from api.models import ActivityLog

            level_name = record.levelname  # DEBUG, INFO, WARNING, ERROR, CRITICAL
            action = _LEVEL_TO_ACTION.get(record.levelno, "OTHER")

            # Message principal
            message = self.format(record)

            # Traceback si présent
            tb_str = ""
            if record.exc_info:
                tb_str = "\n\nTraceback:\n" + "".join(traceback.format_exception(*record.exc_info))

            detail = message + tb_str

            # Extra : données supplémentaires utiles
            extra_data = {
                "module": record.module,
                "funcName": record.funcName,
                "lineno": record.lineno,
                "pathname": record.pathname,
            }
            if record.exc_info and record.exc_info[1]:
                extra_data["exception_type"] = type(record.exc_info[1]).__name__
                extra_data["exception_msg"] = str(record.exc_info[1])

            ActivityLog.objects.create(
                user=get_current_user(),
                action=action,
                level=level_name,
                logger_name=record.name,
                model_name=record.module or "",
                object_repr=record.getMessage()[:300],
                detail=detail,
                ip_address=get_current_ip(),
                extra=extra_data,
            )
        except Exception:
            # Ne jamais crasher depuis un handler de log
            pass
