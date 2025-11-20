"""
Commande pour corriger les permissions de l'utilisateur admin
Usage: python manage.py fix_admin_permissions
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

User = get_user_model()


class Command(BaseCommand):
    help = 'Donne toutes les permissions à l\'utilisateur admin'

    def handle(self, *args, **options):
        try:
            admin = User.objects.get(username='admin')
            
            # S'assurer que is_staff est True
            if not admin.is_staff:
                admin.is_staff = True
                admin.save()
                self.stdout.write(self.style.SUCCESS('✓ is_staff activé pour admin'))
            
            # Donner toutes les permissions pour les modèles de l'app api
            models_to_permit = ['service', 'agency', 'contact', 'pagecontent', 'customuser']
            total_perms = 0
            
            for model_name in models_to_permit:
                try:
                    content_type = ContentType.objects.get(app_label='api', model=model_name)
                    permissions = Permission.objects.filter(content_type=content_type)
                    admin.user_permissions.add(*permissions)
                    total_perms += permissions.count()
                    self.stdout.write(self.style.SUCCESS(f'✓ Permissions ajoutées pour {model_name}'))
                except ContentType.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'⚠ Modèle {model_name} non trouvé'))
            
            # Donner aussi les permissions pour les groupes Django (si besoin)
            # Cela permet de gérer les groupes d'utilisateurs
            try:
                from django.contrib.auth.models import Group
                content_type = ContentType.objects.get(app_label='auth', model='group')
                permissions = Permission.objects.filter(content_type=content_type)
                admin.user_permissions.add(*permissions)
                total_perms += permissions.count()
                self.stdout.write(self.style.SUCCESS('✓ Permissions ajoutées pour les groupes'))
            except:
                pass
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ {total_perms} permissions au total ont été ajoutées à l\'utilisateur admin'))
            self.stdout.write(self.style.SUCCESS('✓ L\'admin peut maintenant accéder à tous les modèles dans l\'interface admin'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Utilisateur "admin" non trouvé. Exécutez d\'abord: python manage.py create_initial_data'))

