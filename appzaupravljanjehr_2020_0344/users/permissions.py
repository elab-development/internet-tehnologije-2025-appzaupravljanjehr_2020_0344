from rest_framework.permissions import BasePermission

#superuser: Sve dozvole
#administrator: Upravljanje korisnicima, org. jedinicama, radnim mestima, dodela ciljeva rukovodiocima
#rukovodilac: Dodela ciljeva svojim zaposlenima(podredjenim)
#zaposleni: Pregled i izmena sopstvenog profila, pregled sopstvenih ciljeva


class IsSuperuser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'superuser'


class IsAdministrator(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'administrator'


class IsSuperuserOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['superuser', 'administrator']


class IsRukovodilac(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'rukovodilac'


class IsZaposleni(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'zaposleni'


class IsRukovodilacOrHigher(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['superuser', 'administrator', 'rukovodilac']


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated