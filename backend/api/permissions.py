from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permission pour superadmin uniquement"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'SUPERADMIN'
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAdmin(permissions.BasePermission):
    """Permission pour admin uniquement (créé par SuperAdmin)"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'SUPERADMIN']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsEmploye(permissions.BasePermission):
    """Permission pour employé uniquement"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'EMPLOYE'
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsClient(permissions.BasePermission):
    """Permission pour client uniquement"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'CLIENT'
    
    def has_object_permission(self, request, view, obj):
        # Le client peut voir ses propres données
        if hasattr(obj, 'client'):
            return obj.client == request.user
        return self.has_permission(request, view)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permission : admins peuvent modifier, autres en lecture seule (authentifiés uniquement)"""
    
    def has_permission(self, request, view):
        # Aucun accès sans authentification
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture réservée aux admins et superadmins
        return request.user.role in ['ADMIN', 'SUPERADMIN']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAdminOrPublicReadOnly(permissions.BasePermission):
    """Permission : admins peuvent modifier, lecture publique autorisée"""
    
    def has_permission(self, request, view):
        # Lecture autorisée pour tous (même non authentifiés)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture réservée aux admins et superadmins authentifiés
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.role in ['ADMIN', 'SUPERADMIN']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission : propriétaire ou admin/superadmin (authentifiés uniquement)"""
    
    def has_permission(self, request, view):
        # Aucun accès sans authentification
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        # Aucun accès sans authentification
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture : propriétaire, admin ou superadmin
        if hasattr(obj, 'created_by'):
            return (
                obj.created_by == request.user or
                request.user.role in ['ADMIN', 'SUPERADMIN']
            )
        
        # Si pas de created_by, seuls admins/superadmins
        return request.user.role in ['ADMIN', 'SUPERADMIN']


class IsClientOrReadOnly(permissions.BasePermission):
    """Permission : clients peuvent créer, lecture pour tous (authentifiés uniquement)"""
    
    def has_permission(self, request, view):
        # Aucun accès sans authentification
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture : utilisateurs authentifiés (clients)
        return True


class IsSuperAdminOrAdmin(permissions.BasePermission):
    """Permission : SuperAdmin ou Admin uniquement"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['SUPERADMIN', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsSuperAdminOrAdminOrEmploye(permissions.BasePermission):
    """Permission : SuperAdmin, Admin ou Employé"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['SUPERADMIN', 'ADMIN', 'EMPLOYE']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

