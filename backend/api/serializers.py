from rest_framework import serializers
from .models import CustomUser, Service, Agency, Contact, PageContent, Category, ServiceReview, ServiceFAQ, QuoteRequest, ServiceAdvantage, SiteSettings, Invoice, QuoteFormStep, QuoteFormOption, Patient, Presence, EmployeeProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour CustomUser"""
    password = serializers.CharField(
        write_only=True,
        required=False  # Pas requis pour les mises à jour
    )
    role = serializers.ChoiceField(
        choices=CustomUser.ROLE_CHOICES,
        default='CLIENT'
    )
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'password', 'first_name',
            'last_name', 'role', 'matricule', 'phone', 'created_by', 'created_by_username',
            'date_joined', 'created_at'
        ]
        read_only_fields = ['date_joined', 'created_at', 'created_by']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'matricule': {'required': False, 'allow_blank': True, 'allow_null': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Le mot de passe est requis pour la création.'})
        
        user = CustomUser(**validated_data)
        # Validation du mot de passe seulement si pas en DEBUG
        from django.conf import settings
        from django.contrib.auth.password_validation import validate_password
        if not settings.DEBUG:
            validate_password(password)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Mise à jour avec gestion du mot de passe"""
        password = validated_data.pop('password', None)
        
        # Mettre à jour les autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mettre à jour le mot de passe si fourni
        if password:
            from django.conf import settings
            from django.contrib.auth.password_validation import validate_password
            if not settings.DEBUG:
                validate_password(password)
            instance.set_password(password)
        
        instance.save()
        return instance


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


class QuoteFormOptionSerializer(serializers.ModelSerializer):
    """Serializer pour QuoteFormOption avec support hiérarchique"""
    sub_options = serializers.SerializerMethodField()
    
    class Meta:
        model = QuoteFormOption
        fields = ['id', 'step', 'parent', 'label', 'value', 'price', 'price_enabled', 'order', 'active', 'allow_custom_text', 'sub_options']
    
    def get_sub_options(self, obj):
        """Récupère récursivement les sous-options actives"""
        sub_options = obj.sub_options.filter(active=True).order_by('order')
        return QuoteFormOptionSerializer(sub_options, many=True).data


