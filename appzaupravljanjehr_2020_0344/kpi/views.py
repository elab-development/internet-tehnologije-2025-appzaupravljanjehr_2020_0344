from datetime import date
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from kpi.models import KPI, Dodeljeni_KPI, Ostvareni_KPI
from kpi.serializers import KPISerializer, DodeljeniKPISerializer, DodeljeniKPIDetaljSerializer, OstvareniKPISerializer
from users.models import Korisnik
from drf_spectacular.utils import extend_schema, OpenApiParameter
from swagger_common import (
    ODG_400, ODG_401, ODG_403, ODG_404, UspehSerializer,
    KPIRequestSerializer, KPIUpdateSerializer,
    DodeljeniKPIRequestSerializer, DodeljeniKPIResponseSerializer,
    OstvareniKPIRequestSerializer,
)

def moze_da_upravlja(user):
    return user.role in ['superuser', 'administrator', 'rukovodilac']


def sme_za_zaposlenog(user, zaposleni):
    if user.role in ['superuser', 'administrator']:
        return True
    if user.role == 'rukovodilac':
        return zaposleni.rukovodilac_id == user.id
    return False


def dodeljeni_za_korisnika(user):
    if user.role in ['superuser', 'administrator']:
        return Dodeljeni_KPI.objects.all()
    if user.role == 'rukovodilac':
        podredjeni_ids = list(Korisnik.objects.filter(rukovodilac=user).values_list('id', flat=True))
        return Dodeljeni_KPI.objects.filter(korisnik_id__in=podredjeni_ids + [user.id])
    return Dodeljeni_KPI.objects.filter(korisnik=user)


