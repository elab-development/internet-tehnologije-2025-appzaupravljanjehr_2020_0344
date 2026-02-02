from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from users.models import Korisnik
from django.contrib.auth.decorators import login_required


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
    return render(request, 'profile_edit.html', {
        'user': empty_user,
        'is_create_mode': True
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
    
    return redirect('profile_edit') 

@login_required(login_url='login')
def profile_save(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za kreiranje profila.')
        return redirect('profile_view')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if Korisnik.objects.filter(username=username).exists():
            messages.error(request, 'Korisničko ime već postoji.')
            return redirect('profile')
        
        new_user = Korisnik.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=request.POST.get('first_name', ''),
            last_name=request.POST.get('last_name', ''),
            srednje_ime=request.POST.get('srednje_ime', ''),
            pol=request.POST.get('pol', ''),
            datum_rodjenja=request.POST.get('datum_rodjenja', ''),
            adresa=request.POST.get('adresa', ''),
            broj_telefona=request.POST.get('broj_telefona', ''),
            strucna_sprema=request.POST.get('strucna_sprema', ''),
            role=request.POST.get('role', 'zaposleni'),
            jmbg = request.POST.get('jmbg', ''),
            mesto_rodjenja = request.POST.get('mesto_rodjenja', ''),
            drzava = request.POST.get('drzava', '')
        )
        new_user.save()
        
        messages.success(request, f'Profil za {new_user.get_full_name()} je uspešno kreiran.')
        return redirect('profile_view') 
    
    return redirect('profile')
