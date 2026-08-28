from rest_framework import serializers
from kpi.models import KPI, Dodeljeni_KPI, Ostvareni_KPI


class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = ['id', 'naziv', 'opis', 'target']


class OstvareniKPISerializer(serializers.ModelSerializer):
    rukovodilac_ime = serializers.SerializerMethodField()

    class Meta:
        model = Ostvareni_KPI
        fields = ['id', 'dodeljeni_kpi', 'ostvarena_vrednost', 'datum', 'opis', 'rukovodilac', 'rukovodilac_ime']

    def get_rukovodilac_ime(self, obj):
        if obj.rukovodilac:
            return obj.rukovodilac.get_full_name()
        return None


class DodeljeniKPISerializer(serializers.ModelSerializer):
    kpi_naziv = serializers.CharField(source='kpi.naziv', read_only=True)
    kpi_opis = serializers.CharField(source='kpi.opis', read_only=True)
    kpi_target = serializers.DecimalField(source='kpi.target', max_digits=12, decimal_places=2, read_only=True)
    korisnik_ime = serializers.SerializerMethodField()
    poslednja_vrednost = serializers.SerializerMethodField()
    procenat = serializers.SerializerMethodField()
    broj_unosa = serializers.SerializerMethodField()

    class Meta:
        model = Dodeljeni_KPI
        fields = [
            'id', 'kpi', 'kpi_naziv', 'kpi_opis', 'kpi_target',
            'korisnik', 'korisnik_ime', 'datum_Od', 'datum_Do', 'datum_dodele',
            'poslednja_vrednost', 'procenat', 'broj_unosa',
        ]

    def get_korisnik_ime(self, obj):
        return obj.korisnik.get_full_name()

    def get_poslednja_vrednost(self, obj):
        vrednost = obj.poslednja_vrednost()
        return str(vrednost) if vrednost is not None else None

    def get_procenat(self, obj):
        return obj.procenat()

    def get_broj_unosa(self, obj):
        return obj.ostvareni.count()


class DodeljeniKPIDetaljSerializer(DodeljeniKPISerializer):
    istorija = OstvareniKPISerializer(source='ostvareni', many=True, read_only=True)

    class Meta(DodeljeniKPISerializer.Meta):
        fields = DodeljeniKPISerializer.Meta.fields + ['istorija']
