from django.db import models

class SATRegimenFiscal(models.Model):
    codigo = models.CharField(max_length=3, primary_key=True)
    descripcion = models.CharField(max_length=255)
    fisica = models.BooleanField(default=False)
    moral = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

class SATUsoCFDI(models.Model):
    codigo = models.CharField(max_length=3, primary_key=True)
    descripcion = models.CharField(max_length=255)
    fisica = models.BooleanField(default=False)
    moral = models.BooleanField(default=False)
    # Relación M2M si requerimos validación estricta, por ahora simplificado
    
    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

class SATFormaPago(models.Model):
    codigo = models.CharField(max_length=2, primary_key=True)
    descripcion = models.CharField(max_length=100)
    bancarizado = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

class SATMetodoPago(models.Model):
    codigo = models.CharField(max_length=3, primary_key=True)
    descripcion = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"
