from rest_framework import serializers
from drf_spectacular.utils import OpenApiResponse
from users.serializers import KorisnikFullSerializer
from kpi.serializers import DodeljeniKPISerializer

class UspehSerializer(serializers.Serializer):
    success = serializers.BooleanField()

class GreskaSerializer(serializers.Serializer):
    error = serializers.CharField()

ODG_400 = OpenApiResponse(response=GreskaSerializer, description='Neispravni ili nepotpuni podaci')
ODG_401 = OpenApiResponse(response=GreskaSerializer, description='Niste ulogovani')
ODG_403 = OpenApiResponse(response=GreskaSerializer, description='Nemate dozvolu za ovu akciju')
ODG_404 = OpenApiResponse(response=GreskaSerializer, description='Zapis nije pronađen')

ROLE_CHOICES = ['superuser', 'administrator', 'rukovodilac', 'zaposleni']


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    user = KorisnikFullSerializer()


class KorisnikCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    jmbg = serializers.CharField(max_length=13)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    srednje_ime = serializers.CharField(required=False)
    pol = serializers.CharField(required=False)
    datum_rodjenja = serializers.DateField(required=False)
    mesto_rodjenja = serializers.CharField(required=False)
    drzava = serializers.CharField(required=False)
    adresa = serializers.CharField(required=False)
    broj_telefona = serializers.CharField(required=False)
    strucna_sprema = serializers.CharField(required=False)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)
    organizaciona_jedinica = serializers.IntegerField(required=False, allow_null=True)
    radno_mesto = serializers.IntegerField(required=False, allow_null=True)
    rukovodilac = serializers.IntegerField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)

class KorisnikUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    srednje_ime = serializers.CharField(required=False)
    pol = serializers.CharField(required=False)
    datum_rodjenja = serializers.DateField(required=False)
    adresa = serializers.CharField(required=False)
    broj_telefona = serializers.CharField(required=False)
    strucna_sprema = serializers.CharField(required=False)
    #samo superuser/administrator
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)
    organizaciona_jedinica = serializers.IntegerField(required=False, allow_null=True)
    radno_mesto = serializers.IntegerField(required=False, allow_null=True)
    rukovodilac = serializers.IntegerField(required=False, allow_null=True)


class OrgJedinicaRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()
    opis = serializers.CharField(required=False)
    nadredjena_org_jed = serializers.IntegerField(required=False, allow_null=True)
    rukovodilac = serializers.IntegerField(required=False, allow_null=True)

class RadnoMestoRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()
    opis = serializers.CharField(required=False)
    org_jed = serializers.IntegerField()


class TipCiljaRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()

class CiljRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()
    tip_cilja = serializers.IntegerField()
    status = serializers.CharField(required=False, help_text='podrazumevano: aktivan')

class DodeljeniCiljRequestSerializer(serializers.Serializer):
    cilj = serializers.IntegerField()
    zaposleni = serializers.IntegerField()
    datum_Od = serializers.DateField()
    datum_Do = serializers.DateField()

class DodelaMasovnoRequestSerializer(serializers.Serializer):
    cilj = serializers.IntegerField()
    datum_Od = serializers.DateField()
    datum_Do = serializers.DateField()
    organizaciona_jedinica = serializers.IntegerField(required=False)
    radno_mesto = serializers.IntegerField(required=False)
    zaposleni_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

class DodelaMasovnoResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    created = serializers.IntegerField()
    skipped = serializers.IntegerField()
    message = serializers.CharField()


class OblastRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()
    opis = serializers.CharField(required=False)

class TezinskiKoeficijentRequestSerializer(serializers.Serializer):
    radno_mesto = serializers.IntegerField()
    oblast_ocenjivanja_1 = serializers.IntegerField()
    oblast_ocenjivanja_2 = serializers.IntegerField()
    oblast_ocenjivanja_3 = serializers.IntegerField()
    oblast_ocenjivanja_4 = serializers.IntegerField()
    oblast_ocenjivanja_5 = serializers.IntegerField()
    koef_1 = serializers.DecimalField(max_digits=5, decimal_places=2)
    koef_2 = serializers.DecimalField(max_digits=5, decimal_places=2)
    koef_3 = serializers.DecimalField(max_digits=5, decimal_places=2)
    koef_4 = serializers.DecimalField(max_digits=5, decimal_places=2)
    koef_5 = serializers.DecimalField(max_digits=5, decimal_places=2)

