from rest_framework import serializers
from users.models import Korisnik


class KorisnikSerializer(serializers.ModelSerializer):
    class Meta:
        model = Korisnik
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'jmbg', 'broj_telefona', 'organizaciona_jedinica', 'radno_mesto']


class KorisnikFullSerializer(serializers.ModelSerializer):
    organizaciona_jedinica_naziv = serializers.SerializerMethodField()
    radno_mesto_naziv = serializers.SerializerMethodField()
    rukovodilac_ime = serializers.SerializerMethodField()

    class Meta:
        model = Korisnik
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'jmbg', 'broj_telefona', 'srednje_ime', 'pol', 'datum_rodjenja',
            'mesto_rodjenja', 'drzava', 'adresa', 'strucna_sprema',
            'organizaciona_jedinica', 'organizaciona_jedinica_naziv',
            'radno_mesto', 'radno_mesto_naziv',
            'rukovodilac', 'rukovodilac_ime',
            'is_active', 'is_staff'
        ]

    def get_organizaciona_jedinica_naziv(self, obj):
        if obj.organizaciona_jedinica:
            return obj.organizaciona_jedinica.naziv
        return None

    def get_radno_mesto_naziv(self, obj):
        if obj.radno_mesto:
            return obj.radno_mesto.naziv
        return None

    def get_rukovodilac_ime(self, obj):
        if obj.rukovodilac:
            return obj.rukovodilac.get_full_name()
        return None
