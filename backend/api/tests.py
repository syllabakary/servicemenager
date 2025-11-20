from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from .models import Service, Agency, Contact, PageContent

User = get_user_model()


class ServiceAPITestCase(TestCase):
    """Tests pour l'API Service"""
    
    def setUp(self):
        """Configuration initiale"""
        self.client = APIClient()
        
        # Création des utilisateurs
        self.superadmin = User.objects.create_user(
            username='superadmin',
            email='super@local.test',
            password='SuperPass123!',
            role='SUPERADMIN'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@local.test',
            password='AdminPass123!',
            role='ADMIN'
        )
        self.client_user = User.objects.create_user(
            username='client',
            email='client@local.test',
            password='ClientPass123!',
            role='CLIENT'
        )
        
        # Création de services
        self.service_active = Service.objects.create(
            name='Service Actif',
            slug='service-actif',
            short_description='Description courte',
            detailed_description='Description détaillée',
            active=True,
            order=1,
            created_by=self.admin
        )
        self.service_inactive = Service.objects.create(
            name='Service Inactif',
            slug='service-inactif',
            short_description='Description courte',
            detailed_description='Description détaillée',
            active=False,
            order=2,
            created_by=self.admin
        )
    
    def test_service_inactive_not_in_public_api(self):
        """Test : service inactif n'apparaît pas dans l'API publique"""
        response = self.client.get('/api/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        services = response.json()['results']
        service_ids = [s['id'] for s in services]
        self.assertIn(self.service_active.id, service_ids)
        self.assertNotIn(self.service_inactive.id, service_ids)
    
    def test_admin_can_see_inactive_services(self):
        """Test : admin peut voir les services inactifs"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        services = response.json()['results']
        service_ids = [s['id'] for s in services]
        self.assertIn(self.service_active.id, service_ids)
        self.assertIn(self.service_inactive.id, service_ids)
    
    def test_admin_can_toggle_service_active(self):
        """Test : admin peut activer/désactiver un service via PATCH"""
        self.client.force_authenticate(user=self.admin)
        
        # Désactiver
        response = self.client.patch(
            f'/api/services/{self.service_active.id}/toggle_active/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service_active.refresh_from_db()
        self.assertFalse(self.service_active.active)
        
        # Réactiver
        response = self.client.patch(
            f'/api/services/{self.service_active.id}/toggle_active/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service_active.refresh_from_db()
        self.assertTrue(self.service_active.active)
    
    def test_client_cannot_modify_service(self):
        """Test : client ne peut pas modifier un service"""
        self.client.force_authenticate(user=self.client_user)
        response = self.client.patch(
            f'/api/services/{self.service_active.id}/',
            {'name': 'Nouveau nom'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UserAPITestCase(TestCase):
    """Tests pour l'API User"""
    
    def setUp(self):
        """Configuration initiale"""
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            username='superadmin',
            email='super@local.test',
            password='SuperPass123!',
            role='SUPERADMIN'
        )
    
    def test_superadmin_can_create_admin(self):
        """Test : superadmin peut créer un admin"""
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post('/api/users/', {
            'username': 'newadmin',
            'email': 'newadmin@test.com',
            'password': 'AdminPass123!',
            'role': 'ADMIN'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_admin = User.objects.get(username='newadmin')
        self.assertEqual(new_admin.role, 'ADMIN')
    
    def test_public_registration_creates_client(self):
        """Test : inscription publique crée un client"""
        response = self.client.post('/api/users/', {
            'username': 'newclient',
            'email': 'newclient@test.com',
            'password': 'ClientPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_client = User.objects.get(username='newclient')
        self.assertEqual(new_client.role, 'CLIENT')


class NavbarAPITestCase(TestCase):
    """Tests pour l'endpoint navbar"""
    
    def setUp(self):
        """Configuration initiale"""
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@local.test',
            password='AdminPass123!',
            role='ADMIN'
        )
        
        # Services
        Service.objects.create(
            name='Service 1',
            slug='service-1',
            short_description='Desc',
            detailed_description='Desc détaillée',
            active=True,
            order=1,
            created_by=self.admin
        )
        Service.objects.create(
            name='Service 2',
            slug='service-2',
            short_description='Desc',
            detailed_description='Desc détaillée',
            active=False,
            order=2,
            created_by=self.admin
        )
        
        # Agences
        Agency.objects.create(
            name='Agence Paris',
            slug='agence-paris',
            address='123 Rue de Paris',
            city='Paris',
            active=True,
            latitude=Decimal('48.8566'),
            longitude=Decimal('2.3522'),
            created_by=self.admin
        )
        
        # PageContent
        PageContent.objects.create(
            key='home_banner',
            title='Bande annonce',
            body='Contenu',
            is_active=True,
            order=1,
            created_by=self.admin
        )
    
    def test_navbar_endpoint_structure(self):
        """Test : structure de l'endpoint navbar"""
        response = self.client.get('/api/navbar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('services', data)
        self.assertIn('agencies', data)
        self.assertIn('pages', data)
        
        # Vérifier que seuls les actifs sont retournés
        self.assertEqual(len(data['services']), 1)
        self.assertEqual(data['services'][0]['slug'], 'service-1')
        self.assertEqual(len(data['agencies']), 1)
        self.assertEqual(len(data['pages']), 1)


class AgencyProximityTestCase(TestCase):
    """Tests pour la recherche de proximité des agences"""
    
    def setUp(self):
        """Configuration initiale"""
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@local.test',
            password='AdminPass123!',
            role='ADMIN'
        )
        
        # Agence à Paris
        self.agency_paris = Agency.objects.create(
            name='Agence Paris',
            slug='agence-paris',
            address='Paris',
            city='Paris',
            active=True,
            latitude=Decimal('48.8566'),
            longitude=Decimal('2.3522'),
            created_by=self.admin
        )
        
        # Agence loin de Paris
        self.agency_lyon = Agency.objects.create(
            name='Agence Lyon',
            slug='agence-lyon',
            address='Lyon',
            city='Lyon',
            active=True,
            latitude=Decimal('45.7640'),
            longitude=Decimal('4.8357'),
            created_by=self.admin
        )
    
    def test_proximity_search(self):
        """Test : recherche par proximité"""
        # Recherche autour de Paris (48.8566, 2.3522) dans un rayon de 50km
        response = self.client.get(
            '/api/agencies/',
            {'lat': '48.8566', 'lng': '2.3522', 'radius_km': '50'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        agencies = response.json()['results']
        agency_ids = [a['id'] for a in agencies]
        self.assertIn(self.agency_paris.id, agency_ids)
        # Lyon est trop loin (environ 400km)
        self.assertNotIn(self.agency_lyon.id, agency_ids)

