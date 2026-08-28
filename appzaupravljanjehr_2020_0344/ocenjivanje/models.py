from django.db import models
from django.core.exceptions import ValidationError
from firma.models import Organizaciona_jedinica, Radno_mesto
from users.models import Korisnik
from django.conf import settings

class Oblast_ocenjivanja(models.Model):
    naziv = models.CharField(max_length=100)
    opis = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.naziv

class Tezinski_koeficijent(models.Model):
    koef_1 = models.DecimalField(max_digits=4, decimal_places=3)
    koef_2 = models.DecimalField(max_digits=4, decimal_places=3)
    koef_3 = models.DecimalField(max_digits=4, decimal_places=3)
    koef_4 = models.DecimalField(max_digits=4, decimal_places=3)
    koef_5 = models.DecimalField(max_digits=4, decimal_places=3)

    radno_mesto = models.ForeignKey(Radno_mesto, on_delete=models.CASCADE)

    oblast_ocenjivanja_1 = models.ForeignKey(Oblast_ocenjivanja, on_delete=models.CASCADE, related_name='koeficijent_1')
    oblast_ocenjivanja_2 = models.ForeignKey(Oblast_ocenjivanja, on_delete=models.CASCADE, related_name='koeficijent_2')
    oblast_ocenjivanja_3 = models.ForeignKey(Oblast_ocenjivanja, on_delete=models.CASCADE, related_name='koeficijent_3')
    oblast_ocenjivanja_4 = models.ForeignKey(Oblast_ocenjivanja, on_delete=models.CASCADE, related_name='koeficijent_4')
    oblast_ocenjivanja_5 = models.ForeignKey(Oblast_ocenjivanja, on_delete=models.CASCADE, related_name='koeficijent_5')

    def koeficijenti(self):
        return [self.koef_1, self.koef_2, self.koef_3, self.koef_4, self.koef_5]

    def oblasti(self):
        return [
            self.oblast_ocenjivanja_1,
            self.oblast_ocenjivanja_2,
            self.oblast_ocenjivanja_3,
            self.oblast_ocenjivanja_4,
            self.oblast_ocenjivanja_5,
        ]

    def clean(self):
        ukupno = sum([k or 0 for k in self.koeficijenti()])
        if round(float(ukupno), 3) != 1.0:
            raise ValidationError("Zbir svih koeficijenata mora biti tačno 1.0")

        oblasti_ids = [o.id for o in self.oblasti()]
        if len(set(oblasti_ids)) != len(oblasti_ids):
            raise ValidationError("Sve oblasti ocenjivanja moraju biti različite")

    def __str__(self):
        return f"{self.radno_mesto} / {self.radno_mesto.organizaciona_jedinica}"

    class Meta:
        verbose_name = "Težinski koeficijent"
        verbose_name_plural = "Težinski koeficijenti"
        


class Ocena_zaposlenog(models.Model):
    zaposleni = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ocene")
    rukovodilac = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="ocenjivac", null=True, blank=True)

    tezinski_koeficijent = models.ForeignKey(Tezinski_koeficijent, on_delete=models.SET_NULL, null=True, blank=True)

    ocena_1 = models.IntegerField()
    ocena_2 = models.IntegerField()
    ocena_3 = models.IntegerField()
    ocena_4 = models.IntegerField()
    ocena_5 = models.IntegerField()

    zbirna_ocena = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)

    datum_Od = models.DateField()
    datum_Do = models.DateField()

    def ocene(self):
        return [self.ocena_1, self.ocena_2, self.ocena_3, self.ocena_4, self.ocena5]

    def clean(self):
        for i, ocena in enumerate(self.ocene(), start=1):
            if ocena is None or ocena < 1 or ocena > 5:
                raise ValidationError({f"ocena{i}": "Ocena mora biti između 1 i 5"})
        if self.datum_Od and self.datum_Do and self.datum_Do < self.datum_Od:
            raise ValidationError("Datum završetka ne može biti pre datuma početka.")

    def izracunaj_zbirnu_ocenu(self):
        if not self.tezinski_koeficijent:
            self.zbirna_ocena = None
            return None

        zbirna = sum(o * float(t) for o, t in zip(self.ocene(), self.tezinski_koeficijent.koeficijenti()))
        self.zbirna_ocena = round(zbirna, 2)
        return self.zbirna_ocena

    def save(self, *args, **kwargs):
        self.izracunaj_zbirnu_ocenu()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.zaposleni} - {self.rukovodilac} ({self.datum_Od} do {self.datum_Do}) - {self.zbirna_ocena}"

    class Meta:
        verbose_name = "Ocena zaposlenog"
        verbose_name_plural = "Ocene zaposlenih"
        ordering = ['-datum_Od']