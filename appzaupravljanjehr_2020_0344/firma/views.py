from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from firma.models import Organizaciona_jedinica, Radno_mesto

@login_required(login_url='login')
def organizaciona_jedinica_create(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za kreiranje organizacione jedinice.')
        return redirect('profile')

    jedinice = Organizaciona_jedinica.objects.all()

    if request.method == 'POST':
        naziv = request.POST.get('naziv')
        opis = request.POST.get('opis', '')
        nadredjena_id = request.POST.get('nadredjena_org_jed')

        if not naziv:
            messages.error(request, 'Naziv je obavezan.')
            return render(request, 'organizaciona_jedinica.html', {'jedinice': jedinice})

        nadredjena = None
        if nadredjena_id:
            nadredjena = Organizaciona_jedinica.objects.filter(id=nadredjena_id).first()

        Organizaciona_jedinica.objects.create(
            naziv=naziv,
            opis=opis,
            nadredjena_org_jed=nadredjena
        )

        messages.success(request, f'Organizaciona jedinica "{naziv}" je uspešno kreirana.')
        return redirect('users_list')

    return render(request, 'organizaciona_jedinica.html', {'jedinice': jedinice})


@login_required(login_url='login')
def radno_mesto_create(request):
    if not request.user.is_staff:
        messages.error(request, 'Nemate dozvolu za kreiranje radnog mesta.')
        return redirect('profile')

    jedinice = Organizaciona_jedinica.objects.all()

    if request.method == 'POST':
        naziv = request.POST.get('naziv')
        opis = request.POST.get('opis', '')
        org_jed_id = request.POST.get('org_jed')

        if not naziv:
            messages.error(request, 'Naziv je obavezan.')
            return render(request, 'radno_mesto.html', {'jedinice': jedinice})

        if not org_jed_id:
            messages.error(request, 'Organizaciona jedinica je obavezna.')
            return render(request, 'radno_mesto.html', {'jedinice': jedinice})

        org_jed = get_object_or_404(Organizaciona_jedinica, id=org_jed_id)

        Radno_mesto.objects.create(
            naziv=naziv,
            opis=opis,
            org_jed=org_jed
        )

        messages.success(request, f'Radno mesto "{naziv}" je uspešno kreirano.')
        return redirect('users_list')

    return render(request, 'radno_mesto.html', {'jedinice': jedinice})
