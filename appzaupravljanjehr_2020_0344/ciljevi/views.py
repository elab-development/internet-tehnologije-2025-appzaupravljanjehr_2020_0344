from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from ciljevi.models import Tip_cilja, Cilj, Dodeljeni_cilj
from ciljevi.serializers import TipCiljaSerializer, CiljSerializer, DodeljeniCiljSerializer
from users.models import Korisnik
from firma.models import Organizaciona_jedinica, Radno_mesto


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_tipovi_ciljeva(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        tipovi = Tip_cilja.objects.all()
        return Response(TipCiljaSerializer(tipovi, many=True).data)

    if request.user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za kreiranje tipa cilja.'}, status=status.HTTP_403_FORBIDDEN)

    naziv = request.data.get('naziv')
    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)

    if Tip_cilja.objects.filter(naziv=naziv).exists():
        return Response({'error': 'Tip cilja sa tim nazivom već postoji.'}, status=status.HTTP_400_BAD_REQUEST)

    tip = Tip_cilja.objects.create(naziv=naziv)
    return Response(TipCiljaSerializer(tip).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_ciljevi(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        ciljevi = Cilj.objects.all()
        return Response(CiljSerializer(ciljevi, many=True).data)

    if request.user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za kreiranje cilja.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    naziv = data.get('naziv')
    tip_cilja_id = data.get('tip_cilja')
    cilj_status = data.get('status', 'aktivan')

    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
    if not tip_cilja_id:
        return Response({'error': 'Tip cilja je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tip_cilja = Tip_cilja.objects.get(id=tip_cilja_id)
    except Tip_cilja.DoesNotExist:
        return Response({'error': 'Tip cilja nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    cilj = Cilj.objects.create(
        naziv=naziv,
        tip_cilja=tip_cilja,
        status=cilj_status
    )
    return Response(CiljSerializer(cilj).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_cilj(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        cilj = Cilj.objects.get(id=id)
    except Cilj.DoesNotExist:
        return Response({'error': 'Cilj nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CiljSerializer(cilj).data)

    if request.method == 'DELETE':
        if request.user.role not in ['superuser', 'administrator']:
            return Response({'error': 'Nemate dozvolu za brisanje cilja.'}, status=status.HTTP_403_FORBIDDEN)
        cilj.delete()
        return Response({'success': True})

    if request.user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za izmenu cilja.'}, status=status.HTTP_403_FORBIDDEN)   

    data = request.data
    cilj.naziv = data.get('naziv', cilj.naziv)
    cilj.status = data.get('status', cilj.status)
    if data.get('tip_cilja'):
        try:
            cilj.tip_cilja = Tip_cilja.objects.get(id=data.get('tip_cilja'))
        except Tip_cilja.DoesNotExist:
            return Response({'error': 'Tip cilja nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)
    cilj.save()
    return Response(CiljSerializer(cilj).data)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_dodeljeni_ciljevi(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        user = request.user

        if user.role in ['superuser', 'administrator']:
            dodeljeni = Dodeljeni_cilj.objects.all()
        elif user.role == 'rukovodilac':
            podredjeni_ids = Korisnik.objects.filter(rukovodilac=user).values_list('id', flat=True)
            dodeljeni = Dodeljeni_cilj.objects.filter(zaposleni_id__in=list(podredjeni_ids) + [user.id])
        else:
            dodeljeni = Dodeljeni_cilj.objects.filter(zaposleni=user)

        return Response(DodeljeniCiljSerializer(dodeljeni, many=True).data)
        
    if request.user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za dodelu ciljeva.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    cilj_id = data.get('cilj')
    zaposleni_id = data.get('zaposleni')
    datum_od = data.get('datum_Od')
    datum_do = data.get('datum_Do')

    if not all([cilj_id, zaposleni_id, datum_od, datum_do]):
        return Response({'error': 'Sva polja su obavezna.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cilj = Cilj.objects.get(id=cilj_id)
    except Cilj.DoesNotExist:
        return Response({'error': 'Cilj nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        zaposleni = Korisnik.objects.get(id=zaposleni_id)
    except Korisnik.DoesNotExist:
        return Response({'error': 'Korisnik nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user

    if user.role == 'administrator':
        if zaposleni.role not in ['rukovodilac', 'administrator']:
            return Response({'error': 'Administrator može da dodeljuje ciljeve samo rukovodiocima i drugim administratorima.'}, status=status.HTTP_403_FORBIDDEN)

    elif user.role == 'rukovodilac':
        if zaposleni.role == 'rukovodilac':
            return Response({'error': 'Rukovodilac ne može da dodeljuje ciljeve drugim rukovodiocima.'}, status=status.HTTP_403_FORBIDDEN)
        if zaposleni.rukovodilac != user:
            return Response({'error': 'Možete dodeljivati ciljeve samo svojim zaposlenima.'}, status=status.HTTP_403_FORBIDDEN)

    if datum_do < datum_od:
        return Response({'error': 'Datum završetka ne može biti pre datuma početka.'}, status=status.HTTP_400_BAD_REQUEST)

    if Dodeljeni_cilj.objects.filter(cilj=cilj, zaposleni=zaposleni, datum_Od=datum_od, datum_Do=datum_do).exists():
        return Response({'error': 'Ovaj cilj je već dodeljen ovom korisniku za navedeni period.'}, status=status.HTTP_400_BAD_REQUEST)

    dodeljeni = Dodeljeni_cilj.objects.create(
        cilj=cilj,
        zaposleni=zaposleni,
        datum_Od=datum_od,
        datum_Do=datum_do
    )
    return Response(DodeljeniCiljSerializer(dodeljeni).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def api_dodeli_cilj_masovno(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.user.role not in ['superuser', 'administrator', 'rukovodilac']:
        return Response({'error': 'Nemate dozvolu za dodelu ciljeva.'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    cilj_id = data.get('cilj')
    datum_od = data.get('datum_Od')
    datum_do = data.get('datum_Do')
    org_jedinica_id = data.get('organizaciona_jedinica')
    radno_mesto_id = data.get('radno_mesto')
    zaposleni_ids = data.get('zaposleni_ids', [])

    if not all([cilj_id, datum_od, datum_do]):
        return Response({'error': 'Cilj i datumi su obavezni.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_do < datum_od:
        return Response({'error': 'Datum završetka ne može biti pre datuma početka.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cilj = Cilj.objects.get(id=cilj_id)
    except Cilj.DoesNotExist:
        return Response({'error': 'Cilj nije pronađen.'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user

    korisnici = Korisnik.objects.all()

    if zaposleni_ids:
        korisnici = korisnici.filter(id__in=zaposleni_ids)
    elif radno_mesto_id:
        korisnici = korisnici.filter(radno_mesto_id=radno_mesto_id)
    elif org_jedinica_id:
        korisnici = korisnici.filter(organizaciona_jedinica_id=org_jedinica_id)
    else:
        return Response({'error': 'Morate izabrati korisnike, radno mesto ili organizacionu jedinicu.'}, status=status.HTTP_400_BAD_REQUEST)

    if user.role == 'administrator':
        korisnici = korisnici.filter(role__in=['rukovodilac', 'administrator', 'zaposleni'])
    elif user.role == 'rukovodilac':
        korisnici = korisnici.filter(rukovodilac=user).exclude(role='rukovodilac')

    created_count = 0
    skipped_count = 0

    for korisnik in korisnici:
        if not Dodeljeni_cilj.objects.filter(cilj=cilj, zaposleni=korisnik, datum_Od=datum_od, datum_Do=datum_do).exists():
            Dodeljeni_cilj.objects.create(
                cilj=cilj,
                zaposleni=korisnik,
                datum_Od=datum_od,
                datum_Do=datum_do
            )
            created_count += 1
        else:
            skipped_count += 1

    return Response({
        'success': True,
        'created': created_count,
        'skipped': skipped_count,
        'message': f'Cilj dodeljen {created_count} korisnika. Preskočeno {skipped_count} (već dodeljeno).'
    })

