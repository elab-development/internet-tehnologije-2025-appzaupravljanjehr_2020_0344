from django.urls import path
from odsustva.views import api_odmori, api_odmor, api_stanje_odmora

urlpatterns = [
    path('api/odmori/', api_odmori, name='api_odmori'),
    path('api/odmori/stanje/', api_stanje_odmora, name='api_stanje_odmora'),
    path('api/odmori/<int:id>/', api_odmor, name='api_odmor'),
]
