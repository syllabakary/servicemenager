from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, ServiceViewSet, AgencyViewSet,
    ContactViewSet, PageContentViewSet, NavbarViewSet, CategoryViewSet,
    ServiceReviewViewSet, ServiceFAQViewSet, QuoteRequestViewSet, ServiceAdvantageViewSet
)
from .views_auth import register

router = DefaultRouter()
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
router.register(r'meta', NavbarViewSet, basename='meta')

urlpatterns = [
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration
    path('register/', register, name='register'),
    
    # Router URLs
    path('', include(router.urls)),
    
    # Endpoint navbar direct
    path('navbar/', NavbarViewSet.as_view({'get': 'list'}), name='navbar'),
    path('meta/navbar/', NavbarViewSet.as_view({'get': 'list'}), name='meta-navbar'),
]
