from rest_framework import serializers
from users.models import Korisnik

class KorisnikSerializer(serializers.ModelSerializer):
    class Meta:
        model = Korisnik
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'jmbg', 'broj_telefona']