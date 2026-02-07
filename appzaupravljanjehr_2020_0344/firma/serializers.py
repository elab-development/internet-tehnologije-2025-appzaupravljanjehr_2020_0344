from rest_framework import serializers
from firma.models import Organizaciona_jedinica, Radno_mesto


class OrganizacionaJedinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizaciona_jedinica
        fields = ['id', 'naziv', 'opis', 'nadredjena_org_jed']


class RadnoMestoSerializer(serializers.ModelSerializer):
    org_jed_naziv = serializers.CharField(source='org_jed.naziv', read_only=True)

    class Meta:
        model = Radno_mesto
        fields = ['id', 'naziv', 'opis', 'org_jed', 'org_jed_naziv']