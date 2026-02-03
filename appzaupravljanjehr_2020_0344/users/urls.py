from django.urls import path
from django.shortcuts import redirect
from users.views import (
    login_view,
    logout_view,
    profile_view,
    update_profile,
    profile_create,
    profile_save,
    users_list,
    delete_user,
    profile_detail,
    update_user,
    home_view,
    api_korisnici,
    api_korisnik_detalji,
    api_korisnik_kreiraj,
    api_korisnik_obrisi,
    api_korisnik_update,
)

urlpatterns = [
    path('', home_view, name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('profile/azuriraj/', update_profile, name='update_profile'),
    path('profile/kreiraj/', profile_create, name='profile_create'),
    path('profile/sacuvaj/', profile_save, name='profile_save'),
    path('profile/list/', users_list, name='users_list'),
    path('profile/<int:user_id>/', profile_detail, name='profile_detail'),
    path('profile/edit/', profile_create, name='profile_edit'),
    path('user/update/<int:user_id>/', update_user, name='update_user'),
    path('user/delete/<int:user_id>/', delete_user, name='delete_user'),
    # api rute
    path('api/korisnici/', api_korisnici, name='api_korisnici'),
    path('api/korisnici/<int:id>/', api_korisnik_detalji, name='api_korisnik_detalji'),
    path('api/korisnici/kreiraj/', api_korisnik_kreiraj, name='api_korisnik_kreiraj'),
    path('api/korisnici/obrisi/<int:id>/', api_korisnik_obrisi, name='api_korisnik_obrisi'),
    path('api/korisnici/update/<int:id>/', api_korisnik_update, name='api_korisnik_update'),
]