class QuoteFormStepSerializer(serializers.ModelSerializer):
    """Serializer pour QuoteFormStep"""
    options = QuoteFormOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuoteFormStep
        fields = [
            'id', 'service', 'step_type', 'title', 'description', 'order',
            'required', 'field_key', 'active', 'options', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuoteRequestSerializer(serializers.ModelSerializer):
    """Serializer pour QuoteRequest"""
    service_name = serializers.SerializerMethodField()
    service_slug = serializers.SerializerMethodField()
    
    def get_service_name(self, obj):
        return obj.service.name if obj.service else None
    
    def get_service_slug(self, obj):
        return obj.service.slug if obj.service else None
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
            'additional_info', 'calculated_price', 'discount_percentage', 'status', 'status_display',
            'admin_notes', 'contacted_at', 'quoted_at',
            'created_at', 'updated_at', 'created_by_user'
        ]
        read_only_fields = ['created_at', 'updated_at', 'contacted_at', 'quoted_at']
        extra_kwargs = {
            'service': {'required': False, 'allow_null': True},
        }
    
    def create(self, validated_data):
        """Création d'une demande de devis avec calcul automatique du prix"""
        from decimal import Decimal
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by_user'] = request.user
        validated_data['status'] = 'PENDING'
        
        # Récupérer calculated_price depuis les données initiales (avant validation)
        # car il peut ne pas être dans validated_data si le champ n'est pas explicitement défini
        initial_data = getattr(self, 'initial_data', {})
        calculated_price_from_frontend = initial_data.get('calculated_price') or validated_data.get('calculated_price')
        
        if calculated_price_from_frontend:
            # Utiliser le prix calculé depuis le frontend
            try:
                # Convertir en Decimal si c'est une chaîne ou un nombre
                if isinstance(calculated_price_from_frontend, str):
                    price_decimal = Decimal(calculated_price_from_frontend)
                elif isinstance(calculated_price_from_frontend, (int, float)):
                    price_decimal = Decimal(str(calculated_price_from_frontend))
                else:
                    price_decimal = calculated_price_from_frontend
                
                # S'assurer que le prix est positif
                if price_decimal > 0:
                    validated_data['calculated_price'] = price_decimal
                else:
                    # Si prix = 0, calculer depuis les options
                    validated_data['calculated_price'] = self._calculate_price_from_options(validated_data)
            except (ValueError, TypeError, Exception) as e:
                # Si erreur de conversion, calculer depuis les options
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Erreur lors de la conversion du prix: {e}")
                validated_data['calculated_price'] = self._calculate_price_from_options(validated_data)
        else:
            # Calculer le prix depuis les choix du formulaire
            validated_data['calculated_price'] = self._calculate_price_from_options(validated_data)
        
        return super().create(validated_data)
    
    def _calculate_price_from_options(self, validated_data):
        """Calcule le prix depuis les options du formulaire"""
        from decimal import Decimal
        
        additional_info = validated_data.get('additional_info', {})
        calculated_price = Decimal('0.00')
        
        if validated_data.get('service'):
            service = validated_data['service']
            
            # Ajouter le prix de base du service si défini
            if service.price_per_hour:
                calculated_price += Decimal(str(service.price_per_hour))
            
            # Récupérer les étapes du formulaire pour ce service
            steps = QuoteFormStep.objects.filter(
                service=service,
                active=True
            ).prefetch_related('options')
            
            for step in steps:
                field_key = step.field_key
                if field_key in additional_info:
                    value = additional_info[field_key]
                    
                    # Si c'est une liste (choix multiples)
                    if isinstance(value, list):
                        for val in value:
                            option = step.options.filter(value=val, active=True).first()
                            if option and option.price_enabled and option.price:
                                calculated_price += Decimal(str(option.price))
                    # Si c'est une valeur unique
                    elif value:
                        option = step.options.filter(value=value, active=True).first()
                        if option and option.price_enabled and option.price:
                            calculated_price += Decimal(str(option.price))
        
        return calculated_price


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer pour Invoice"""
    quote_request_id = serializers.IntegerField(source='quote_request.id', read_only=True)
    client_name = serializers.CharField(source='quote_request.client_name', read_only=True)
    client_email = serializers.CharField(source='quote_request.client_email', read_only=True)
    service_name = serializers.CharField(source='quote_request.service.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'quote_request', 'quote_request_id', 'invoice_number',
            'subtotal', 'tax_rate', 'tax_amount', 'total', 'currency',
            'invoice_date', 'due_date', 'notes', 'payment_terms',
            'client_name', 'client_email', 'service_name',
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'invoice_number']
    
    def create(self, validated_data):
        """Création d'une facture avec génération automatique du numéro et du prix"""
        from decimal import Decimal
        from django.utils import timezone
        
        quote_request = validated_data.get('quote_request')
        
        # Si invoice_date n'est pas fourni, utiliser la date du jour
        if 'invoice_date' not in validated_data or not validated_data.get('invoice_date'):
            validated_data['invoice_date'] = timezone.now().date()
        
        # Si le subtotal n'est pas fourni ou est 0, calculer depuis le service ou le calculated_price
        if not validated_data.get('subtotal') or validated_data.get('subtotal') == Decimal('0.00'):
            # D'abord essayer avec calculated_price du quote_request
            if quote_request and hasattr(quote_request, 'calculated_price') and quote_request.calculated_price:
                try:
                    calculated_price = Decimal(str(quote_request.calculated_price))
                    if calculated_price > 0:
                        validated_data['subtotal'] = calculated_price
                except (ValueError, TypeError):
                    pass
            
            # Si toujours 0, essayer avec le service
            if (not validated_data.get('subtotal') or validated_data.get('subtotal') == Decimal('0.00')):
                if quote_request and quote_request.service:
                    service = quote_request.service
                    if service.price_per_hour:
                        validated_data['subtotal'] = Decimal(str(service.price_per_hour))
                    # Si pas de prix, laisser 0.00 pour que l'admin puisse le modifier
        
        # S'assurer que subtotal est un Decimal
        if 'subtotal' in validated_data:
            if not isinstance(validated_data['subtotal'], Decimal):
                validated_data['subtotal'] = Decimal(str(validated_data['subtotal']))
        
        # Calculer tax_amount si tax_rate est fourni
        tax_rate = validated_data.get('tax_rate', Decimal('0.00'))
        if not isinstance(tax_rate, Decimal):
            tax_rate = Decimal(str(tax_rate))
        
        subtotal = validated_data.get('subtotal', Decimal('0.00'))
        if tax_rate > 0:
            validated_data['tax_amount'] = (subtotal * tax_rate) / 100
        else:
            validated_data['tax_amount'] = Decimal('0.00')
        
        # Calculer le total
        validated_data['total'] = subtotal + validated_data['tax_amount']
        
        # S'assurer que currency a une valeur par défaut
        if 'currency' not in validated_data or not validated_data.get('currency'):
            validated_data['currency'] = 'EUR'
        
        # Le numéro de facture sera généré automatiquement dans save()
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
            'banner_bg_color', 'banner_text_color', 'banner_button_color', 'banner_button_border_color',
            'footer_bg_color', 'footer_text_color', 'footer_link_color',
            'footer_link_hover_color', 'footer_border_color',
            'button_border_color', 'button_border_width', 'button_border_radius',
            'button_outline_border_color', 'button_outline_text_color', 'button_outline_hover_bg_color',
            'site_name_part1_color', 'site_name_part2_color', 'site_tagline_color',
            'services_bg_color', 'services_text_color', 'services_button_color', 'services_button_border_color',
            'agencies_bg_color', 'agencies_text_color', 'agencies_button_color', 'agencies_button_border_color',
            'employe_bg_color', 'employe_text_color', 'employe_button_color', 'employe_button_border_color',
            'admin_login_bg_color', 'admin_login_text_color', 'admin_login_button_color', 'admin_login_button_border_color',
            'employe_login_bg_color', 'employe_login_text_color', 'employe_login_button_color', 'employe_login_button_border_color',
            'logo', 'logo_url', 'logo_favicon', 'logo_favicon_url',
            'site_name', 'site_tagline',
            'smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl',
            'smtp_username', 'smtp_password',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'smtp_host': {'required': False, 'allow_blank': True, 'allow_null': True},
            'smtp_port': {'required': False},
            'smtp_use_tls': {'required': False},
            'smtp_use_ssl': {'required': False},
            'smtp_username': {'required': False, 'allow_blank': True, 'allow_null': True},
            'smtp_password': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def to_representation(self, instance):
        """Gérer la lecture des champs SMTP même s'ils n'existent pas encore"""
        data = super().to_representation(instance)
        
        # Vérifier si les champs SMTP existent et gérer les erreurs
        smtp_fields = {
            'smtp_host': None,
            'smtp_port': 587,
            'smtp_use_tls': True,
            'smtp_use_ssl': False,
            'smtp_username': None,
            'smtp_password': None,
        }
        
        for field, default_value in smtp_fields.items():
            if field not in data:
                try:
                    value = getattr(instance, field, default_value)
                    data[field] = value
                except (AttributeError, Exception):
                    data[field] = default_value
        
        return data
    
    def to_internal_value(self, data):
        """Gérer l'écriture des champs SMTP même s'ils n'existent pas encore dans le modèle"""
        # Vérifier si les champs SMTP existent dans le modèle
        smtp_exist = hasattr(SiteSettings, 'smtp_host')
        
        # Si les champs SMTP n'existent pas, les retirer des données avant validation
        # mais on les garde dans validated_data pour les sauvegarder après migration
        if not smtp_exist:
            # Créer une copie des données pour ne pas modifier l'original
            data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
            # Stocker les valeurs SMTP pour plus tard
            self._smtp_data = {}
            smtp_fields = ['smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password']
            for field in smtp_fields:
                if field in data_copy:
                    self._smtp_data[field] = data_copy.pop(field)
            data = data_copy
        
        return super().to_internal_value(data)
    
    def update(self, instance, validated_data):
        """Mettre à jour l'instance en gérant les champs SMTP"""
        # Vérifier si les champs SMTP existent dans le modèle
        smtp_exist = hasattr(SiteSettings, 'smtp_host')
        smtp_fields = ['smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password']
        
        # Extraire les champs SMTP de validated_data
        smtp_data = {}
        for field in smtp_fields:
            if field in validated_data:
                smtp_data[field] = validated_data.pop(field)
        
        # Si on a des données SMTP stockées depuis to_internal_value, les utiliser
        if hasattr(self, '_smtp_data') and self._smtp_data:
            smtp_data.update(self._smtp_data)
        
        # Mettre à jour les autres champs
        instance = super().update(instance, validated_data)
        
        # Mettre à jour les champs SMTP si ils existent
        if smtp_exist and smtp_data:
            for field, value in smtp_data.items():
                try:
                    setattr(instance, field, value)
                except (AttributeError, Exception):
                    # Le champ n'existe pas encore, ignorer
                    pass
            instance.save()
        
        return instance
    
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


