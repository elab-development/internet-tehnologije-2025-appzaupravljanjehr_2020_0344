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

    def clean(self):
        ukupno = sum([
            self.koef_1 or 0,
            self.koef_2 or 0,
            self.koef_3 or 0,
            self.koef_4 or 0,
            self.koef_5 or 0,
        ])
        if round(ukupno, 3) != 1.0:
            raise ValidationError("Zbir svih koeficijenata mora biti tačno 1.0")

        oblasti = [
            self.oblast_ocenjivanja_1,
            self.oblast_ocenjivanja_2,
            self.oblast_ocenjivanja_3,
            self.oblast_ocenjivanja_4,
            self.oblast_ocenjivanja_5
        ]
        if len(set(oblasti)) != len(oblasti):
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

    def clean(self):
        for i in range(1, 6):
            ocena = getattr(self, f"ocena_{i}")
            if ocena < 1 or ocena > 5:
                raise ValidationError({f"ocena_{i}": "Ocena mora biti između 1 i 5"})

    def izracunaj_zbirnu_ocenu(self):
        if not self.tezinski_koeficijent:
            raise ValidationError("Težinski koeficijent nije postavljen")

        koef = self.tezinski_koeficijent

        ocene = [
            self.ocena_1,
            self.ocena_2,
            self.ocena_3,
            self.ocena_4,
            self.ocena_5
        ]
        tezine = [
            koef.koef_1,
            koef.koef_2,
            koef.koef_3,
            koef.koef_4,
            koef.koef_5
        ]

        zbirna = sum([o * float(t) for o, t in zip(ocene, tezine)])
        self.zbirna_ocena = round(zbirna, 2)
        return self.zbirna_ocena

    def save(self, *args, **kwargs):
        self.izracunaj_zbirnu_ocenu()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.zaposleni} - {self.rukovodilac} ({self.datum_Od} do {self.datum_Do}) - {self.zbirna_ocena}"