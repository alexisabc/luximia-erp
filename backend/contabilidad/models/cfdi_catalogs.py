from django.db import models

# Estos modelos son NUEVOS y coexisten con los antiguos SATFormaPago, SATMetodoPago, etc.
# Se usarán para CFDI 4.0 mientras migramos gradualmente

class CFDIClaveProdServ(models.Model):
    """
    Catálogo de productos y servicios del SAT para CFDI 4.0
    """
    clave = models.CharField(max_length=8, primary_key=True, default='00000000')
    descripcion = models.TextField()
    incluye_iva = models.BooleanField(default=True)
    incluye_ieps = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'cfdi_clave_prod_serv'
        verbose_name = 'Clave Producto/Servicio CFDI'
        verbose_name_plural = 'Claves Productos/Servicios CFDI'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion[:50]}"


class CFDIUnidad(models.Model):
    """
    Catálogo de unidades de medida para CFDI 4.0
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        db_table = 'cfdi_unidad'
        verbose_name = 'Unidad de Medida CFDI'
        verbose_name_plural = 'Unidades de Medida CFDI'
    
    def __str__(self):
        return f"{self.clave} - {self.nombre}"


class CFDIFormaPago(models.Model):
    """
    Catálogo de formas de pago para CFDI 4.0
    """
    clave = models.CharField(max_length=2, primary_key=True, default='00')
    descripcion = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'cfdi_forma_pago'
        verbose_name = 'Forma de Pago CFDI'
        verbose_name_plural = 'Formas de Pago CFDI'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"


class CFDIMetodoPago(models.Model):
    """
    Método de pago para CFDI 4.0: PUE o PPD
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    descripcion = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'cfdi_metodo_pago'
        verbose_name = 'Método de Pago CFDI'
        verbose_name_plural = 'Métodos de Pago CFDI'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"


class CFDIUsoCFDI(models.Model):
    """
    Uso que dará el receptor al CFDI
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    descripcion = models.CharField(max_length=200)
    aplica_persona_fisica = models.BooleanField(default=True)
    aplica_persona_moral = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'cfdi_uso_cfdi'
        verbose_name = 'Uso de CFDI'
        verbose_name_plural = 'Usos de CFDI'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"
