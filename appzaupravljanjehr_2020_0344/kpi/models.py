from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class KPI(models.Model):
    naziv = models.CharField(max_length=255)
    opis = models.TextField(blank=True, null=True)
    target = models.DecimalField(max_digits=12, decimal_places=2)

    def clean(self):
        if self.target is None or self.target <= 0:
            raise ValidationError('Target mora biti pozitivan broj.')

    def __str__(self):
        return f"{self.naziv} (target: {self.target})"

    class Meta:
        verbose_name = 'KPI'
        verbose_name_plural = 'KPI'
        ordering = ['naziv']


class Dodeljeni_KPI(models.Model):
    kpi = models.ForeignKey(KPI, on_delete=models.CASCADE, related_name='dodeljeni')
    korisnik = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dodeljeni_kpi')
    datum_Od = models.DateField()
    datum_Do = models.DateField()
    datum_dodele = models.DateField(auto_now_add=True)

    def clean(self):
        if self.datum_Do < self.datum_Od:
            raise ValidationError('Datum završetka ne može biti pre datuma početka.')

    def poslednji_unos(self):
        return self.ostvareni.order_by('-datum', '-id').first()

    def poslednja_vrednost(self):
        unos = self.poslednji_unos()
        return unos.ostvarena_vrednost if unos else None

    def procenat(self):
        vrednost = self.poslednja_vrednost()
        if vrednost is None or not self.kpi.target:
            return 0
        return round(float(vrednost) / float(self.kpi.target) * 100, 1)

    def __str__(self):
        return f"{self.kpi} -> {self.korisnik} ({self.datum_Od} - {self.datum_Do})"

    class Meta:
        verbose_name = 'Dodeljeni KPI'
        verbose_name_plural = 'Dodeljeni KPI'
        unique_together = ('kpi', 'korisnik', 'datum_Od', 'datum_Do')
        ordering = ['-datum_Od']


class Ostvareni_KPI(models.Model):
    dodeljeni_kpi = models.ForeignKey(Dodeljeni_KPI, on_delete=models.CASCADE, related_name='ostvareni')
    ostvarena_vrednost = models.DecimalField(max_digits=12, decimal_places=2)
    datum = models.DateField()
    opis = models.TextField(blank=True, null=True)
    rukovodilac = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='uneti_kpi')

    def clean(self):
        if self.ostvarena_vrednost is None or self.ostvarena_vrednost < 0:
            raise ValidationError('Ostvarena vrednost ne može biti negativna.')

    def __str__(self):
        return f"{self.dodeljeni_kpi} = {self.ostvarena_vrednost} ({self.datum})"

    class Meta:
        verbose_name = 'Ostvareni KPI'
        verbose_name_plural = 'Ostvareni KPI'
        ordering = ['-datum', '-id']
