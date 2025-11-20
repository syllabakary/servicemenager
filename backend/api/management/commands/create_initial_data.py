"""
Commande Django pour créer les données initiales
Usage: python manage.py create_initial_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Service, Agency, Contact, PageContent, Category
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Crée les données initiales (superadmin, admin, services, agences, etc.)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Création des données initiales...'))
        
        # 1. Créer superadmin
        if not User.objects.filter(username='superadmin').exists():
            superadmin = User.objects.create_user(
                username='superadmin',
                email='super@local.test',
                password='superadmin',
                role='SUPERADMIN',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Superadmin créé: {superadmin.username}'))
        else:
            self.stdout.write(self.style.WARNING('Superadmin existe déjà'))
            superadmin = User.objects.get(username='superadmin')
        
        # 2. Créer admin
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_user(
                username='admin',
                email='admin@local.test',
                password='admin',
                role='ADMIN',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Admin créé: {admin.username}'))
        else:
            admin = User.objects.get(username='admin')
            # S'assurer que l'admin a is_staff=True
            if not admin.is_staff:
                admin.is_staff = True
                admin.save()
            self.stdout.write(self.style.WARNING('Admin existe déjà'))
        
        # Donner toutes les permissions à l'admin (même s'il existe déjà)
        from django.contrib.contenttypes.models import ContentType
        from django.contrib.auth.models import Permission
        
        # Permissions pour tous les modèles de l'app api
        models_to_permit = ['service', 'agency', 'contact', 'pagecontent', 'customuser', 'category']
        total_perms = 0
        
        for model_name in models_to_permit:
            try:
                content_type = ContentType.objects.get(app_label='api', model=model_name)
                permissions = Permission.objects.filter(content_type=content_type)
                admin.user_permissions.add(*permissions)
                total_perms += permissions.count()
            except ContentType.DoesNotExist:
                pass
        
        # Donner aussi les permissions pour les sessions et autres si besoin
        try:
            # Permissions pour les groupes (si on veut gérer les groupes)
            content_type = ContentType.objects.get(app_label='auth', model='group')
            permissions = Permission.objects.filter(content_type=content_type)
            admin.user_permissions.add(*permissions)
            total_perms += permissions.count()
        except:
            pass
        
        self.stdout.write(self.style.SUCCESS(f'✓ {total_perms} permissions ajoutées à l\'admin'))
        
        # 3. Créer catégories par défaut
        categories_data = [
            {
                'name': "Garde d'enfants",
                'show_in_navbar': True,
                'order': 1
            },
            {
                'name': 'Ménage et repassage',
                'show_in_navbar': True,
                'order': 2
            },
            {
                'name': 'Jardinage',
                'show_in_navbar': True,
                'order': 3
            },
            {
                'name': 'Peinture',
                'show_in_navbar': True,
                'order': 4
            },
            {
                'name': 'Sécurité',
                'show_in_navbar': True,
                'order': 5
            },
            {
                'name': 'Déménagement',
                'show_in_navbar': True,
                'order': 6
            },
        ]
        
        categories_dict = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories_dict[cat_data['name']] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Catégorie créée: {category.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Catégorie existe déjà: {category.name}'))
        
        # 4. Créer client
        if not User.objects.filter(username='client').exists():
            client = User.objects.create_user(
                username='client',
                email='client@local.test',
                password='client',
                role='CLIENT'
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Client créé: {client.username}'))
        else:
            self.stdout.write(self.style.WARNING('Client existe déjà'))
        
        # 5. Créer services
        services_data = [
            {
                'name': 'Nettoyage résidentiel',
                'slug': 'nettoyage-residentiel',
                'short_description': 'Un service complet pour que votre maison brille du sol au plafond.',
                'detailed_description': 'Nos professionnels utilisent des produits écologiques et des techniques éprouvées pour un résultat impeccable. Chaque intervention est personnalisée selon vos besoins spécifiques.',
                'active': True,
                'order': 1,
                'category': categories_dict.get('Ménage et repassage')
            },
            {
                'name': 'Garde d\'enfants à domicile',
                'slug': 'garde-enfants-domicile',
                'short_description': 'Des nounous qualifiées et bienveillantes pour prendre soin de vos petits trésors.',
                'detailed_description': 'Service premium de garde d\'enfants à domicile, flexible et sécurisé. Nos nounous sont formées et certifiées.',
                'active': False,
                'order': 2,
                'category': categories_dict.get("Garde d'enfants")
            }
        ]
        
        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                slug=service_data['slug'],
                defaults={**service_data, 'created_by': admin}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Service créé: {service.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Service existe déjà: {service.name}'))
        
        # 6. Créer agences
        agencies_data = [
            {
                'name': 'Agence Paris',
                'slug': 'agence-paris',
                'address': '123 Avenue des Champs-Élysées',
                'city': 'Paris',
                'postal_code': '75008',
                'phone': '+33 1 23 45 67 89',
                'email': 'paris@serviceslocaux.ci',
                'latitude': Decimal('48.8566'),
                'longitude': Decimal('2.3522'),
                'active': True,
                'details': 'Notre siège social à Paris, au cœur de la capitale française.'
            },
            {
                'name': 'Agence Abidjan',
                'slug': 'agence-abidjan',
                'address': '456 Boulevard de la République',
                'city': 'Abidjan',
                'postal_code': '01 BP 1234',
                'phone': '+225 01 23 45 67 89',
                'email': 'abidjan@serviceslocaux.ci',
                'latitude': Decimal('5.3600'),
                'longitude': Decimal('-4.0083'),
                'active': True,
                'details': 'Notre agence principale en Côte d\'Ivoire.'
            }
        ]
        
        for agency_data in agencies_data:
            agency, created = Agency.objects.get_or_create(
                slug=agency_data['slug'],
                defaults={**agency_data, 'created_by': admin}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Agence créée: {agency.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Agence existe déjà: {agency.name}'))
        
        # 7. Créer contact siège
        agency_paris = Agency.objects.get(slug='agence-paris')
        contact, created = Contact.objects.get_or_create(
            is_headquarter=True,
            defaults={
                'name': 'Contact Siège Paris',
                'role': 'Directeur Général',
                'phone': '+33 1 23 45 67 89',
                'email': 'contact@serviceslocaux.ci',
                'agency': agency_paris,
                'is_headquarter': True,
                'address': '123 Avenue des Champs-Élysées, 75008 Paris',
                'created_by': admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Contact siège créé: {contact.name}'))
        else:
            self.stdout.write(self.style.WARNING('Contact siège existe déjà'))
        
        # 8. Créer page content
        page, created = PageContent.objects.get_or_create(
            key='home_banner',
            defaults={
                'title': 'Bande annonce',
                'body': 'Réduisez votre facture de moitié avec l\'avance immédiate de crédit d\'impôt*',
                'is_active': True,
                'order': 1,
                'created_by': admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Page content créé: {page.key}'))
        else:
            self.stdout.write(self.style.WARNING('Page content existe déjà'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ Données initiales créées avec succès!'))
        self.stdout.write(self.style.SUCCESS('\nIdentifiants:'))
        self.stdout.write(self.style.SUCCESS('  Superadmin: superadmin / superadmin'))
        self.stdout.write(self.style.SUCCESS('  Admin: admin / admin'))
        self.stdout.write(self.style.SUCCESS('  Client: client / client'))

