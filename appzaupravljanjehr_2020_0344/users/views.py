from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

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