class OcenaRequestSerializer(serializers.Serializer):
    zaposleni = serializers.IntegerField()
    datum_Od = serializers.DateField()
    datum_Do = serializers.DateField()
    ocena_1 = serializers.IntegerField(min_value=1, max_value=5)
    ocena_2 = serializers.IntegerField(min_value=1, max_value=5)
    ocena_3 = serializers.IntegerField(min_value=1, max_value=5)
    ocena_4 = serializers.IntegerField(min_value=1, max_value=5)
    ocena_5 = serializers.IntegerField(min_value=1, max_value=5)

class OcenaUpdateSerializer(serializers.Serializer):
    ocena_1 = serializers.IntegerField(min_value=1, max_value=5, required=False)
    ocena_2 = serializers.IntegerField(min_value=1, max_value=5, required=False)
    ocena_3 = serializers.IntegerField(min_value=1, max_value=5, required=False)
    ocena_4 = serializers.IntegerField(min_value=1, max_value=5, required=False)
    ocena_5 = serializers.IntegerField(min_value=1, max_value=5, required=False)


class OdmorRequestSerializer(serializers.Serializer):
    datum_Od = serializers.DateField()
    datum_Do = serializers.DateField()
    napomena = serializers.CharField(required=False)

class OdmorOdlukaSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['odobren', 'odbijen'])
    razlog_odbijanja = serializers.CharField(required=False, help_text='obavezno ako je status = odbijen')

class StanjeOdmoraSerializer(serializers.Serializer):
    godina = serializers.IntegerField()
    ukupno = serializers.IntegerField()
    iskorisceno = serializers.IntegerField()
    na_cekanju = serializers.IntegerField()
    preostalo = serializers.IntegerField()


class PlataRequestSerializer(serializers.Serializer):
    radno_mesto = serializers.IntegerField()
    bruto = serializers.DecimalField(max_digits=12, decimal_places=2)
    neto = serializers.DecimalField(max_digits=12, decimal_places=2)

class PlataUpdateSerializer(serializers.Serializer):
    bruto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    neto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

class IsplataRequestSerializer(serializers.Serializer):
    korisnik = serializers.IntegerField()
    datum_isplate = serializers.DateField()
    iznos_bruto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    iznos_neto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    bonus = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

class IsplataUpdateSerializer(serializers.Serializer):
    datum_isplate = serializers.DateField(required=False)
    iznos_bruto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    iznos_neto = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    bonus = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

class PlatePregledSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    ime = serializers.CharField()
    role = serializers.CharField()
    radno_mesto = serializers.IntegerField(allow_null=True)
    radno_mesto_naziv = serializers.CharField(allow_null=True)
    organizaciona_jedinica_naziv = serializers.CharField(allow_null=True)
    plata_id = serializers.IntegerField(allow_null=True)
    bruto = serializers.CharField(allow_null=True)
    neto = serializers.CharField(allow_null=True)
    broj_isplata = serializers.IntegerField()
    poslednja_isplata = serializers.DateField(allow_null=True)
    isplaceno_neto_godina = serializers.CharField()
    bonusi_godina = serializers.CharField()


class KPIRequestSerializer(serializers.Serializer):
    naziv = serializers.CharField()
    opis = serializers.CharField(required=False)
    target = serializers.DecimalField(max_digits=12, decimal_places=2)

class KPIUpdateSerializer(serializers.Serializer):
    naziv = serializers.CharField(required=False)
    opis = serializers.CharField(required=False)
    target = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

class DodeljeniKPIRequestSerializer(serializers.Serializer):
    kpi = serializers.IntegerField()
    korisnici = serializers.ListField(child=serializers.IntegerField())
    datum_Od = serializers.DateField()
    datum_Do = serializers.DateField()

class DodeljeniKPIResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    created = serializers.IntegerField()
    skipped = serializers.IntegerField()
    message = serializers.CharField()
    dodeljeni = DodeljeniKPISerializer(many=True)

class OstvareniKPIRequestSerializer(serializers.Serializer):
    dodeljeni_kpi = serializers.IntegerField()
    ostvarena_vrednost = serializers.DecimalField(max_digits=12, decimal_places=2)
    datum = serializers.DateField()
    opis = serializers.CharField(required=False)