class PatientSerializer(serializers.ModelSerializer):
    """Serializer pour Patient"""
    client_username = serializers.CharField(source='client.username', read_only=True)
    qr_code_image_url = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_employees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=CustomUser.objects.filter(role='EMPLOYE'),
        required=False
    )
    assigned_employees_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'client', 'client_username', 'first_name', 'last_name',
            'phone', 'address', 'qr_code', 'qr_code_image', 'qr_code_image_url',
            'is_active', 'created_by', 'created_by_username',
            'assigned_employees', 'assigned_employees_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['qr_code', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Création avec gestion du ManyToManyField assigned_employees"""
        try:
            assigned_employees = validated_data.pop('assigned_employees', [])
            # S'assurer que assigned_employees est une liste
            if assigned_employees is None:
                assigned_employees = []
            # Filtrer les valeurs None ou invalides
            assigned_employees = [emp for emp in assigned_employees if emp is not None]
            
            patient = Patient.objects.create(**validated_data)
            
            # Essayer d'assigner les employés si le champ existe
            try:
                if assigned_employees and hasattr(patient, 'assigned_employees'):
                    patient.assigned_employees.set(assigned_employees)
            except Exception as e:
                # Si le champ n'existe pas encore, ignorer l'erreur
                import traceback
                print(f"Attention: impossible d'assigner les employés (champ peut-être absent): {str(e)}")
                print(traceback.format_exc())
            
            return patient
        except Exception as e:
            import traceback
            print(f"Erreur dans PatientSerializer.create: {str(e)}")
            print(traceback.format_exc())
            raise serializers.ValidationError(f"Erreur lors de la création du patient: {str(e)}")
    
    def update(self, instance, validated_data):
        """Mise à jour avec gestion du ManyToManyField assigned_employees"""
        try:
            assigned_employees = validated_data.pop('assigned_employees', None)
            
            # Mettre à jour les champs normaux
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Mettre à jour les employés assignés si fournis
            if assigned_employees is not None:
                # Si c'est une liste vide, vider les assignations
                if isinstance(assigned_employees, list):
                    # Filtrer les valeurs None ou invalides
                    assigned_employees = [emp for emp in assigned_employees if emp is not None]
                    instance.assigned_employees.set(assigned_employees)
                else:
                    # Si c'est un seul élément, le convertir en liste
                    instance.assigned_employees.set([assigned_employees] if assigned_employees else [])
            
            return instance
        except Exception as e:
            import traceback
            print(f"Erreur dans PatientSerializer.update: {str(e)}")
            print(traceback.format_exc())
            raise
    
    def get_assigned_employees_info(self, obj):
        """Retourne les informations des employés assignés"""
        try:
            # Vérifier si le champ assigned_employees existe
            if hasattr(obj, 'assigned_employees'):
                employees = []
                for emp in obj.assigned_employees.all():
                    try:
                        employees.append({
                            'id': emp.id,
                            'username': getattr(emp, 'username', ''),
                            'matricule': getattr(emp, 'matricule', ''),
                            'first_name': getattr(emp, 'first_name', ''),
                            'last_name': getattr(emp, 'last_name', ''),
                        })
                    except Exception:
                        continue
                return employees
            return []
        except Exception as e:
            # Si erreur (champ n'existe pas encore), retourner liste vide
            import traceback
            print(f"Erreur dans get_assigned_employees_info: {str(e)}")
            print(traceback.format_exc())
            return []
    
    def get_qr_code_image_url(self, obj):
        """Retourne l'URL de l'image QR code - masquée pour les employés"""
        # Vérifier si l'utilisateur est un employé
        request = self.context.get('request')
        if request and hasattr(request.user, 'role') and request.user.role == 'EMPLOYE':
            # Les employés ne voient pas l'image du QR code
            return None
        
        if obj.qr_code_image:
            # Vérifier si le fichier existe physiquement
            import os
            from django.conf import settings
            
            file_path = os.path.join(settings.MEDIA_ROOT, obj.qr_code_image.name)
            if not os.path.exists(file_path):
                # Le fichier n'existe pas, essayer de le régénérer
                try:
                    obj.generate_qr_image()
                    obj.refresh_from_db()
                except Exception as e:
                    # Si la régénération échoue, retourner None
                    print(f"Erreur lors de la régénération du QR code pour le patient {obj.id}: {str(e)}")
                    return None
            
            request = self.context.get('request')
            if request:
                try:
                    # Construire l'URL absolue
                    url = request.build_absolute_uri(obj.qr_code_image.url)
                    return url
                except Exception:
                    # Fallback si build_absolute_uri échoue
                    return obj.qr_code_image.url
            return obj.qr_code_image.url
        return None


