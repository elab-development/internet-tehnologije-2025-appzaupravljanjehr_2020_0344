from django.shortcuts import render
from datetime import date
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from ocenjivanje.models import Oblast_ocenjivanja, Tezinski_koeficijent, Ocena_zaposlenog
from ocenjivanje.serializers import OblastOcenjivanjaSerializer, TezinskiKoeficijentSerializer, OcenaSerializer
from users.models import Korisnik
from firma.models import Radno_mesto
from drf_spectacular.utils import extend_schema, OpenApiParameter
from swagger_common import (
    ODG_400, ODG_401, ODG_403, ODG_404, UspehSerializer,
    OblastRequestSerializer, TezinskiKoeficijentRequestSerializer,
    OcenaRequestSerializer, OcenaUpdateSerializer,
)

@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['Ocenjivanje'],
    summary='Lista oblasti ocenjivanja',
    responses={200: OblastOcenjivanjaSerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['Ocenjivanje'],
    summary='Kreiranje oblasti ocenjivanja',
    request=OblastRequestSerializer,
    responses={201: OblastOcenjivanjaSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_oblasti_ocenjivanja(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        oblasti = Oblast_ocenjivanja.objects.all().order_by('naziv')
        return Response(OblastOcenjivanjaSerializer(oblasti, many=True).data)

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za kreiranje oblasti ocenjivanja.'}, status=status.HTTP_403_FORBIDDEN)

    naziv = (request.data.get('naziv') or '').strip()
    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
    if Oblast_ocenjivanja.objects.filter(naziv__iexact=naziv).exists():
        return Response({'error': 'Oblast ocenjivanja sa tim nazivom već postoji.'}, status=status.HTTP_400_BAD_REQUEST)

    oblast = Oblast_ocenjivanja.objects.create(naziv=naziv, opis=request.data.get('opis', ''))
    return Response(OblastOcenjivanjaSerializer(oblast).data, status=status.HTTP_201_CREATED)


def popuni_koeficijent(koef, data):
    radno_mesto_id = data.get('radno_mesto')
    if not radno_mesto_id:
        return 'Radno mesto je obavezno.'
    try:
        koef.radno_mesto = Radno_mesto.objects.get(id=radno_mesto_id)
    except Radno_mesto.DoesNotExist:
        return 'Radno mesto nije pronađeno.'

    for i in range(1, 6):
        oblast_id = data.get(f'oblast_ocenjivanja_{i}')
        vrednost = data.get(f'koef_{i}')
        if not oblast_id or vrednost in (None, ''):
            return 'Svih pet oblasti i koeficijenata je obavezno.'
        try:
            setattr(koef, f'oblast_ocenjivanja_{i}', Oblast_ocenjivanja.objects.get(id=oblast_id))
        except Oblast_ocenjivanja.DoesNotExist:
            return f'Oblast ocenjivanja {i} nije pronađena.'
        try:
            vrednost = float(vrednost)
        except (TypeError, ValueError):
            return f'Koeficijent {i} mora biti broj.'
        if vrednost < 0 or vrednost > 1:
            return f'Koeficijent {i} mora biti između 0 i 1.'
        setattr(koef, f'koef_{i}', round(vrednost, 3))

    try:
        koef.clean()
    except ValidationError as e:
        return ' '.join(e.messages)
    return None


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['Ocenjivanje'],
    summary='Lista težinskih koeficijenata',
    parameters=[
        OpenApiParameter('radno_mesto', int, OpenApiParameter.QUERY, description='Filter po ID radnog mesta'),
    ],
    responses={200: TezinskiKoeficijentSerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['Ocenjivanje'],
    summary='Kreiranje težinskih koeficijenata za radno mesto',
    description='Samo superuser i administrator. Po jedan skup koeficijenata po radnom mestu.',
    request=TezinskiKoeficijentRequestSerializer,
    responses={201: TezinskiKoeficijentSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_tezinski_koeficijenti(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        koeficijenti = Tezinski_koeficijent.objects.select_related('radno_mesto', 'radno_mesto__org_jed').all()
        radno_mesto_id = request.query_params.get('radno_mesto')
        if radno_mesto_id:
            koeficijenti = koeficijenti.filter(radno_mesto_id=radno_mesto_id)
        return Response(TezinskiKoeficijentSerializer(koeficijenti, many=True).data)

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za kreiranje težinskih koeficijenata.'}, status=status.HTTP_403_FORBIDDEN)

    if Tezinski_koeficijent.objects.filter(radno_mesto_id=request.data.get('radno_mesto')).exists():
        return Response({'error': 'Za ovo radno mesto već postoje težinski koeficijenti. Izmenite postojeće.'}, status=status.HTTP_400_BAD_REQUEST)

    koef = Tezinski_koeficijent()
    greska = popuni_koeficijent(koef, request.data)
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
    koef.save()
    return Response(TezinskiKoeficijentSerializer(koef).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['Ocenjivanje'],
    summary='Detalji težinskih koeficijenata',
    responses={200: TezinskiKoeficijentSerializer, 401: ODG_401, 404: ODG_404},
)
@extend_schema(
    methods=['PUT'],
    tags=['Ocenjivanje'],
    summary='Izmena težinskih koeficijenata',
    request=TezinskiKoeficijentRequestSerializer,
    responses={200: TezinskiKoeficijentSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@extend_schema(
    methods=['DELETE'],
    tags=['Ocenjivanje'],
    summary='Brisanje težinskih koeficijenata',
    responses={200: UspehSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_tezinski_koeficijent(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        koef = Tezinski_koeficijent.objects.get(id=id)
    except Tezinski_koeficijent.DoesNotExist:
        return Response({'error': 'Težinski koeficijent nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TezinskiKoeficijentSerializer(koef).data)

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za izmenu težinskih koeficijenata.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        koef.delete()
        return Response({'success': True})

    drugi = Tezinski_koeficijent.objects.filter(radno_mesto_id=request.data.get('radno_mesto')).exclude(id=koef.id)
    if drugi.exists():
        return Response({'error': 'Za to radno mesto već postoje težinski koeficijenti.'}, status=status.HTTP_400_BAD_REQUEST)

    greska = popuni_koeficijent(koef, request.data)
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
    koef.save()
    for ocena in Ocena_zaposlenog.objects.filter(tezinski_koeficijent=koef):
        ocena.save()
    return Response(TezinskiKoeficijentSerializer(koef).data)


def ocene_za_korisnika(user):
    if user.role in ['superuser', 'administrator']:
        return Ocena_zaposlenog.objects.all()
    if user.role == 'rukovodilac':
        podredjeni_ids = list(Korisnik.objects.filter(rukovodilac=user).values_list('id', flat=True))
        return Ocena_zaposlenog.objects.filter(zaposleni_id__in=podredjeni_ids + [user.id])
    return Ocena_zaposlenog.objects.filter(zaposleni=user)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['Ocenjivanje'],
    summary='Lista ocena zaposlenih',
    parameters=[
        OpenApiParameter('zaposleni', int, OpenApiParameter.QUERY, description='Filter po ID zaposlenog'),
    ],
    responses={200: OcenaSerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['Ocenjivanje'],
    summary='Unos ocene zaposlenog',
    description='Rukovodilac ocenjuje zaposlene iz svog tima po pet oblasti (1–5). Zbirna ocena se računa prema težinskim koeficijentima radnog mesta.',
    request=OcenaRequestSerializer,
    responses={201: OcenaSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_ocene(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        ocene = ocene_za_korisnika(user).select_related('zaposleni', 'rukovodilac', 'tezinski_koeficijent')
        zaposleni_id = request.query_params.get('zaposleni')
        if zaposleni_id:
            ocene = ocene.filter(zaposleni_id=zaposleni_id)
        return Response(OcenaSerializer(ocene, many=True).data)

    if user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za unos ocena.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    zaposleni_id = data.get('zaposleni')
    datum_od = data.get('datum_Od')
    datum_do = data.get('datum_Do')
    ocene_vrednosti = [data.get(f'ocena_{i}') for i in range(1, 6)]

    if not zaposleni_id or not datum_od or not datum_do or any(o in (None, '') for o in ocene_vrednosti):
        return Response({'error': 'Sva polja su obavezna (zaposleni, period i svih pet ocena).'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        zaposleni = Korisnik.objects.get(id=zaposleni_id)
    except Korisnik.DoesNotExist:
        return Response({'error': 'Zaposleni nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    if user.role == 'rukovodilac' and zaposleni.rukovodilac_id != user.id:
        return Response({'error': 'Možete ocenjivati samo zaposlene iz svog tima.'}, status=status.HTTP_403_FORBIDDEN)

    if zaposleni.id == user.id:
        return Response({'error': 'Ne možete ocenjivati sami sebe.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        datum_od_d = date.fromisoformat(str(datum_od))
        datum_do_d = date.fromisoformat(str(datum_do))
    except ValueError:
        return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_do_d < datum_od_d:
        return Response({'error': 'Datum završetka ne može biti pre datuma početka.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_od_d > date.today():
        return Response({'error': 'Evaluacioni ciklus nije aktivan (period još nije počeo).'}, status=status.HTTP_400_BAD_REQUEST)

    if not zaposleni.radno_mesto_id:
        return Response({'error': 'Zaposleni nema dodeljeno radno mesto.'}, status=status.HTTP_400_BAD_REQUEST)

    koef = Tezinski_koeficijent.objects.filter(radno_mesto_id=zaposleni.radno_mesto_id).first()
    if not koef:
        return Response({'error': 'Za radno mesto zaposlenog nisu definisani težinski koeficijenti.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ocene_int = [int(o) for o in ocene_vrednosti]
    except (TypeError, ValueError):
        return Response({'error': 'Ocene moraju biti celi brojevi od 1 do 5.'}, status=status.HTTP_400_BAD_REQUEST)

    if Ocena_zaposlenog.objects.filter(zaposleni=zaposleni, datum_Od=datum_od_d, datum_Do=datum_do_d).exists():
        return Response({'error': 'Ocena za ovog zaposlenog i ovaj period već postoji.'}, status=status.HTTP_400_BAD_REQUEST)

    ocena = Ocena_zaposlenog(
        zaposleni=zaposleni,
        rukovodilac=user,
        tezinski_koeficijent=koef,
        ocena_1=ocene_int[0],
        ocena_2=ocene_int[1],
        ocena_3=ocene_int[2],
        ocena_4=ocene_int[3],
        ocena_5=ocene_int[4],
        datum_Od=datum_od_d,
        datum_Do=datum_do_d,
    )
    try:
        ocena.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    ocena.save()
    return Response(OcenaSerializer(ocena).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['Ocenjivanje'],
    summary='Detalji ocene',
    responses={200: OcenaSerializer, 401: ODG_401, 404: ODG_404},
)
@extend_schema(
    methods=['PUT'],
    tags=['Ocenjivanje'],
    summary='Izmena ocene',
    request=OcenaUpdateSerializer,
    responses={200: OcenaSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@extend_schema(
    methods=['DELETE'],
    tags=['Ocenjivanje'],
    summary='Brisanje ocene',
    responses={200: UspehSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_ocena(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    try:
        ocena = ocene_za_korisnika(user).get(id=id)
    except Ocena_zaposlenog.DoesNotExist:
        return Response({'error': 'Ocena nije pronađena.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(OcenaSerializer(ocena).data)

    if user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za izmenu ocena.'}, status=status.HTTP_403_FORBIDDEN)

    if user.role == 'rukovodilac' and ocena.zaposleni.rukovodilac_id != user.id:
        return Response({'error': 'Možete menjati samo ocene zaposlenih iz svog tima.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        ocena.delete()
        return Response({'success': True})

    data = request.data
    for i in range(1, 6):
        if data.get(f'ocena_{i}') not in (None, ''):
            try:
                setattr(ocena, f'ocena_{i}', int(data.get(f'ocena_{i}')))
            except (TypeError, ValueError):
                return Response({'error': 'Ocene moraju biti celi brojevi od 1 do 5.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        ocena.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    ocena.save()
    return Response(OcenaSerializer(ocena).data)
