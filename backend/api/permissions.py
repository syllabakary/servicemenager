from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permission pour superadmin uniquement"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'SUPERADMIN'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permission : admins peuvent modifier, autres en lecture seule"""
    
    def has_permission(self, request, view):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture réservée aux admins et superadmins
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission : propriétaire ou admin/superadmin"""
    
    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous
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
    """Permission : clients peuvent créer, lecture pour tous"""
    
    def has_permission(self, request, view):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture : utilisateurs authentifiés (clients)
        return request.user and request.user.is_authenticated

