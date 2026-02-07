from django.urls import path
from firma.views import (
    api_organizacione_jedinice,
    api_organizaciona_jedinica,
    api_radna_mesta,
    api_radno_mesto
)

urlpatterns = [
    path('api/organizacione-jedinice/', api_organizacione_jedinice, name='api_organizacione_jedinice'),
    path('api/organizacione-jedinice/<int:id>/', api_organizaciona_jedinica, name='api_organizaciona_jedinica'),
    path('api/radna-mesta/', api_radna_mesta, name='api_radna_mesta'),
    path('api/radna-mesta/<int:id>/', api_radno_mesto, name='api_radno_mesto'),

]