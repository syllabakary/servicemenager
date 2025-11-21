from rest_framework import serializers
from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest, ServiceAdvantage, SiteSettings


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour CustomUser"""
    password = serializers.CharField(
        write_only=True,
        required=True
    )
    role = serializers.ChoiceField(
        choices=CustomUser.ROLE_CHOICES,
        default='CLIENT'
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'password', 'first_name',
            'last_name', 'role', 'phone', 'date_joined', 'created_at'
        ]
        read_only_fields = ['date_joined', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        # Validation du mot de passe seulement si pas en DEBUG
        from django.conf import settings
        if not settings.DEBUG:
            validate_password(password)
        user.set_password(password)
        user.save()
        return user


class CategorySerializer(serializers.ModelSerializer):
    """Serializer pour Category"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'show_in_navbar', 'order']


class ServiceSummarySerializer(serializers.ModelSerializer):
    """Serializer léger pour navbar et listes"""
    url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'slug', 'url', 'order', 'category', 'category_name', 'image_url', 'short_description', 'detailed_description', 'duration', 'price_label', 'price_per_hour', 'rating', 'review_count', 'features']
    
    def get_url(self, obj):
        return obj.url
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class AgencySummarySerializer(serializers.ModelSerializer):
    """Serializer léger pour les agences dans les services"""
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = Agency
        fields = ['id', 'name', 'slug', 'city', 'url']
    
    def get_url(self, obj):
        return obj.url


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer complet pour Service"""
    url = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    agencies = AgencySummarySerializer(many=True, read_only=True)
    agencies_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Agency.objects.filter(active=True),
        source='agencies',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'slug', 'short_description', 'detailed_description',
            'image', 'image_url', 'active', 'order', 'category', 'category_name',
            'duration', 'price_per_hour', 'price_label', 'currency', 'contact_phone',
            'rating', 'review_count', 'show_reviews', 'show_faq',
            'included_services', 'features', 'guarantees', 'process_steps',
            'agencies', 'agencies_ids',
            'created_by', 'created_by_username', 'created_at', 'updated_at', 'url'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_url(self, obj):
        return obj.url
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class AgencySummarySerializer(serializers.ModelSerializer):
    """Serializer léger pour navbar et services"""
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = Agency
        fields = [
            'id', 'name', 'slug', 'url', 'city', 'latitude', 'longitude'
        ]
    
    def get_url(self, obj):
        return obj.url


class AgencySerializer(serializers.ModelSerializer):
    """Serializer complet pour Agency"""
    url = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    contacts_count = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    services_summary = serializers.SerializerMethodField()
    services_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.filter(active=True),
        source='services',
        write_only=True,
        required=False
    )
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Agency
        fields = [
            'id', 'name', 'slug', 'address', 'city', 'postal_code',
            'phone', 'email', 'latitude', 'longitude', 'active',
            'details', 'image', 'image_url', 'created_by', 'created_by_username',
            'contacts_count', 'services_count', 'services_summary', 'services_ids',
            'created_at', 'updated_at', 'url'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_url(self, obj):
        return obj.url
    
    def get_contacts_count(self, obj):
        return obj.contacts.count()
    
    def get_services_count(self, obj):
        return obj.services.filter(active=True).count()
    
    def get_services_summary(self, obj):
        services = obj.services.filter(active=True)[:5]  # Limiter à 5 services
        return ServiceSummarySerializer(services, many=True, context=self.context).data
    
    def get_services_count(self, obj):
        return obj.services.filter(active=True).count()
    
    def get_services_summary(self, obj):
        services = obj.services.filter(active=True)[:5]  # Limiter à 5 services
        return ServiceSummarySerializer(services, many=True, context=self.context).data


class ContactSerializer(serializers.ModelSerializer):
    """Serializer pour Contact"""
    agency_name = serializers.CharField(
        source='agency.name',
        read_only=True
    )
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'role', 'phone', 'email', 'agency',
            'agency_name', 'is_headquarter', 'address',
            'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class PageContentSummarySerializer(serializers.ModelSerializer):
    """Serializer léger pour navbar"""
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = PageContent
        fields = ['key', 'title', 'url']
    
    def get_url(self, obj):
        # URL basée sur la clé (ex: home_banner -> /)
        if obj.key == 'home_banner':
            return '/'
        return f'/{obj.key}/'


class PageContentSerializer(serializers.ModelSerializer):
    """Serializer complet pour PageContent"""
    url = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    
    class Meta:
        model = PageContent
        fields = [
            'id', 'key', 'title', 'body', 'is_active', 'order',
            'created_by', 'created_by_username',
            'created_at', 'updated_at', 'url'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_url(self, obj):
        if obj.key == 'home_banner':
            return '/'
        return f'/{obj.key}/'


class NavbarSerializer(serializers.Serializer):
    """Serializer pour l'endpoint navbar"""
    services = ServiceSummarySerializer(many=True)
    agencies = AgencySummarySerializer(many=True)
    pages = PageContentSummarySerializer(many=True)


class ServiceReviewSerializer(serializers.ModelSerializer):
    """Serializer pour ServiceReview"""
    service_name = serializers.CharField(
        source='service.name',
        read_only=True
    )
    
    class Meta:
        model = ServiceReview
        fields = [
            'id', 'service', 'service_name', 'user', 'rating', 'comment',
            'client_name', 'client_email', 'approved', 'display_on_page', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'user']
    
    def create(self, validated_data):
        """Création d'un avis (non approuvé par défaut)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        validated_data['approved'] = False  # Nécessite validation admin
        return super().create(validated_data)


class ServiceFAQSerializer(serializers.ModelSerializer):
    """Serializer pour ServiceFAQ"""
    service_name = serializers.CharField(
        source='service.name',
        read_only=True
    )
    
    class Meta:
        model = ServiceFAQ
        fields = [
            'id', 'service', 'service_name', 'question', 'answer',
            'order', 'active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ServiceAdvantageSerializer(serializers.ModelSerializer):
    """Serializer pour ServiceAdvantage"""
    
    class Meta:
        model = ServiceAdvantage
        fields = [
            'id', 'title', 'description', 'icon', 'order', 'active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuoteRequestSerializer(serializers.ModelSerializer):
    """Serializer pour QuoteRequest"""
    service_name = serializers.CharField(
        source='service.name',
        read_only=True
    )
    service_slug = serializers.CharField(
        source='service.slug',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = QuoteRequest
        fields = [
            'id', 'service', 'service_name', 'service_slug',
            'location', 'location_lat', 'location_lng',
            'client_name', 'client_email', 'client_phone',
            'additional_info', 'status', 'status_display',
            'admin_notes', 'contacted_at', 'quoted_at',
            'created_at', 'updated_at', 'created_by_user'
        ]
        read_only_fields = ['created_at', 'updated_at', 'contacted_at', 'quoted_at']
    
    def create(self, validated_data):
        """Création d'une demande de devis"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by_user'] = request.user
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer pour SiteSettings"""
    logo_url = serializers.SerializerMethodField()
    logo_favicon_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteSettings
        fields = [
            'id', 'primary_color', 'secondary_color', 'tertiary_color',
            'button_primary_color', 'button_primary_hover_color', 'button_text_color',
            'text_primary_color', 'text_link_color', 'text_link_hover_color',
            'logo', 'logo_url', 'logo_favicon', 'logo_favicon_url',
            'site_name', 'site_tagline', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_logo_favicon_url(self, obj):
        if obj.logo_favicon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo_favicon.url)
            return obj.logo_favicon.url
        return None
