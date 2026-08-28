from datetime import date
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from plate.models import Plata, Isplata
from plate.serializers import PlataSerializer, IsplataSerializer
from users.models import Korisnik
from firma.models import Radno_mesto


def je_admin(user):
    return user.role in ['superuser', 'administrator']


def u_decimal(vrednost, naziv):
    if vrednost in (None, ''):
        return None, f'{naziv} je obavezan.'
    try:
        broj = Decimal(str(vrednost))
    except (InvalidOperation, ValueError):
        return None, f'{naziv} mora biti broj.'
    if broj < 0:
        return None, f'{naziv} ne može biti negativan.'
    return broj, None


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_plate(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        plate = Plata.objects.select_related('radno_mesto', 'radno_mesto__org_jed').all()
        if not je_admin(user):
            plate = plate.filter(radno_mesto_id=user.radno_mesto_id)
        return Response(PlataSerializer(plate, many=True).data)

    if not je_admin(user):
        return Response({'error': 'Nemate dozvolu za upravljanje platama.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    radno_mesto_id = data.get('radno_mesto')
    if not radno_mesto_id:
        return Response({'error': 'Radno mesto je obavezno.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        radno_mesto = Radno_mesto.objects.get(id=radno_mesto_id)
    except Radno_mesto.DoesNotExist:
        return Response({'error': 'Radno mesto nije pronađeno.'}, status=status.HTTP_400_BAD_REQUEST)

    if Plata.objects.filter(radno_mesto=radno_mesto).exists():
        return Response({'error': 'Za ovo radno mesto plata već postoji. Izmenite postojeću.'}, status=status.HTTP_400_BAD_REQUEST)

    bruto, greska = u_decimal(data.get('bruto'), 'Bruto iznos')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
    neto, greska = u_decimal(data.get('neto'), 'Neto iznos')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)

    plata = Plata(radno_mesto=radno_mesto, bruto=bruto, neto=neto)
    try:
        plata.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    plata.save()
    return Response(PlataSerializer(plata).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_plata(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    try:
        plata = Plata.objects.get(id=id)
    except Plata.DoesNotExist:
        return Response({'error': 'Plata nije pronađena.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not je_admin(user) and plata.radno_mesto_id != user.radno_mesto_id:
            return Response({'error': 'Nemate dozvolu za pregled ove plate.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(PlataSerializer(plata).data)

    if not je_admin(user):
        return Response({'error': 'Nemate dozvolu za upravljanje platama.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        plata.delete()
        return Response({'success': True})

    data = request.data
    if 'bruto' in data:
        bruto, greska = u_decimal(data.get('bruto'), 'Bruto iznos')
        if greska:
            return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
        plata.bruto = bruto
    if 'neto' in data:
        neto, greska = u_decimal(data.get('neto'), 'Neto iznos')
        if greska:
            return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
        plata.neto = neto
    try:
        plata.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    plata.save()
    return Response(PlataSerializer(plata).data)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def api_plate_pregled(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not je_admin(request.user):
        return Response({'error': 'Nemate dozvolu za pregled finansijskih podataka.'}, status=status.HTTP_403_FORBIDDEN)

    godina = date.today().year
    rezultat = []
    korisnici = Korisnik.objects.select_related('radno_mesto', 'organizaciona_jedinica').filter(is_active=True).order_by('last_name', 'first_name')
    for k in korisnici:
        plata = Plata.objects.filter(radno_mesto_id=k.radno_mesto_id).first() if k.radno_mesto_id else None
        isplate = Isplata.objects.filter(korisnik=k)
        poslednja = isplate.first()
        ukupno_godina = isplate.filter(datum_isplate__year=godina).aggregate(
            neto=Sum('iznos_neto'), bonus=Sum('bonus')
        )
        rezultat.append({
            'id': k.id,
            'ime': k.get_full_name(),
            'role': k.role,
            'radno_mesto': k.radno_mesto_id,
            'radno_mesto_naziv': k.radno_mesto.naziv if k.radno_mesto else None,
            'organizaciona_jedinica_naziv': k.organizaciona_jedinica.naziv if k.organizaciona_jedinica else None,
            'plata_id': plata.id if plata else None,
            'bruto': str(plata.bruto) if plata else None,
            'neto': str(plata.neto) if plata else None,
            'broj_isplata': isplate.count(),
            'poslednja_isplata': poslednja.datum_isplate if poslednja else None,
            'isplaceno_neto_godina': str(ukupno_godina['neto'] or 0),
            'bonusi_godina': str(ukupno_godina['bonus'] or 0),
        })
    return Response(rezultat)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_isplate(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        isplate = Isplata.objects.select_related('korisnik', 'izmenio').all()
        if not je_admin(user):
            isplate = isplate.filter(korisnik=user)
        korisnik_id = request.query_params.get('korisnik')
        if korisnik_id:
            isplate = isplate.filter(korisnik_id=korisnik_id)
        return Response(IsplataSerializer(isplate, many=True).data)

    if not je_admin(user):
        return Response({'error': 'Nemate dozvolu za unos isplata.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    korisnik_id = data.get('korisnik')
    datum_isplate = data.get('datum_isplate')
    if not korisnik_id or not datum_isplate:
        return Response({'error': 'Zaposleni i datum isplate su obavezni.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        korisnik = Korisnik.objects.get(id=korisnik_id)
    except Korisnik.DoesNotExist:
        return Response({'error': 'Zaposleni nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        datum_d = date.fromisoformat(str(datum_isplate))
    except ValueError:
        return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)

    plata = Plata.objects.filter(radno_mesto_id=korisnik.radno_mesto_id).first() if korisnik.radno_mesto_id else None

    bruto_raw = data.get('iznos_bruto')
    neto_raw = data.get('iznos_neto')
    if bruto_raw in (None, '') and plata:
        bruto_raw = plata.bruto
    if neto_raw in (None, '') and plata:
        neto_raw = plata.neto

    bruto, greska = u_decimal(bruto_raw, 'Bruto iznos')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
    neto, greska = u_decimal(neto_raw, 'Neto iznos')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
    bonus, greska = u_decimal(data.get('bonus') if data.get('bonus') not in (None, '') else 0, 'Bonus')
    if greska:
        return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)

    isplata = Isplata(
        korisnik=korisnik,
        plata=plata,
        datum_isplate=datum_d,
        iznos_bruto=bruto,
        iznos_neto=neto,
        bonus=bonus,
        izmenio=user,
    )
    try:
        isplata.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    isplata.save()
    return Response(IsplataSerializer(isplata).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_isplata(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    try:
        isplata = Isplata.objects.get(id=id)
    except Isplata.DoesNotExist:
        return Response({'error': 'Isplata nije pronađena.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not je_admin(user) and isplata.korisnik_id != user.id:
            return Response({'error': 'Nemate dozvolu za pregled ove isplate.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(IsplataSerializer(isplata).data)

    if not je_admin(user):
        return Response({'error': 'Nemate dozvolu za izmenu isplata.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        isplata.delete()
        return Response({'success': True})

    data = request.data
    if data.get('datum_isplate'):
        try:
            isplata.datum_isplate = date.fromisoformat(str(data.get('datum_isplate')))
        except ValueError:
            return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)
    for polje, naziv in [('iznos_bruto', 'Bruto iznos'), ('iznos_neto', 'Neto iznos'), ('bonus', 'Bonus')]:
        if polje in data:
            vrednost, greska = u_decimal(data.get(polje), naziv)
            if greska:
                return Response({'error': greska}, status=status.HTTP_400_BAD_REQUEST)
            setattr(isplata, polje, vrednost)
    isplata.izmenio = user
    try:
        isplata.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    isplata.save()
    return Response(IsplataSerializer(isplata).data)