def u_decimal(vrednost, naziv):
    if vrednost in (None, ''):
        return None, f'{naziv} je obavezan.'
    try:
        broj = Decimal(str(vrednost))
    except (InvalidOperation, ValueError):
        return None, f'{naziv} mora biti broj.'
    return broj, None


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['KPI'],
    summary='Lista KPI pokazatelja',
    responses={200: KPISerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['KPI'],
    summary='Kreiranje KPI pokazatelja',
    request=KPIRequestSerializer,
    responses={201: KPISerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_kpi(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response(KPISerializer(KPI.objects.all(), many=True).data)

    if not moze_da_upravlja(request.user):
        return Response({'error': 'Nemate dozvolu za kreiranje KPI.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    naziv = (data.get('naziv') or '').strip()
    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
    target, greska = u_decimal(data.get('target'), 'Target')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)

    kpi = KPI(naziv=naziv, opis=data.get('opis', ''), target=target)
    try:
        kpi.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    kpi.save()
    return Response(KPISerializer(kpi).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['KPI'],
    summary='Detalji KPI pokazatelja',
    responses={200: KPISerializer, 401: ODG_401, 404: ODG_404},
)
@extend_schema(
    methods=['PUT'],
    tags=['KPI'],
    summary='Izmena KPI pokazatelja',
    request=KPIUpdateSerializer,
    responses={200: KPISerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@extend_schema(
    methods=['DELETE'],
    tags=['KPI'],
    summary='Brisanje KPI pokazatelja',
    responses={200: UspehSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_kpi_detalj(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        kpi = KPI.objects.get(id=id)
    except KPI.DoesNotExist:
        return Response({'error': 'KPI nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(KPISerializer(kpi).data)

    if request.method == 'DELETE':
        if request.user.role not in ['superuser', 'administrator']:
            return Response({'error': 'Nemate dozvolu za brisanje KPI.'}, status=status.HTTP_403_FORBIDDEN)
        kpi.delete()
        return Response({'success': True})

    if not moze_da_upravlja(request.user):
        return Response({'error': 'Nemate dozvolu za izmenu KPI.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    if 'naziv' in data:
        naziv = (data.get('naziv') or '').strip()
        if not naziv:
            return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
        kpi.naziv = naziv
    if 'opis' in data:
        kpi.opis = data.get('opis')
    if 'target' in data:
        target, greska = u_decimal(data.get('target'), 'Target')
        if greska:
            return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
        kpi.target = target
    try:
        kpi.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    kpi.save()
    return Response(KPISerializer(kpi).data)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['KPI'],
    summary='Lista dodeljenih KPI',
    parameters=[
        OpenApiParameter('korisnik', int, OpenApiParameter.QUERY, description='Filter po ID zaposlenog'),
    ],
    responses={200: DodeljeniKPISerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['KPI'],
    summary='Dodela KPI jednom ili više zaposlenih',
    description='Rukovodilac dodeljuje samo zaposlenima iz svog tima. Već dodeljeni za isti period se preskaču.',
    request=DodeljeniKPIRequestSerializer,
    responses={201: DodeljeniKPIResponseSerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_dodeljeni_kpi(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        dodeljeni = dodeljeni_za_korisnika(user).select_related('kpi', 'korisnik')
        korisnik_id = request.query_params.get('korisnik')
        if korisnik_id:
            dodeljeni = dodeljeni.filter(korisnik_id=korisnik_id)
        return Response(DodeljeniKPISerializer(dodeljeni, many=True).data)

    if not moze_da_upravlja(user):
        return Response({'error': 'Nemate dozvolu za dodelu KPI.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    kpi_id = data.get('kpi')
    datum_od = data.get('datum_Od')
    datum_do = data.get('datum_Do')
    korisnici_ids = data.get('korisnici') or ([data.get('korisnik')] if data.get('korisnik') else [])

    if not kpi_id or not datum_od or not datum_do or not korisnici_ids:
        return Response({'error': 'KPI, zaposleni i period su obavezni.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        kpi = KPI.objects.get(id=kpi_id)
    except KPI.DoesNotExist:
        return Response({'error': 'KPI nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        datum_od_d = date.fromisoformat(str(datum_od))
        datum_do_d = date.fromisoformat(str(datum_do))
    except ValueError:
        return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_do_d < datum_od_d:
        return Response({'error': 'Datum završetka ne može biti pre datuma početka.'}, status=status.HTTP_400_BAD_REQUEST)

    kreirano = []
    preskoceno = 0
    for korisnik_id in korisnici_ids:
        try:
            zaposleni = Korisnik.objects.get(id=korisnik_id)
        except Korisnik.DoesNotExist:
            return Response({'error': f'Zaposleni sa id {korisnik_id} nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)
        if not sme_za_zaposlenog(user, zaposleni):
            return Response({'error': f'Možete dodeljivati KPI samo zaposlenima iz svog tima ({zaposleni.get_full_name()}).'}, status=status.HTTP_403_FORBIDDEN)
        if Dodeljeni_KPI.objects.filter(kpi=kpi, korisnik=zaposleni, datum_Od=datum_od_d, datum_Do=datum_do_d).exists():
            preskoceno += 1
            continue
        kreirano.append(Dodeljeni_KPI.objects.create(kpi=kpi, korisnik=zaposleni, datum_Od=datum_od_d, datum_Do=datum_do_d))

    return Response({
        'success': True,
        'created': len(kreirano),
        'skipped': preskoceno,
        'dodeljeni': DodeljeniKPISerializer(kreirano, many=True).data,
        'message': f'KPI dodeljen za {len(kreirano)} zaposlenih. Preskočeno {preskoceno} (već dodeljeno).',
    }, status=status.HTTP_201_CREATED)


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['KPI'],
    summary='Detalji dodeljenog KPI (sa istorijom unosa)',
    responses={200: DodeljeniKPIDetaljSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@extend_schema(
    methods=['DELETE'],
    tags=['KPI'],
    summary='Uklanjanje dodeljenog KPI',
    responses={200: UspehSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def api_dodeljeni_kpi_detalj(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    try:
        dodeljeni = dodeljeni_za_korisnika(user).select_related('kpi', 'korisnik').get(id=id)
    except Dodeljeni_KPI.DoesNotExist:
        return Response({'error': 'Dodeljeni KPI nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DodeljeniKPIDetaljSerializer(dodeljeni).data)

    if not sme_za_zaposlenog(user, dodeljeni.korisnik):
        return Response({'error': 'Nemate dozvolu za brisanje ovog dodeljenog KPI.'}, status=status.HTTP_403_FORBIDDEN)
    dodeljeni.delete()
    return Response({'success': True})


@csrf_exempt
@extend_schema(
    methods=['GET'],
    tags=['KPI'],
    summary='Lista unosa ostvarenih vrednosti KPI',
    parameters=[
        OpenApiParameter('dodeljeni_kpi', int, OpenApiParameter.QUERY, description='Filter po ID dodeljenog KPI'),
    ],
    responses={200: OstvareniKPISerializer(many=True), 401: ODG_401},
)
@extend_schema(
    methods=['POST'],
    tags=['KPI'],
    summary='Unos ostvarene vrednosti KPI',
    description='Rukovodilac unosi napredak za zaposlene iz svog tima. Datum ne može biti pre početka perioda.',
    request=OstvareniKPIRequestSerializer,
    responses={201: OstvareniKPISerializer, 400: ODG_400, 401: ODG_401, 403: ODG_403},
)
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_ostvareni_kpi(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        dozvoljeni_ids = dodeljeni_za_korisnika(user).values_list('id', flat=True)
        ostvareni = Ostvareni_KPI.objects.filter(dodeljeni_kpi_id__in=dozvoljeni_ids).select_related('rukovodilac')
        dodeljeni_id = request.query_params.get('dodeljeni_kpi')
        if dodeljeni_id:
            ostvareni = ostvareni.filter(dodeljeni_kpi_id=dodeljeni_id)
        return Response(OstvareniKPISerializer(ostvareni, many=True).data)

    if not moze_da_upravlja(user):
        return Response({'error': 'Nemate dozvolu za unos ostvarenog KPI.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    dodeljeni_id = data.get('dodeljeni_kpi')
    datum = data.get('datum')
    if not dodeljeni_id or not datum:
        return Response({'error': 'Dodeljeni KPI i datum su obavezni.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        dodeljeni = Dodeljeni_KPI.objects.select_related('korisnik', 'kpi').get(id=dodeljeni_id)
    except Dodeljeni_KPI.DoesNotExist:
        return Response({'error': 'Dodeljeni KPI nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    if not sme_za_zaposlenog(user, dodeljeni.korisnik):
        return Response({'error': 'Možete unositi napredak samo za zaposlene iz svog tima.'}, status=status.HTTP_403_FORBIDDEN)

    vrednost, greska = u_decimal(data.get('ostvarena_vrednost'), 'Ostvarena vrednost')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)

    try:
        datum_d = date.fromisoformat(str(datum))
    except ValueError:
        return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_d < dodeljeni.datum_Od:
        return Response({'error': 'Datum unosa ne može biti pre početka perioda dodeljenog KPI.'}, status=status.HTTP_400_BAD_REQUEST)

    ostvareni = Ostvareni_KPI(
        dodeljeni_kpi=dodeljeni,
        ostvarena_vrednost=vrednost,
        datum=datum_d,
        opis=data.get('opis', ''),
        rukovodilac=user,
    )
    try:
        ostvareni.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    ostvareni.save()
    return Response(OstvareniKPISerializer(ostvareni).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@extend_schema(
    tags=['KPI'],
    summary='Brisanje unosa ostvarene vrednosti',
    responses={200: UspehSerializer, 401: ODG_401, 403: ODG_403, 404: ODG_404},
)
@api_view(['DELETE'])
@permission_classes([AllowAny])
def api_ostvareni_kpi_detalj(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        ostvareni = Ostvareni_KPI.objects.select_related('dodeljeni_kpi__korisnik').get(id=id)
    except Ostvareni_KPI.DoesNotExist:
        return Response({'error': 'Unos nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if not sme_za_zaposlenog(request.user, ostvareni.dodeljeni_kpi.korisnik):
        return Response({'error': 'Nemate dozvolu za brisanje ovog unosa.'}, status=status.HTTP_403_FORBIDDEN)
    ostvareni.delete()
    return Response({'success': True})
