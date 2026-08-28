from rest_framework import serializers
from odsustva.models import Odmor, stanje_odmora


class OdmorSerializer(serializers.ModelSerializer):
    zaposleni_ime = serializers.SerializerMethodField()
    rukovodilac_ime = serializers.SerializerMethodField()
    obradio_ime = serializers.SerializerMethodField()
    status_naziv = serializers.CharField(source='get_status_display', read_only=True)
    organizaciona_jedinica_naziv = serializers.SerializerMethodField()

    class Meta:
        model = Odmor
        fields = [
            'id', 'zaposleni', 'zaposleni_ime', 'organizaciona_jedinica_naziv',
            'rukovodilac', 'rukovodilac_ime',
            'datum_Od', 'datum_Do', 'broj_dana', 'napomena',
            'status', 'status_naziv', 'razlog_odbijanja',
            'datum_podnosenja', 'obradio', 'obradio_ime', 'datum_obrade',
        ]

    def get_zaposleni_ime(self, obj):
        return obj.zaposleni.get_full_name()

    def get_rukovodilac_ime(self, obj):
        if obj.rukovodilac:
            return obj.rukovodilac.get_full_name()
        return None

    def get_obradio_ime(self, obj):
        if obj.obradio:
            return obj.obradio.get_full_name()
        return None

    def get_organizaciona_jedinica_naziv(self, obj):
        if obj.zaposleni.organizaciona_jedinica:
            return obj.zaposleni.organizaciona_jedinica.naziv
        return None


class OdmorDetaljSerializer(OdmorSerializer):
    stanje = serializers.SerializerMethodField()

    class Meta(OdmorSerializer.Meta):
        fields = OdmorSerializer.Meta.fields + ['stanje']

    def get_stanje(self, obj):
        return stanje_odmora(obj.zaposleni, obj.datum_Od.year)
