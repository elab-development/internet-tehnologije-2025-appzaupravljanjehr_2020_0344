from rest_framework import serializers
from plate.models import Plata, Isplata


class PlataSerializer(serializers.ModelSerializer):
    radno_mesto_naziv = serializers.CharField(source='radno_mesto.naziv', read_only=True)
    org_jed_naziv = serializers.CharField(source='radno_mesto.org_jed.naziv', read_only=True)

    class Meta:
        model = Plata
        fields = ['id', 'radno_mesto', 'radno_mesto_naziv', 'org_jed_naziv', 'bruto', 'neto']


class IsplataSerializer(serializers.ModelSerializer):
    korisnik_ime = serializers.SerializerMethodField()
    izmenio_ime = serializers.SerializerMethodField()
    ukupno_neto = serializers.SerializerMethodField()

    class Meta:
        model = Isplata
        fields = [
            'id', 'korisnik', 'korisnik_ime', 'plata', 'datum_isplate',
            'iznos_bruto', 'iznos_neto', 'bonus', 'ukupno_neto',
            'izmenio', 'izmenio_ime', 'datum_izmene',
        ]

    def get_korisnik_ime(self, obj):
        return obj.korisnik.get_full_name()

    def get_izmenio_ime(self, obj):
        if obj.izmenio:
            return obj.izmenio.get_full_name()
        return None

    def get_ukupno_neto(self, obj):
        return str(obj.ukupno_neto())
