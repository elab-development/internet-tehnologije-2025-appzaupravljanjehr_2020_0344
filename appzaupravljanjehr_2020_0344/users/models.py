from django.db import models
from django.contrib.auth.models import BaseUserManager
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from firma.models import Organizaciona_jedinica, Radno_mesto

class KorisnikManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('Korisničko ime je obavezno')

        email = self.normalize_email(email) if email else None
        extra_fields.setdefault("role", "zaposleni")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)

        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "superuser")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        
        extra_fields.setdefault("jmbg", "0000000000000")
        extra_fields.setdefault("srednje_ime", "-")
        extra_fields.setdefault("pol", "Z")
        extra_fields.setdefault("datum_rodjenja", timezone.now().date())
        extra_fields.setdefault("adresa", "N/A")
        extra_fields.setdefault("strucna_sprema", "N/A")
        extra_fields.setdefault("broj_telefona", "000000000")

        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
        

class Korisnik(AbstractUser):
    ROLE_CHOICES = [
        ("superuser", "Superuser"),
        ("administrator", "Administrator"),
        ("rukovodilac", "Rukovodilac"),
        ("zaposleni", "Zaposleni"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="zaposleni")

    jmbg = models.CharField(max_length=13, unique=True)
    srednje_ime = models.CharField(max_length=50)
    pol = models.CharField(max_length=1, choices=[("M", "Muški"), ("Z", "Zenski")], default="Z")
    datum_rodjenja = models.DateField()
    drzava = models.CharField(max_length=50, blank=True, null=True)
    adresa = models.CharField(max_length=255)
    mesto_rodjenja = models.CharField(max_length=50, blank=True, null=True)
    strucna_sprema = models.CharField(max_length=50)
    broj_telefona = models.CharField(max_length=15)

    organizaciona_jedinica = models.ForeignKey(Organizaciona_jedinica, on_delete=models.SET_NULL, null=True, blank=True, related_name='zaposleni')
    radno_mesto = models.ForeignKey(Radno_mesto, on_delete=models.SET_NULL, null=True, blank=True, related_name='zaposleni')
    rukovodilac = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='podrejeni')

    objects = KorisnikManager()
    
    def rukovodilac_org_jedinice(self):
        if self.organizaciona_jedinica:
            return self.organizaciona_jedinica.rukovodilac
        return None

    def save(self, *args, **kwargs):
        if self.role == "superuser":
            self.is_superuser = True
            self.is_staff = True
        elif self.role == "administrator":
            self.is_superuser = False
            self.is_staff = True
        else:
            self.is_superuser = False
            self.is_staff = False
        super().save(*args, **kwargs)

    def __str__(self):
        ime = " ".join(filter(None, [self.first_name, self.srednje_ime, self.last_name]))
        return f"{ime} - {self.role}"

    class Meta: 
        verbose_name = "Korisnik"
        verbose_name_plural = "Korisnici"
        ordering = ['username']