class PresenceSerializer(serializers.ModelSerializer):
    """Serializer pour Presence"""
    patient_name = serializers.SerializerMethodField()
    patient_qr_code = serializers.CharField(source='patient.qr_code', read_only=True)
    employe_username = serializers.CharField(source='employe.username', read_only=True)
    employe_matricule = serializers.CharField(source='employe.matricule', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Presence
        fields = [
            'id', 'patient', 'patient_name', 'patient_qr_code',
            'employe', 'employe_username', 'employe_matricule',
            'status', 'scan_time', 'latitude', 'longitude', 'notes',
            'duration_hours'
        ]
        read_only_fields = []
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"
    
    def get_duration_hours(self, obj):
        duration = obj.duration
        if duration:
            return round(duration, 2)
        return None


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Serializer pour EmployeeProfile"""
    user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role='EMPLOYE'),
        required=True,
        allow_null=False
    )
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_matricule = serializers.CharField(source='user.matricule', read_only=True)
    photo_profil_url = serializers.SerializerMethodField()
    signature_url = serializers.SerializerMethodField()
    contrat_signe_url = serializers.SerializerMethodField()
    avenants_url = serializers.SerializerMethodField()
    clause_non_concurrence_url = serializers.SerializerMethodField()
    note_information_url = serializers.SerializerMethodField()
    piece_identite_url = serializers.SerializerMethodField()
    diplomes_certifications_url = serializers.SerializerMethodField()
    documents_administratifs_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'user_username', 'user_email', 'user_matricule',
            # Identité
            'sexe', 'date_naissance', 'nationalite', 'photo_profil', 'photo_profil_url',
            'signature', 'signature_url',
            # Coordonnées
            'email_professionnel', 'email_personnel', 'telephone_principal',
            'telephone_secondaire', 'adresse_numero_rue', 'adresse_ville',
            'adresse_code_postal', 'adresse_pays',
            # Authentification & sécurité
            'statut_compte', 'derniere_connexion', 'tentatives_connexion_echouees',
            'appareil_utilise', 'ip_derniere_connexion',
            # Informations professionnelles
            'poste_fonction', 'service_departement', 'type_contrat',
            'date_debut_contrat', 'date_fin_contrat', 'temps_travail',
            'taux_horaire', 'salaire', 'mode_paiement',
            'numero_securite_sociale', 'numero_employe_interne',
            # Documents
            'contrat_signe', 'contrat_signe_url', 'avenants', 'avenants_url',
            'clause_non_concurrence', 'clause_non_concurrence_url',
            'note_information', 'note_information_url',
            'piece_identite', 'piece_identite_url',
            'diplomes_certifications', 'diplomes_certifications_url',
            'documents_administratifs', 'documents_administratifs_url',
            'date_signature_electronique', 'statut_documents',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'derniere_connexion']
    
    def get_photo_profil_url(self, obj):
        if obj.photo_profil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_profil.url)
            return obj.photo_profil.url
        return None
    
    def get_signature_url(self, obj):
        if obj.signature:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.signature.url)
            return obj.signature.url
        return None
    
    def get_contrat_signe_url(self, obj):
        if obj.contrat_signe:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.contrat_signe.url)
            return obj.contrat_signe.url
        return None
    
    def get_avenants_url(self, obj):
        if obj.avenants:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avenants.url)
            return obj.avenants.url
        return None
    
    def get_clause_non_concurrence_url(self, obj):
        if obj.clause_non_concurrence:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.clause_non_concurrence.url)
            return obj.clause_non_concurrence.url
        return None
    
    def get_note_information_url(self, obj):
        if obj.note_information:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.note_information.url)
            return obj.note_information.url
        return None
    
    def get_piece_identite_url(self, obj):
        if obj.piece_identite:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.piece_identite.url)
            return obj.piece_identite.url
        return None
    
    def get_diplomes_certifications_url(self, obj):
        if obj.diplomes_certifications:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.diplomes_certifications.url)
            return obj.diplomes_certifications.url
        return None
    
    def get_documents_administratifs_url(self, obj):
        if obj.documents_administratifs:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.documents_administratifs.url)
            return obj.documents_administratifs.url
        return None
