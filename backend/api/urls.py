from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, AgenceViewSet, QuoteViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'agencies', AgenceViewSet, basename='agence')
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'contact', ContactViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]




