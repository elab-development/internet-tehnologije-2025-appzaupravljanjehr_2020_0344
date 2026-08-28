from django.urls import path
from kpi.views import (
    api_kpi,
    api_kpi_detalj,
    api_dodeljeni_kpi,
    api_dodeljeni_kpi_detalj,
    api_ostvareni_kpi,
    api_ostvareni_kpi_detalj,
)

urlpatterns = [
    path('api/kpi/', api_kpi, name='api_kpi'),
    path('api/kpi/<int:id>/', api_kpi_detalj, name='api_kpi_detalj'),
    path('api/dodeljeni-kpi/', api_dodeljeni_kpi, name='api_dodeljeni_kpi'),
    path('api/dodeljeni-kpi/<int:id>/', api_dodeljeni_kpi_detalj, name='api_dodeljeni_kpi_detalj'),
    path('api/ostvareni-kpi/', api_ostvareni_kpi, name='api_ostvareni_kpi'),
    path('api/ostvareni-kpi/<int:id>/', api_ostvareni_kpi_detalj, name='api_ostvareni_kpi_detalj'),
]
