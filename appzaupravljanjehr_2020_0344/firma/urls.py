from django.urls import path
from firma.views import (
    organizaciona_jedinica_create,
    radno_mesto_create,
)

urlpatterns = [
    path('organizacione-jedinice/nova/', organizaciona_jedinica_create, name='organizaciona_jedinica_create'),
    path('radna-mesta/novo/', radno_mesto_create, name='radno_mesto_create'),
]