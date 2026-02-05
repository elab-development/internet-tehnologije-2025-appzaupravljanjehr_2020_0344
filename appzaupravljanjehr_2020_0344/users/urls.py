from django.urls import path
from users.views import api_login, api_logout, api_korisnici, api_korisnik

urlpatterns = [
    path('api/login/', api_login, name='api_login'),
    path('api/logout/', api_logout, name='api_logout'),
    path('api/korisnici/', api_korisnici, name='api_korisnici'),
    path('api/korisnici/<int:id>/', api_korisnik, name='api_korisnik'),
]
