from django.urls import path
from ciljevi.views import (
    api_tipovi_ciljeva,
    api_ciljevi,
    api_cilj,
    api_dodeljeni_ciljevi,
    api_dodeli_cilj_masovno,
)

urlpatterns = [
    path('api/tipovi-ciljeva/', api_tipovi_ciljeva, name='api_tipovi_ciljeva'),
    path('api/ciljevi/', api_ciljevi, name='api_ciljevi'),
    path('api/ciljevi/<int:id>/', api_cilj, name='api_cilj'),
    path('api/dodeljeni-ciljevi/', api_dodeljeni_ciljevi, name='api_dodeljeni_ciljevi'),
    path('api/dodeli-cilj-masovno/', api_dodeli_cilj_masovno, name='api_dodeli_cilj_masovno'),
]