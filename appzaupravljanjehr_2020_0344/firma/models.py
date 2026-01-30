from django.db import models

class Organizaciona_jedinica(models.Model):
    naziv = models.CharField(max_length=255)
    opis = models.TextField()
    nadredjena_org_jed = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='podrejene_org_jedinice')

    def __str__(self):
        return self.naziv

class Radno_mesto(models.Model):
    naziv = models.CharField(max_length=255)
    opis = models.TextField()
    org_jed = models.ForeignKey('organizaciona_jedinica', on_delete=models.CASCADE, related_name='radna_mesta')

    def __str__(self):
        return self.naziv





