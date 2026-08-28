from django.urls import path
from ocenjivanje.views import (
    api_oblasti_ocenjivanja,
    api_tezinski_koeficijenti,
    api_tezinski_koeficijent,
    api_ocene,
    api_ocena,
)

urlpatterns = [
    path('api/oblasti-ocenjivanja/', api_oblasti_ocenjivanja, name='api_oblasti_ocenjivanja'),
    path('api/tezinski-koeficijenti/', api_tezinski_koeficijenti, name='api_tezinski_koeficijenti'),
    path('api/tezinski-koeficijenti/<int:id>/', api_tezinski_koeficijent, name='api_tezinski_koeficijent'),
    path('api/ocene/', api_ocene, name='api_ocene'),
    path('api/ocene/<int:id>/', api_ocena, name='api_ocena'),
]