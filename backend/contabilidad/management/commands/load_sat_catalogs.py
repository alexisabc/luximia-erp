"""
Management command to load basic SAT catalogs for CFDI 4.0
"""
from django.core.management.base import BaseCommand
from contabilidad.models import CFDIFormaPago, CFDIMetodoPago, CFDIUsoCFDI


class Command(BaseCommand):
    help = 'Carga catálogos básicos del SAT para CFDI 4.0'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando carga de catálogos SAT...'))
        
        # Cargar Formas de Pago (c_FormaPago)
        formas_pago = [
            ('01', 'Efectivo'),
            ('02', 'Cheque nominativo'),
            ('03', 'Transferencia electrónica de fondos'),
            ('04', 'Tarjeta de crédito'),
            ('05', 'Monedero electrónico'),
            ('06', 'Dinero electrónico'),
            ('08', 'Vales de despensa'),
            ('12', 'Dación en pago'),
            ('13', 'Pago por subrogación'),
            ('14', 'Pago por consignación'),
            ('15', 'Condonación'),
            ('17', 'Compensación'),
            ('23', 'Novación'),
            ('24', 'Confusión'),
            ('25', 'Remisión de deuda'),
            ('26', 'Prescripción o caducidad'),
            ('27', 'A satisfacción del acreedor'),
            ('28', 'Tarjeta de débito'),
            ('29', 'Tarjeta de servicios'),
            ('30', 'Aplicación de anticipos'),
            ('31', 'Intermediario pagos'),
            ('99', 'Por definir'),
        ]
        
        created_fp = 0
        for clave, descripcion in formas_pago:
            _, created = CFDIFormaPago.objects.get_or_create(
                clave=clave,
                defaults={'descripcion': descripcion}
            )
            if created:
                created_fp += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Formas de Pago: {created_fp} nuevas, {len(formas_pago)} total'))
        
        # Cargar Métodos de Pago (c_MetodoPago)
        metodos_pago = [
            ('PUE', 'Pago en una sola exhibición'),
            ('PPD', 'Pago en parcialidades o diferido'),
        ]
        
        created_mp = 0
        for clave, descripcion in metodos_pago:
            _, created = CFDIMetodoPago.objects.get_or_create(
                clave=clave,
                defaults={'descripcion': descripcion}
            )
            if created:
                created_mp += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Métodos de Pago: {created_mp} nuevas, {len(metodos_pago)} total'))
        
        # Cargar Usos de CFDI (c_UsoCFDI)
        usos_cfdi = [
            ('G01', 'Adquisición de mercancías', True, True),
            ('G02', 'Devoluciones, descuentos o bonificaciones', True, True),
            ('G03', 'Gastos en general', True, True),
            ('I01', 'Construcciones', True, True),
            ('I02', 'Mobiliario y equipo de oficina por inversiones', True, True),
            ('I03', 'Equipo de transporte', True, True),
            ('I04', 'Equipo de cómputo y accesorios', True, True),
            ('I05', 'Dados, troqueles, moldes, matrices y herramental', True, True),
            ('I06', 'Comunicaciones telefónicas', True, True),
            ('I07', 'Comunicaciones satelitales', True, True),
            ('I08', 'Otra maquinaria y equipo', True, True),
            ('D01', 'Honorarios médicos, dentales y gastos hospitalarios', True, False),
            ('D02', 'Gastos médicos por incapacidad o discapacidad', True, False),
            ('D03', 'Gastos funerales', True, False),
            ('D04', 'Donativos', True, False),
            ('D05', 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)', True, False),
            ('D06', 'Aportaciones voluntarias al SAR', True, False),
            ('D07', 'Primas por seguros de gastos médicos', True, False),
            ('D08', 'Gastos de transportación escolar obligatoria', True, False),
            ('D09', 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones', True, False),
            ('D10', 'Pagos por servicios educativos (colegiaturas)', True, False),
            ('S01', 'Sin efectos fiscales', True, True),
            ('CP01', 'Pagos', True, True),
            ('CN01', 'Nómina', True, True),
        ]
        
        created_uc = 0
        for clave, descripcion, fisica, moral in usos_cfdi:
            _, created = CFDIUsoCFDI.objects.get_or_create(
                clave=clave,
                defaults={
                    'descripcion': descripcion,
                    'aplica_persona_fisica': fisica,
                    'aplica_persona_moral': moral,
                }
            )
            if created:
                created_uc += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Usos de CFDI: {created_uc} nuevos, {len(usos_cfdi)} total'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Catálogos SAT cargados exitosamente'))
        self.stdout.write(self.style.WARNING('\n⚠️  Nota: Los catálogos de Productos/Servicios y Unidades requieren'))
        self.stdout.write(self.style.WARNING('    archivos XML del SAT. Usa el comando load_sat_full_catalogs'))
