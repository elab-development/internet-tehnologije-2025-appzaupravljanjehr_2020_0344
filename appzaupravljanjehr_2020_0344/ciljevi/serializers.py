from rest_framework import serializers
from ciljevi.models import Tip_cilja, Cilj, Dodeljeni_cilj


class TipCiljaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tip_cilja
        fields = ['id', 'naziv']

class CiljSerializer(serializers.ModelSerializer):
    tip_cilja_naziv = serializers.CharField(source='tip_cilja.naziv', read_only=True)

    class Meta:
        model = Cilj
        fields = ['id', 'naziv', 'tip_cilja', 'tip_cilja_naziv', 'status']


class DodeljeniCiljSerializer(serializers.ModelSerializer):
    cilj_naziv = serializers.CharField(source='cilj.naziv', read_only=True)
    zaposleni_ime = serializers.SerializerMethodField()

    class Meta:
        model = Dodeljeni_cilj
        fields = ['id', 'cilj', 'cilj_naziv', 'zaposleni', 'zaposleni_ime', 'datum_Od', 'datum_Do']

    def get_zaposleni_ime(self, obj):
        return f"{obj.zaposleni.first_name} {obj.zaposleni.last_name}"