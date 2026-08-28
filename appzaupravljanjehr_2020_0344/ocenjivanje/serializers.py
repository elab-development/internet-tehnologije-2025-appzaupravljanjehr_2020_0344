from rest_framework import serializers
from ocenjivanje.models import Oblast_ocenjivanja, Tezinski_koeficijent, Ocena_zaposlenog


class OblastOcenjivanjaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oblast_ocenjivanja
        fields = ['id', 'naziv', 'opis']


class TezinskiKoeficijentSerializer(serializers.ModelSerializer):
    radno_mesto_naziv = serializers.CharField(source='radno_mesto.naziv', read_only=True)
    org_jed_naziv = serializers.CharField(source='radno_mesto.org_jed.naziv', read_only=True)
    oblast_1_naziv = serializers.CharField(source='oblast_ocenjivanja_1.naziv', read_only=True)
    oblast_2_naziv = serializers.CharField(source='oblast_ocenjivanja_2.naziv', read_only=True)
    oblast_3_naziv = serializers.CharField(source='oblast_ocenjivanja_3.naziv', read_only=True)
    oblast_4_naziv = serializers.CharField(source='oblast_ocenjivanja_4.naziv', read_only=True)
    oblast_5_naziv = serializers.CharField(source='oblast_ocenjivanja_5.naziv', read_only=True)

    class Meta:
        model = Tezinski_koeficijent
        fields = [
            'id', 'radno_mesto', 'radno_mesto_naziv', 'org_jed_naziv',
            'oblast_ocenjivanja_1', 'oblast_1_naziv', 'koef_1',
            'oblast_ocenjivanja_2', 'oblast_2_naziv', 'koef_2',
            'oblast_ocenjivanja_3', 'oblast_3_naziv', 'koef_3',
            'oblast_ocenjivanja_4', 'oblast_4_naziv', 'koef_4',
            'oblast_ocenjivanja_5', 'oblast_5_naziv', 'koef_5',
        ]


class OcenaSerializer(serializers.ModelSerializer):
    zaposleni_ime = serializers.SerializerMethodField()
    rukovodilac_ime = serializers.SerializerMethodField()
    oblasti = serializers.SerializerMethodField()

    class Meta:
        model = Ocena_zaposlenog
        fields = [
            'id', 'zaposleni', 'zaposleni_ime', 'rukovodilac', 'rukovodilac_ime',
            'tezinski_koeficijent', 'ocena_1', 'ocena_2', 'ocena_3', 'ocena_4', 'ocena_5',
            'zbirna_ocena', 'datum_Od', 'datum_Do', 'oblasti',
        ]

    def get_zaposleni_ime(self, obj):
        return obj.zaposleni.get_full_name()

    def get_rukovodilac_ime(self, obj):
        if obj.rukovodilac:
            return obj.rukovodilac.get_full_name()
        return None

    def get_oblasti(self, obj):
        if not obj.tezinski_koeficijent:
            return []
        return [
            {'naziv': o.naziv, 'koeficijent': str(k), 'ocena': oc}
            for o, k, oc in zip(obj.tezinski_koeficijent.oblasti(), obj.tezinski_koeficijent.koeficijenti(), obj.ocene())
        ]