from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from users.models import Korisnik
from firma.models import Organizaciona_jedinica, Radno_mesto
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from rest_framework.response import Response
from users.serializers import KorisnikSerializer


def login_view(request):
    if request.user.is_authenticated:
        return redirect('profile')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user=authenticate(
            request,
            username = username,
            password = password
        )

        if user is not None:
            login(request, user)
            return redirect('profile')
        else:
            messages.error(
                request,
                'Pogrešno korisničko ime ili lozinka.'
            )    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')
    

@login_required(login_url='login')
def profile_view(request):
    user = request.user

    context = {
        'user': user,
    }   

    return render(request, 'profile.html', context)

@login_required(login_url='login')
def profile_create(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za kreiranje profila')
        return redirect('profile_view')
    empty_user = Korisnik()
    organizacione_jedinice = Organizaciona_jedinica.objects.all()
    radna_mesta = Radno_mesto.objects.all()
    rukovodioci = Korisnik.objects.filter(role__in=['rukovodilac', 'administrator', 'superuser'])
    return render(request, 'profile_edit.html', {
        'user': empty_user,
        'is_create_mode': True,
        'organizacione_jedinice': organizacione_jedinice, 
        'radna_mesta': radna_mesta,
        'rukovodioci': rukovodioci,
    })

@login_required(login_url='login')
def update_profile(request):
    if request.method == 'POST':
        user = request.user

        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.srednje_ime = request.POST.get('srednje_ime', user.srednje_ime)
        user.pol = request.POST.get('pol', user.pol)
        datum = request.POST.get('datum_rodjenja')
        if datum:
            user.datum_rodjenja = datum
        user.adresa = request.POST.get('adresa', user.adresa)
        user.broj_telefona = request.POST.get('broj_telefona', user.broj_telefona)
        user.email = request.POST.get('email', user.email)
        user.strucna_sprema = request.POST.get('strucna_sprema', user.strucna_sprema)

        user.save()
        
        messages.success(request, 'Profil je uspešno ažuriran.')
        return redirect('profile')
    
    return render(request,'profile_edit.html') 

@login_required(login_url='login')
def profile_save(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za kreiranje profila.')
        return redirect('profile')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        jmbg = request.POST.get('jmbg', '').strip()

        if not username:
            messages.error(request, 'Korisničko ime je obavezno.')
            return redirect('profile_create')

        if not jmbg:
            messages.error(request, 'JMBG je obavezan.')
            return redirect('profile_create')

        if Korisnik.objects.filter(username=username).exists():
            messages.error(request, 'Korisničko ime već postoji.')
            return redirect('profile_create')

        if Korisnik.objects.filter(jmbg=jmbg).exists():
            messages.error(request, 'Korisnik sa ovim JMBG već postoji.')
            return redirect('profile_create')

        org_jedinica_id = request.POST.get('organizaciona_jedinica')
        radno_mesto_id = request.POST.get('radno_mesto')
        rukovodilac_id = request.POST.get('rukovodilac')

        organizaciona_jedinica = None 
        if org_jedinica_id:
            organizaciona_jedinica = Organizaciona_jedinica.objects.filter(id=org_jedinica_id).first()

        radno_mesto = None
        if radno_mesto_id:
            radno_mesto = Radno_mesto.objects.filter(id=radno_mesto_id).first()

        rukovodilac = None
        if rukovodilac_id:
            rukovodilac = Korisnik.objects.filter(id=rukovodilac_id).first()  

        is_active = request.POST.get('is_active') == 'on'    
        
        new_user = Korisnik.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=request.POST.get('first_name', ''),
            last_name=request.POST.get('last_name', ''),
            srednje_ime=request.POST.get('srednje_ime', ''),
            pol=request.POST.get('pol', ''),
            datum_rodjenja=request.POST.get('datum_rodjenja') or None,
            adresa=request.POST.get('adresa', ''),
            broj_telefona=request.POST.get('broj_telefona', ''),
            strucna_sprema=request.POST.get('strucna_sprema', ''),
            role=request.POST.get('role', 'zaposleni'),
            jmbg = request.POST.get('jmbg', ''),
            mesto_rodjenja = request.POST.get('mesto_rodjenja', ''),
            drzava = request.POST.get('drzava', ''),
            organizaciona_jedinica=organizaciona_jedinica,
            radno_mesto=radno_mesto,
            rukovodilac=rukovodilac,
            is_active=is_active,
        )
        new_user.save()
        
        messages.success(request, f'Profil za {new_user.get_full_name()} je uspešno kreiran.')
        return redirect('users_list') 
    
    return redirect('profile')

@login_required(login_url='login')
def users_list(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za pristup listi korisnika.')
        return redirect('profile')

    users = Korisnik.objects.all()
    return render(request, 'users_list.html', {'users': users})


@login_required(login_url='login')
def delete_user(request, user_id):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za brisanje korisnika.')
        return redirect('users_list')

    user_to_delete = get_object_or_404(Korisnik, id=user_id)

    # Ne dozvoli brisanje sopstvenog naloga
    if user_to_delete == request.user:
        messages.error(request, 'Ne možete obrisati sopstveni nalog.')
        return redirect('users_list')

    user_name = user_to_delete.get_full_name()
    user_to_delete.delete()

    messages.success(request, f'Korisnik {user_name} je uspešno obrisan.')
    return redirect('users_list')


@login_required(login_url='login')
def profile_detail(request, user_id):
    user = get_object_or_404(Korisnik, id=user_id)
    return render(request, 'profile.html', {'user': user})


@login_required(login_url='login')
def update_user(request, user_id):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za izmenu korisnika.')
        return redirect('users_list')

    user = get_object_or_404(Korisnik, id=user_id)

    if request.method == 'POST':
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.srednje_ime = request.POST.get('srednje_ime', user.srednje_ime)
        user.pol = request.POST.get('pol', user.pol)
        datum = request.POST.get('datum_rodjenja')
        if datum:
            user.datum_rodjenja = datum
        user.adresa = request.POST.get('adresa', user.adresa)
        user.broj_telefona = request.POST.get('broj_telefona', user.broj_telefona)
        user.email = request.POST.get('email', user.email)
        user.strucna_sprema = request.POST.get('strucna_sprema', user.strucna_sprema)
        user.jmbg = request.POST.get('jmbg', user.jmbg)
        user.mesto_rodjenja = request.POST.get('mesto_rodjenja', user.mesto_rodjenja)
        user.drzava = request.POST.get('drzava', user.drzava)

        user.save()

        messages.success(request, f'Korisnik {user.get_full_name()} je uspešno ažuriran.')
        return redirect('users_list')

    return render(request, 'profile_edit.html', {'user': user, 'is_update_mode': True})


def home_view(request):
    broj_korisnika = Korisnik.objects.count()
    return render(request, 'home.html', {'broj_korisnika': broj_korisnika})

@api_view(['GET'])
def api_korisnici(request):
    korisnici = Korisnik.objects.all()
    serializer = KorisnikSerializer(korisnici, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def api_korisnik_detalji(request, id):
    korisnik = Korisnik.objects.get(id=id)
    serializer = KorisnikSerializer(korisnik)
    return Response(serializer.data)

@api_view(['POST'])
def api_korisnik_kreiraj(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    jmbg = request.data.get('jmbg')

    korisnik = Korisnik.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        jmbg=jmbg,
        srednje_ime='',
        datum_rodjenja='2000-01-01',
        adresa='',
        strucna_sprema='',
        broj_telefona='',
    )
    serializer = KorisnikSerializer(korisnik)
    return Response(serializer.data) 

@api_view(['DELETE'])
def api_korisnik_obrisi(request, id):
    korisnik = Korisnik.objects.get(id=id)
    korisnik.delete()
    return Response({'poruka': 'korisnik obrisan'})

@api_view(['PUT'])
def api_korisnik_update(request, id):
    korisnik = Korisnik.objects.get(id=id)
    korisnik.first_name = request.data.get('first_name', korisnik.first_name)
    korisnik.last_name = request.data.get('last_name', korisnik.last_name)
    korisnik.email = request.data.get('email', korisnik.email)
    korisnik.broj_telefona = request.data.get('broj_telefona', korisnik.broj_telefona)
    korisnik.save()
    serializer = KorisnikSerializer(korisnik)
    return Response(serializer.data)   