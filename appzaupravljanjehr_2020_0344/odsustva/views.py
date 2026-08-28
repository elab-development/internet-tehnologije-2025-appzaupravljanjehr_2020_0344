from datetime import date
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from odsustva.models import Odmor, stanje_odmora, broj_radnih_dana
from odsustva.serializers import OdmorSerializer, OdmorDetaljSerializer
from users.models import Korisnik


def odmori_za_korisnika(user):
    if user.role in ['superuser', 'administrator']:
        return Odmor.objects.all()
    if user.role == 'rukovodilac':
        podredjeni_ids = list(Korisnik.objects.filter(rukovodilac=user).values_list('id', flat=True))
        return Odmor.objects.filter(zaposleni_id__in=podredjeni_ids + [user.id])
    return Odmor.objects.filter(zaposleni=user)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_odmori(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    if request.method == 'GET':
        odmori = odmori_za_korisnika(user).select_related('zaposleni', 'rukovodilac', 'obradio', 'zaposleni__organizaciona_jedinica')
        status_filter = request.query_params.get('status')
        if status_filter:
            odmori = odmori.filter(status=status_filter)
        zaposleni_id = request.query_params.get('zaposleni')
        if zaposleni_id:
            odmori = odmori.filter(zaposleni_id=zaposleni_id)
        return Response(OdmorSerializer(odmori, many=True).data)

    data = request.data
    datum_od = data.get('datum_Od')
    datum_do = data.get('datum_Do')

    if not datum_od or not datum_do:
        return Response({'error': 'Period (od - do) je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        datum_od_d = date.fromisoformat(str(datum_od))
        datum_do_d = date.fromisoformat(str(datum_do))
    except ValueError:
        return Response({'error': 'Neispravan format datuma.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_do_d < datum_od_d:
        return Response({'error': 'Nevalidan period: datum završetka ne može biti pre datuma početka.'}, status=status.HTTP_400_BAD_REQUEST)

    if datum_od_d.year != datum_do_d.year:
        return Response({'error': 'Period odmora mora biti unutar jedne kalendarske godine.'}, status=status.HTTP_400_BAD_REQUEST)

    dana = broj_radnih_dana(datum_od_d, datum_do_d)
    if dana == 0:
        return Response({'error': 'Izabrani period ne sadrži nijedan radni dan.'}, status=status.HTTP_400_BAD_REQUEST)

    stanje = stanje_odmora(user, datum_od_d.year)
    if dana > stanje['preostalo']:
        return Response({
            'error': f"Nema dovoljno preostalih dana. Traženo: {dana}, preostalo: {stanje['preostalo']}.",
            'stanje': stanje,
        }, status=status.HTTP_400_BAD_REQUEST)

    preklapanje = Odmor.objects.filter(
        zaposleni=user,
        status__in=[Odmor.NA_CEKANJU, Odmor.ODOBREN],
        datum_Od__lte=datum_do_d,
        datum_Do__gte=datum_od_d,
    ).exists()
    if preklapanje:
        return Response({'error': 'Već imate zahtev za odmor koji se preklapa sa ovim periodom.'}, status=status.HTTP_400_BAD_REQUEST)

    odmor = Odmor(
        zaposleni=user,
        rukovodilac=user.rukovodilac,
        datum_Od=datum_od_d,
        datum_Do=datum_do_d,
        napomena=data.get('napomena', ''),
    )
    try:
        odmor.clean()
    except ValidationError as e:
        return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
    odmor.save()
    return Response(OdmorDetaljSerializer(odmor).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_odmor(request, id):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    try:
        odmor = odmori_za_korisnika(user).get(id=id)
    except Odmor.DoesNotExist:
        return Response({'error': 'Zahtev za odmor nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(OdmorDetaljSerializer(odmor).data)

    if request.method == 'DELETE':
        je_vlasnik = odmor.zaposleni_id == user.id
        if not je_vlasnik and user.role not in ['superuser', 'administrator']:
            return Response({'error': 'Nemate dozvolu za brisanje ovog zahteva.'}, status=status.HTTP_403_FORBIDDEN)
        if je_vlasnik and odmor.status != Odmor.NA_CEKANJU and user.role not in ['superuser', 'administrator']:
            return Response({'error': 'Možete povući samo zahtev koji je na čekanju.'}, status=status.HTTP_400_BAD_REQUEST)
        odmor.delete()
        return Response({'success': True})

    if user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Samo administrator može da odobri ili odbije zahtev.'}, status=status.HTTP_403_FORBIDDEN)

    if odmor.status != Odmor.NA_CEKANJU:
        return Response({'error': f'Zahtev je već obrađen (status: {odmor.get_status_display()}).'}, status=status.HTTP_400_BAD_REQUEST)

    novi_status = request.data.get('status')
    if novi_status == Odmor.ODOBREN:
        stanje = stanje_odmora(odmor.zaposleni, odmor.datum_Od.year, iskljuci_id=odmor.id)
        if odmor.broj_dana > stanje['preostalo']:
            return Response({
                'error': f"Zaposleni nema dovoljno preostalih dana (preostalo: {stanje['preostalo']}, traženo: {odmor.broj_dana}).",
            }, status=status.HTTP_400_BAD_REQUEST)
        odmor.status = Odmor.ODOBREN
        odmor.razlog_odbijanja = None
    elif novi_status == Odmor.ODBIJEN:
        razlog = (request.data.get('razlog_odbijanja') or '').strip()
        if not razlog:
            return Response({'error': 'Razlog odbijanja je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
        odmor.status = Odmor.ODBIJEN
        odmor.razlog_odbijanja = razlog
    else:
        return Response({'error': "Status mora biti 'odobren' ili 'odbijen'."}, status=status.HTTP_400_BAD_REQUEST)

    odmor.obradio = user
    odmor.datum_obrade = timezone.now()
    odmor.save()
    return Response(OdmorDetaljSerializer(odmor).data)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def api_stanje_odmora(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    zaposleni = user
    zaposleni_id = request.query_params.get('zaposleni')
    if zaposleni_id and int(zaposleni_id) != user.id:
        if user.role not in ['superuser', 'administrator', 'rukovodilac']:
            return Response({'error': 'Nemate dozvolu za pregled stanja drugih zaposlenih.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            zaposleni = Korisnik.objects.get(id=zaposleni_id)
        except Korisnik.DoesNotExist:
            return Response({'error': 'Zaposleni nije pronađen.'}, status=status.HTTP_404_NOT_FOUND)
        if user.role == 'rukovodilac' and zaposleni.rukovodilac_id != user.id:
            return Response({'error': 'Možete videti samo stanje zaposlenih iz svog tima.'}, status=status.HTTP_403_FORBIDDEN)

    godina = request.query_params.get('godina')
    try:
        godina = int(godina) if godina else date.today().year
    except ValueError:
        return Response({'error': 'Neispravna godina.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(stanje_odmora(zaposleni, godina))
