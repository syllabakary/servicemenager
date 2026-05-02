from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class APIRootView(APIView):
    """Racine API — accessible uniquement aux admins authentifiés"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"detail": "Bienvenue sur l'API. Authentifiez-vous pour accéder aux ressources."})
from .views import (
    UserViewSet, ServiceViewSet, AgencyViewSet,
    ContactViewSet, PageContentViewSet, NavbarViewSet, CategoryViewSet,
    ServiceReviewViewSet, ServiceFAQViewSet, QuoteRequestViewSet, QuoteLineViewSet, ServiceAdvantageViewSet, InvoiceViewSet,
    SiteSettingsViewSet, QuoteFormStepViewSet, QuoteFormOptionViewSet, PatientViewSet, PresenceViewSet,
    EmployeeProfileViewSet, ContactMessageViewSet, HeroContentView,
    ActivityLogViewSet, UserPermissionViewSet, TrashViewSet
)
from .views_auth import register, login_with_matricule, logout, LoggedTokenObtainPairView

router = DefaultRouter(trailing_slash=True)
router.APIRootView = APIRootView
router.register(r'users', UserViewSet, basename='user')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'agencies', AgencyViewSet, basename='agency')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'pages', PageContentViewSet, basename='page')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'service-reviews', ServiceReviewViewSet, basename='service-review')
router.register(r'service-faqs', ServiceFAQViewSet, basename='service-faq')
router.register(r'service-advantages', ServiceAdvantageViewSet, basename='service-advantage')
router.register(r'quote-requests', QuoteRequestViewSet, basename='quote-request')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'quote-lines', QuoteLineViewSet, basename='quote-line')
router.register(r'quote-form-steps', QuoteFormStepViewSet, basename='quote-form-step')
router.register(r'quote-form-options', QuoteFormOptionViewSet, basename='quote-form-option')
router.register(r'site-settings', SiteSettingsViewSet, basename='site-settings')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'presences', PresenceViewSet, basename='presence')
router.register(r'employee-profiles', EmployeeProfileViewSet, basename='employee-profile')
router.register(r'meta', NavbarViewSet, basename='meta')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-message')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')
router.register(r'user-permissions', UserPermissionViewSet, basename='user-permission')
router.register(r'trash', TrashViewSet, basename='trash')

urlpatterns = [
    # JWT Authentication
    path('token/', LoggedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Déconnexion (blacklist du refresh token)
    path('logout/', logout, name='logout'),

    # Registration
    path('register/', register, name='register'),

    # Login par matricule (pour employés)
    path('login-matricule/', login_with_matricule, name='login_matricule'),
    
    # Router URLs
    path('', include(router.urls)),
    
    # Endpoint navbar direct
    path('navbar/', NavbarViewSet.as_view({'get': 'list'}), name='navbar'),
    path('meta/navbar/', NavbarViewSet.as_view({'get': 'list'}), name='meta-navbar'),

    # Contenu Hero page d'accueil (singleton)
    path('hero-content/', HeroContentView.as_view(), name='hero-content'),
]
