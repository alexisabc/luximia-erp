"""
Modelos para Complemento de Pagos CFDI 4.0
"""
from django.db import models
from decimal import Decimal
from core.models import SoftDeleteModel, EmpresaOwnedModel


class ComplementoPago(SoftDeleteModel, EmpresaOwnedModel):
    """
    Recibo Electrónico de Pago (REP) - Complemento de Pagos 2.0
    """
    # Relación con factura original (si aplica)
    factura = models.ForeignKey(
        'contabilidad.Factura',
        on_delete=models.PROTECT,
        related_name='complementos_pago',
        null=True,
        blank=True,
        help_text='Factura original que se está pagando'
    )
    
    # Datos del complemento
    serie = models.CharField(max_length=25, null=True, blank=True)
    folio = models.CharField(max_length=40)
    fecha = models.DateTimeField()
    
    # Datos del pago
    fecha_pago = models.DateTimeField(help_text='Fecha en que se realizó el pago')
    forma_pago = models.ForeignKey(
        'contabilidad.CFDIFormaPago',
        on_delete=models.PROTECT,
        help_text='Forma de pago (01-Efectivo, 03-Transferencia, etc.)'
    )
    moneda = models.CharField(max_length=3, default='MXN')
    tipo_cambio = models.DecimalField(
        max_digits=19,
        decimal_places=6,
        default=Decimal('1.0')
    )
    monto = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        help_text='Monto total del pago'
    )
    
    # Datos bancarios (opcionales)
    numero_operacion = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text='Número de cheque, transferencia, etc.'
    )
    rfc_emisor_cuenta_ordenante = models.CharField(
        max_length=13,
        null=True,
        blank=True
    )
    nombre_banco_ordenante = models.CharField(
        max_length=300,
        null=True,
        blank=True
    )
    cuenta_ordenante = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    rfc_emisor_cuenta_beneficiaria = models.CharField(
        max_length=13,
        null=True,
        blank=True
    )
    cuenta_beneficiaria = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    
    # Timbrado
    uuid = models.UUIDField(null=True, blank=True, unique=True)
    fecha_timbrado = models.DateTimeField(null=True, blank=True)
    
    # XMLs
    xml_original = models.TextField(null=True, blank=True)
    xml_timbrado = models.TextField(null=True, blank=True)
    
    # Sello
    cadena_original = models.TextField(null=True, blank=True)
    sello_digital = models.TextField(null=True, blank=True)
    sello_sat = models.TextField(null=True, blank=True)
    numero_certificado_sat = models.CharField(max_length=20, null=True, blank=True)
    
    # Estado
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('TIMBRADO', 'Timbrado'),
        ('CANCELADO', 'Cancelado'),
        ('ERROR', 'Error'),
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR'
    )
    
    # Archivos
    pdf_archivo = models.FileField(
        upload_to='complementos_pago/pdf/',
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'contabilidad_complementopago'
        verbose_name = 'Complemento de Pago'
        verbose_name_plural = 'Complementos de Pago'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"REP {self.serie}-{self.folio}"


class DocumentoRelacionadoPago(models.Model):
    """
    Documentos relacionados en un complemento de pago
    Representa las facturas que se están pagando
    """
    complemento = models.ForeignKey(
        ComplementoPago,
        on_delete=models.CASCADE,
        related_name='documentos_relacionados'
    )
    
    # Documento que se está pagando
    factura = models.ForeignKey(
        'contabilidad.Factura',
        on_delete=models.PROTECT,
        related_name='pagos_recibidos'
    )
    
    # Datos del pago
    id_documento = models.UUIDField(help_text='UUID de la factura que se paga')
    serie = models.CharField(max_length=25, null=True, blank=True)
    folio = models.CharField(max_length=40)
    moneda = models.CharField(max_length=3, default='MXN')
    
    # Método de pago del documento original
    metodo_pago = models.ForeignKey(
        'contabilidad.CFDIMetodoPago',
        on_delete=models.PROTECT,
        help_text='Método de pago del documento (PUE/PPD)'
    )
    
    # Número de parcialidad
    numero_parcialidad = models.IntegerField(
        help_text='Número de parcialidad (1, 2, 3...)'
    )
    
    # Importes
    importe_saldo_anterior = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        help_text='Saldo insoluto antes de este pago'
    )
    importe_pagado = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        help_text='Importe pagado en esta parcialidad'
    )
    importe_saldo_insoluto = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        help_text='Saldo pendiente después de este pago'
    )
    
    # Tipo de cambio (si aplica)
    tipo_cambio = models.DecimalField(
        max_digits=19,
        decimal_places=6,
        default=Decimal('1.0'),
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'contabilidad_documentorelacionadopago'
        verbose_name = 'Documento Relacionado'
        verbose_name_plural = 'Documentos Relacionados'
        ordering = ['numero_parcialidad']
    
    def __str__(self):
        return f"{self.serie}-{self.folio} - Parcialidad {self.numero_parcialidad}"
