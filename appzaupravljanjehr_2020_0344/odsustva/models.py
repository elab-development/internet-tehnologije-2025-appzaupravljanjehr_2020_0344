from datetime import timedelta
from django.db import models
from django.db.models import Sum
from django.conf import settings
from django.core.exceptions import ValidationError


GODISNJI_FOND_DANA = 20


def broj_radnih_dana(datum_od, datum_do):
    dana = 0
    tekuci = datum_od
    while tekuci <= datum_do:
        if tekuci.weekday() < 5:
            dana += 1
        tekuci += timedelta(days=1)
    return dana


class Odmor(models.Model):
    NA_CEKANJU = 'na_cekanju'
    ODOBREN = 'odobren'
    ODBIJEN = 'odbijen'

    STATUS_CHOICES = [
        (NA_CEKANJU, 'Na čekanju'),
        (ODOBREN, 'Odobren'),
        (ODBIJEN, 'Odbijen'),
    ]

    zaposleni = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='odmori')
    rukovodilac = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='odmori_tima')
    datum_Od = models.DateField()
    datum_Do = models.DateField()
    broj_dana = models.PositiveIntegerField(default=0)
    napomena = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NA_CEKANJU)
    razlog_odbijanja = models.TextField(blank=True, null=True)
    datum_podnosenja = models.DateTimeField(auto_now_add=True)
    obradio = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='obradjeni_odmori')
    datum_obrade = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.datum_Do < self.datum_Od:
            raise ValidationError('Datum završetka ne može biti pre datuma početka.')
        if self.datum_Od.year != self.datum_Do.year:
            raise ValidationError('Period odmora mora biti unutar jedne kalendarske godine.')

    def save(self, *args, **kwargs):
        self.broj_dana = broj_radnih_dana(self.datum_Od, self.datum_Do)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.zaposleni} ({self.datum_Od} - {self.datum_Do}) - {self.status}"

    class Meta:
        verbose_name = 'Odmor'
        verbose_name_plural = 'Odmori'
        ordering = ['-datum_podnosenja']


def stanje_odmora(zaposleni, godina, iskljuci_id=None):
    odmori = Odmor.objects.filter(zaposleni=zaposleni, datum_Od__year=godina)
    if iskljuci_id:
        odmori = odmori.exclude(id=iskljuci_id)
    iskorisceno = odmori.filter(status=Odmor.ODOBREN).aggregate(s=Sum('broj_dana'))['s'] or 0
    na_cekanju = odmori.filter(status=Odmor.NA_CEKANJU).aggregate(s=Sum('broj_dana'))['s'] or 0
    return {
        'godina': godina,
        'ukupno': GODISNJI_FOND_DANA,
        'iskorisceno': iskorisceno,
        'na_cekanju': na_cekanju,
        'preostalo': GODISNJI_FOND_DANA - iskorisceno - na_cekanju,
    }
