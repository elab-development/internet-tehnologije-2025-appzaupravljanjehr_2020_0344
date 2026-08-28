from django.urls import path
from plate.views import api_plate, api_plata, api_plate_pregled, api_isplate, api_isplata

urlpatterns = [
    path('api/plate/', api_plate, name='api_plate'),
    path('api/plate/pregled/', api_plate_pregled, name='api_plate_pregled'),
    path('api/plate/<int:id>/', api_plata, name='api_plata'),
    path('api/isplate/', api_isplate, name='api_isplate'),
    path('api/isplate/<int:id>/', api_isplata, name='api_isplata'),
]
