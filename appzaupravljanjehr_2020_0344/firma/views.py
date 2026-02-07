from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from firma.models import Organizaciona_jedinica, Radno_mesto
from firma.serializers import OrganizacionaJedinicaSerializer, RadnoMestoSerializer

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_organizacione_jedinice(request):
    #GET - lista organizacionih jedinica 
    #POST - kreiranje org jed 
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        jedinice = Organizaciona_jedinica.objects.all()
        return Response(OrganizacionaJedinicaSerializer(jedinice, many=True).data)

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za kreiranje organizacione jedinice.'}, status=status.HTTP_403_FORBIDDEN) 

    data = request.data
    naziv = data.get('naziv')
    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)

    nadredjena = None
    if data.get('nadredjena_org_jed'):
        nadredjena = Organizaciona_jedinica.objects.filter(id=data.get('nadredjena_org_jed')).first()

    jedinica = Organizaciona_jedinica.objects.create(
        naziv=naziv,
        opis=data.get('opis', ''),
        nadredjena_org_jed=nadredjena
    )
    return Response(OrganizacionaJedinicaSerializer(jedinica).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_organizaciona_jedinica(request, id):
    #GET - Detalji organizacione jedinice
    #PUT - Izmena organizacione jedinice
    #DELETE - Brisanje organizacione jedinice
    
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        jedinica = Organizaciona_jedinica.objects.get(id=id)
    except Organizaciona_jedinica.DoesNotExist:
        return Response({'error': 'Organizaciona jedinica nije pronađena.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(OrganizacionaJedinicaSerializer(jedinica).data)

    if request.method == 'DELETE':
        if request.user.role != 'superuser':
            return Response({'error': 'Samo superuser može da briše organizacione jedinice.'}, status=status.HTTP_403_FORBIDDEN)
        jedinica.delete()
        return Response({'success': True})

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za izmenu organizacione jedinice.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    jedinica.naziv = data.get('naziv', jedinica.naziv)
    jedinica.opis = data.get('opis', jedinica.opis)
    if 'nadredjena_org_jed' in data:
        if data.get('nadredjena_org_jed'):
            jedinica.nadredjena_org_jed = Organizaciona_jedinica.objects.filter(id=data.get('nadredjena_org_jed')).first()
        else:
            jedinica.nadredjena_org_jed = None
    jedinica.save()
    return Response(OrganizacionaJedinicaSerializer(jedinica).data)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def api_radna_mesta(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        mesta = Radno_mesto.objects.all()
        return Response(RadnoMestoSerializer(mesta, many=True).data)

    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za kreiranje radnog mesta.'}, status=status.HTTP_403_FORBIDDEN)    

    data = request.data
    naziv = data.get('naziv')
    org_jed_id = data.get('org_jed')

    if not naziv:
        return Response({'error': 'Naziv je obavezan.'}, status=status.HTTP_400_BAD_REQUEST)
    if not org_jed_id:
        return Response({'error': 'Organizaciona jedinica je obavezna.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        org_jed = Organizaciona_jedinica.objects.get(id=org_jed_id)
    except Organizaciona_jedinica.DoesNotExist:
        return Response({'error': 'Organizaciona jedinica nije pronadjena.'}, status=status.HTTP_400_BAD_REQUEST)

    mesto = Radno_mesto.objects.create(
        naziv=naziv,
        opis=data.get('opis', ''),
        org_jed=org_jed
    )
    return Response(RadnoMestoSerializer(mesto).data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def api_radno_mesto(request, id):
    #GET - Detalji radnog mesta 
    #PUT - Izmena radnog mesta 
    #DELETE - Brisanje radnog mesta 
    
    if not request.user.is_authenticated:
        return Response({'error': 'Morate biti ulogovani.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        mesto = Radno_mesto.objects.get(id=id)
    except Radno_mesto.DoesNotExist:
        return Response({'error': 'Radno mesto nije pronađeno.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(RadnoMestoSerializer(mesto).data)

    if request.method == 'DELETE':
        if request.user.role != 'superuser':
            return Response({'error': 'Samo superuser može da briše radna mesta.'}, status=status.HTTP_403_FORBIDDEN)
        mesto.delete()
        return Response({'success': True})

    
    if request.user.role not in ['superuser', 'administrator']:
        return Response({'error': 'Nemate dozvolu za izmenu radnog mesta.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    mesto.naziv = data.get('naziv', mesto.naziv)
    mesto.opis = data.get('opis', mesto.opis)
    if 'org_jed' in data:
        try:
            mesto.org_jed = Organizaciona_jedinica.objects.get(id=data.get('org_jed'))
        except Organizaciona_jedinica.DoesNotExist:
            return Response({'error': 'Organizaciona jedinica nije pronađena.'}, status=status.HTTP_400_BAD_REQUEST)
    mesto.save()
    return Response(RadnoMestoSerializer(mesto).data)

