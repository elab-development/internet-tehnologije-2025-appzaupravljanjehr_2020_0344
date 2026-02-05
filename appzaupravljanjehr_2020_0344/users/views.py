from django.contrib.auth import authenticate, login, logout
from users.models import Korisnik
from firma.models import Organizaciona_jedinica, Radno_mesto
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from users.serializers import KorisnikSerializer, KorisnikFullSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user:
        login(request, user)
        return Response({'success': True, 'user': KorisnikFullSerializer(user).data})
    return Response({'success': False, 'error': 'Pogrešno korisničko ime ili lozinka.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({'success': True})


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_korisnici(request):
    if request.method == 'GET':
        korisnici = Korisnik.objects.all()
        return Response(KorisnikSerializer(korisnici, many=True).data)

    data = request.data
    username = data.get('username')
    jmbg = data.get('jmbg', '').strip()

    if not username:
        return Response({'error': 'Korisničko ime je obavezno.'}, status=status.HTTP_400_BAD_REQUEST)
    if not jmbg:
        return Response({'error': 'JMBG je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
    if Korisnik.objects.filter(username=username).exists():
        return Response({'error': 'Korisničko ime već postoji.'}, status=status.HTTP_400_BAD_REQUEST)
    if Korisnik.objects.filter(jmbg=jmbg).exists():
        return Response({'error': 'JMBG već postoji.'}, status=status.HTTP_400_BAD_REQUEST)

    org_jed = Organizaciona_jedinica.objects.filter(id=data.get('organizaciona_jedinica')).first()
    radno_mesto = Radno_mesto.objects.filter(id=data.get('radno_mesto')).first()
    rukovodilac = Korisnik.objects.filter(id=data.get('rukovodilac')).first()

    korisnik = Korisnik.objects.create_user(
        username=username,
        email=data.get('email', ''),
        password=data.get('password'),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        jmbg=jmbg,
        srednje_ime=data.get('srednje_ime', ''),
        pol=data.get('pol', ''),
        datum_rodjenja=data.get('datum_rodjenja') or '2000-01-01',
        mesto_rodjenja=data.get('mesto_rodjenja', ''),
        drzava=data.get('drzava', ''),
        adresa=data.get('adresa', ''),
        broj_telefona=data.get('broj_telefona', ''),
        strucna_sprema=data.get('strucna_sprema', ''),
        role=data.get('role', 'zaposleni'),
        organizaciona_jedinica=org_jed,
        radno_mesto=radno_mesto,
        rukovodilac=rukovodilac,
        is_active=data.get('is_active', True),
    )
    return Response(KorisnikFullSerializer(korisnik).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_korisnik(request, id):
    try:
        korisnik = Korisnik.objects.get(id=id)
    except Korisnik.DoesNotExist:
        return Response({'error': 'Korisnik nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(KorisnikFullSerializer(korisnik).data)

    if request.method == 'DELETE':
        korisnik.delete()
        return Response({'success': True})

    data = request.data
    korisnik.first_name = data.get('first_name', korisnik.first_name)
    korisnik.last_name = data.get('last_name', korisnik.last_name)
    korisnik.srednje_ime = data.get('srednje_ime', korisnik.srednje_ime)
    korisnik.pol = data.get('pol', korisnik.pol)
    korisnik.adresa = data.get('adresa', korisnik.adresa)
    korisnik.broj_telefona = data.get('broj_telefona', korisnik.broj_telefona)
    korisnik.email = data.get('email', korisnik.email)
    korisnik.strucna_sprema = data.get('strucna_sprema', korisnik.strucna_sprema)
    if data.get('datum_rodjenja'):
        korisnik.datum_rodjenja = data.get('datum_rodjenja')
    korisnik.save()

    return Response(KorisnikFullSerializer(korisnik).data)
