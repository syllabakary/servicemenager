"""
Signals Django — capture automatique de toutes les actions CRUD sur les modèles principaux.
L'utilisateur est résolu via le middleware CurrentUserMiddleware (thread-local).
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out


def get_watched():
    from api.models import (
        CustomUser, Category, Service, Agency, QuoteRequest,
        Invoice, ServiceReview, Patient, Presence, EmployeeProfile,
        ContactMessage, HeroContent, SiteSettings, ServiceAdvantage,
        ServiceFAQ,
    )
    return [
        (CustomUser,       "Utilisateur"),
        (Category,         "Catégorie"),
        (Service,          "Service"),
        (Agency,           "Agence"),
        (QuoteRequest,     "Devis"),
        (Invoice,          "Facture"),
        (ServiceReview,    "Avis client"),
        (Patient,          "Patient"),
        (Presence,         "Présence"),
        (EmployeeProfile,  "Profil employé"),
        (ContactMessage,   "Message contact"),
        (HeroContent,      "Contenu Hero"),
        (SiteSettings,     "Paramètres site"),
        (ServiceAdvantage, "Avantage"),
        (ServiceFAQ,       "FAQ service"),
    ]


def log_action(action, instance, model_name, detail=""):
    """Enregistre une action dans ActivityLog avec l'user et l'IP de la requête courante."""
    try:
        from api.models import ActivityLog
        from api.middleware import get_current_user, get_current_ip
        user = get_current_user()
        ip = get_current_ip()
        ActivityLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(instance.pk) if instance.pk else "",
            object_repr=str(instance)[:300],
            detail=detail,
            ip_address=ip,
        )
    except Exception:
        pass


def make_save_handler(model_name):
    def handler(sender, instance, created, **kwargs):
        action = "CREATE" if created else "UPDATE"
        detail = f"{'Création' if created else 'Modification'} de {model_name} #{instance.pk}"
        log_action(action, instance, model_name, detail)
    return handler


def make_delete_handler(model_name):
    def handler(sender, instance, **kwargs):
        log_action(
            "DELETE", instance, model_name,
            f"Suppression de {model_name} #{instance.pk} : {str(instance)[:200]}"
        )
    return handler


def connect_signals():
    for model, name in get_watched():
        post_save.connect(make_save_handler(name), sender=model, weak=False)
        post_delete.connect(make_delete_handler(name), sender=model, weak=False)


@receiver(user_logged_in)
def on_login(sender, request, user, **kwargs):
    try:
        from api.models import ActivityLog
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        ActivityLog.objects.create(
            user=user,
            action="LOGIN",
            model_name="Utilisateur",
            object_id=str(user.pk),
            object_repr=user.username,
            detail=f"Connexion de {user.username} ({user.get_full_name() or user.email})",
            ip_address=ip or None,
        )
    except Exception:
        pass


@receiver(user_logged_out)
def on_logout(sender, request, user, **kwargs):
    try:
        from api.models import ActivityLog
        if user:
            ActivityLog.objects.create(
                user=user,
                action="LOGOUT",
                model_name="Utilisateur",
                object_id=str(user.pk),
                object_repr=user.username,
                detail=f"Déconnexion de {user.username}",
            )
    except Exception:
        pass
