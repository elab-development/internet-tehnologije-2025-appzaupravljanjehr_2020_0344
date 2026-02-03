from django.db import models
from users.models import Korisnik
from django.core.exceptions import ValidationError


class Tip_cilja(models.Model):
    naziv = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.naziv

    class Meta:
        verbose_name = "Tip cilja"
        verbose_name_plural = "Tipovi ciljeva"


class Cilj(models.Model):
    STATUS_CHOICES = [
        ("aktivan", "Aktivan"),
        ("neaktivan", "Neaktivan"),

    ]

    naziv = models.CharField(max_length=100)
    tip_cilja = models.ForeignKey(Tip_cilja, on_delete=models.PROTECT, related_name='ciljevi')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="neaktivan")

    def __str__(self):
        return self.naziv

    class Meta:
        verbose_name = "Cilj"
        verbose_name_plural = "Ciljevi"


class Dodeljeni_cilj(models.Model):
    cilj = models.ForeignKey(
        Cilj, 
        on_delete=models.CASCADE, 
        related_name='dodeljeni_ciljevi'
    )

    zaposleni = models.ForeignKey(
        'users.Korisnik',
        on_delete=models.CASCADE,
        related_name='dodeljeni_ciljevi'
    )

    datum_Od = models.DateField()
    datum_Do = models.DateField()

    def clean(self):
        if self.datum_Do < self.datum_Od:
            raise ValidationError("Datum završetka ne može biti pre datuma početka.")
    
    def __str__(self):
        return f"{self.cilj} → {self.zaposleni}"

    class Meta:
        verbose_name = "Dodeljeni cilj"
        verbose_name_plural = "Dodeljeni ciljevi"
        unique_together = ('cilj', 'zaposleni', 'datum_Od', 'datum_Do')