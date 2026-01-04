from django.db import models

# NOTA: Estos son los catálogos SAT LEGACY que ya existen en la base de datos
# NO MODIFICAR - mantener para compatibilidad con foreign keys existentes
# Los nuevos modelos CFDI están en cfdi_catalogs.py

class SATFormaPago(models.Model):
    """
    Catálogo de formas de pago (LEGACY - NO MODIFICAR)
    """
    clave = models.CharField(max_length=2, primary_key=True, default='00')
    descripcion = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'contabilidad_satformapago'
        verbose_name = 'Forma de Pago SAT (Legacy)'
        verbose_name_plural = 'Formas de Pago SAT (Legacy)'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"


class SATMetodoPago(models.Model):
    """
    Método de pago (LEGACY - NO MODIFICAR)
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    descripcion = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'contabilidad_satmetodopago'
        verbose_name = 'Método de Pago SAT (Legacy)'
        verbose_name_plural = 'Métodos de Pago SAT (Legacy)'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"


class SATUsoCFDI(models.Model):
    """
    Uso de CFDI (LEGACY - NO MODIFICAR)
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    descripcion = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'contabilidad_satusocfdi'
        verbose_name = 'Uso de CFDI SAT (Legacy)'
        verbose_name_plural = 'Usos de CFDI SAT (Legacy)'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"


class SATRegimenFiscal(models.Model):
    """
    Régimen fiscal (LEGACY - NO MODIFICAR)
    """
    clave = models.CharField(max_length=3, primary_key=True, default='000')
    descripcion = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'contabilidad_satregimenfiscal'
        verbose_name = 'Régimen Fiscal SAT (Legacy)'
        verbose_name_plural = 'Regímenes Fiscales SAT (Legacy)'
    
    def __str__(self):
        return f"{self.clave} - {self.descripcion}"
