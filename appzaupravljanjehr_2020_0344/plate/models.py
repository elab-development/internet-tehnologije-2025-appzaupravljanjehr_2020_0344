from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from firma.models import Radno_mesto


class Plata(models.Model):
    radno_mesto = models.OneToOneField(Radno_mesto, on_delete=models.CASCADE, related_name='plata')
    bruto = models.DecimalField(max_digits=12, decimal_places=2)
    neto = models.DecimalField(max_digits=12, decimal_places=2)

    def clean(self):
        if self.bruto is None or self.neto is None:
            raise ValidationError('Bruto i neto iznos su obavezni.')
        if self.bruto < 0 or self.neto < 0:
            raise ValidationError('Iznosi ne mogu biti negativni.')
        if self.neto > self.bruto:
            raise ValidationError('Neto iznos ne može biti veći od bruto iznosa.')

    def __str__(self):
        return f"{self.radno_mesto} - {self.bruto} / {self.neto}"

    class Meta:
        verbose_name = 'Plata'
        verbose_name_plural = 'Plate'


class Isplata(models.Model):
    korisnik = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='isplate')
    plata = models.ForeignKey(Plata, on_delete=models.SET_NULL, null=True, blank=True, related_name='isplate')
    datum_isplate = models.DateField()
    iznos_bruto = models.DecimalField(max_digits=12, decimal_places=2)
    iznos_neto = models.DecimalField(max_digits=12, decimal_places=2)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    izmenio = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='izmenjene_isplate')
    datum_izmene = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.iznos_bruto is None or self.iznos_neto is None:
            raise ValidationError('Bruto i neto iznos su obavezni.')
        if self.iznos_bruto < 0 or self.iznos_neto < 0 or (self.bonus is not None and self.bonus < 0):
            raise ValidationError('Iznosi ne mogu biti negativni.')
        if self.iznos_neto > self.iznos_bruto:
            raise ValidationError('Neto iznos ne može biti veći od bruto iznosa.')

    def ukupno_neto(self):
        return self.iznos_neto + (self.bonus or 0)

    def __str__(self):
        return f"{self.korisnik} - {self.datum_isplate} - {self.iznos_neto}"

    class Meta:
        verbose_name = 'Isplata'
        verbose_name_plural = 'Isplate'
        ordering = ['-datum_isplate']
