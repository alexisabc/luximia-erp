from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import SystemSetting, FeatureFlag


class Command(BaseCommand):
    help = 'Inicializa las configuraciones del sistema con valores por defecto inspirados en Contpaqi, Enkontrol y SICAR'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando carga de configuraciones del sistema...'))
        
        with transaction.atomic():
            # Configuraciones Fiscales (Inspirado en Contpaqi)
            self._create_fiscal_settings()
            
            # Configuraciones de Inventario (Inspirado en Enkontrol)
            self._create_inventory_settings()
            
            # Configuraciones de POS (Inspirado en SICAR)
            self._create_pos_settings()
            
            # Configuraciones de RRHH
            self._create_rrhh_settings()
            
            # Configuraciones de Seguridad
            self._create_security_settings()
            
            # Feature Flags
            self._create_feature_flags()
        
        self.stdout.write(self.style.SUCCESS('✅ Configuraciones inicializadas exitosamente'))
    
    def _create_fiscal_settings(self):
        """Configuraciones fiscales estilo Contpaqi"""
        self.stdout.write('Creando configuraciones fiscales...')
        
        settings = [
            {
                'key': 'FISCAL_RFC_VALIDATION',
                'value': True,
                'category': 'FISCAL',
                'description': 'Validar formato de RFC en clientes y proveedores (estilo Contpaqi)',
                'is_public': False,
            },
            {
                'key': 'FISCAL_AUTO_CALCULATE_TAX',
                'value': True,
                'category': 'FISCAL',
                'description': 'Calcular automáticamente impuestos en facturas',
                'is_public': False,
            },
            {
                'key': 'FISCAL_REQUIRE_SAT_VALIDATION',
                'value': False,
                'category': 'FISCAL',
                'description': 'Requiere validación en línea con SAT antes de timbrar',
                'is_public': False,
            },
            {
                'key': 'FISCAL_DEFAULT_TAX_RATE',
                'value': 0.16,
                'category': 'FISCAL',
                'description': 'Tasa de IVA por defecto (16%)',
                'is_public': True,
            },
            {
                'key': 'FISCAL_ALLOW_BACKDATED_INVOICES',
                'value': False,
                'category': 'FISCAL',
                'description': 'Permitir facturas con fecha anterior a hoy',
                'is_public': False,
            },
        ]
        
        for setting in settings:
            SystemSetting.objects.update_or_create(
                key=setting['key'],
                defaults=setting
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(settings)} configuraciones fiscales'))
    
    def _create_inventory_settings(self):
        """Configuraciones de inventario estilo Enkontrol"""
        self.stdout.write('Creando configuraciones de inventario...')
        
        settings = [
            {
                'key': 'INVENTORY_MULTI_WAREHOUSE',
                'value': True,
                'category': 'INVENTARIO',
                'description': 'Habilitar gestión de múltiples almacenes (estilo Enkontrol)',
                'is_public': True,
            },
            {
                'key': 'INVENTORY_ALLOW_NEGATIVE_STOCK',
                'value': False,
                'category': 'INVENTARIO',
                'description': 'Permitir stock negativo en almacenes',
                'is_public': False,
            },
            {
                'key': 'INVENTORY_AUTO_REORDER',
                'value': False,
                'category': 'INVENTARIO',
                'description': 'Generar automáticamente órdenes de compra al llegar a stock mínimo',
                'is_public': False,
            },
            {
                'key': 'INVENTORY_COST_METHOD',
                'value': 'PROMEDIO',
                'category': 'INVENTARIO',
                'description': 'Método de costeo: PROMEDIO, PEPS, UEPS',
                'is_public': False,
            },
            {
                'key': 'INVENTORY_REQUIRE_SERIAL_NUMBER',
                'value': False,
                'category': 'INVENTARIO',
                'description': 'Requiere número de serie para productos de alto valor',
                'is_public': False,
            },
            {
                'key': 'INVENTORY_ENABLE_LOTS',
                'value': True,
                'category': 'INVENTARIO',
                'description': 'Habilitar gestión por lotes/lote',
                'is_public': False,
            },
        ]
        
        for setting in settings:
            SystemSetting.objects.update_or_create(
                key=setting['key'],
                defaults=setting
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(settings)} configuraciones de inventario'))
    
    def _create_pos_settings(self):
        """Configuraciones de POS estilo SICAR"""
        self.stdout.write('Creando configuraciones de POS...')
        
        settings = [
            {
                'key': 'POS_FAST_MODE',
                'value': False,
                'category': 'POS',
                'description': 'Modo rápido con UI simplificada (estilo SICAR)',
                'is_public': True,
            },
            {
                'key': 'POS_ALLOW_NEGATIVE_STOCK',
                'value': False,
                'category': 'POS',
                'description': 'Permitir ventas con stock negativo',
                'is_public': False,
            },
            {
                'key': 'POS_REQUIRE_CUSTOMER',
                'value': False,
                'category': 'POS',
                'description': 'Requiere cliente en todas las ventas',
                'is_public': False,
            },
            {
                'key': 'POS_AUTO_PRINT_TICKET',
                'value': True,
                'category': 'POS',
                'description': 'Imprimir ticket automáticamente al finalizar venta',
                'is_public': True,
            },
            {
                'key': 'POS_ALLOW_DISCOUNTS',
                'value': True,
                'category': 'POS',
                'description': 'Permitir descuentos en ventas',
                'is_public': False,
            },
            {
                'key': 'POS_MAX_DISCOUNT_PERCENTAGE',
                'value': 20,
                'category': 'POS',
                'description': 'Porcentaje máximo de descuento sin autorización',
                'is_public': False,
            },
            {
                'key': 'POS_ENABLE_CREDIT_SALES',
                'value': True,
                'category': 'POS',
                'description': 'Habilitar ventas a crédito',
                'is_public': False,
            },
            {
                'key': 'POS_REQUIRE_SUPERVISOR_CANCELLATION',
                'value': True,
                'category': 'POS',
                'description': 'Requiere autorización de supervisor para cancelar ventas',
                'is_public': False,
            },
        ]
        
        for setting in settings:
            SystemSetting.objects.update_or_create(
                key=setting['key'],
                defaults=setting
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(settings)} configuraciones de POS'))
    
    def _create_rrhh_settings(self):
        """Configuraciones de Recursos Humanos"""
        self.stdout.write('Creando configuraciones de RRHH...')
        
        settings = [
            {
                'key': 'RRHH_AUTO_CALCULATE_PAYROLL',
                'value': True,
                'category': 'RRHH',
                'description': 'Calcular automáticamente nómina basada en asistencias',
                'is_public': False,
            },
            {
                'key': 'RRHH_REQUIRE_BIOMETRIC',
                'value': False,
                'category': 'RRHH',
                'description': 'Requiere registro biométrico para asistencias',
                'is_public': False,
            },
            {
                'key': 'RRHH_VACATION_DAYS_PER_YEAR',
                'value': 12,
                'category': 'RRHH',
                'description': 'Días de vacaciones por año trabajado',
                'is_public': False,
            },
            {
                'key': 'RRHH_ENABLE_OVERTIME',
                'value': True,
                'category': 'RRHH',
                'description': 'Habilitar cálculo de horas extras',
                'is_public': False,
            },
        ]
        
        for setting in settings:
            SystemSetting.objects.update_or_create(
                key=setting['key'],
                defaults=setting
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(settings)} configuraciones de RRHH'))
    
    def _create_security_settings(self):
        """Configuraciones de seguridad"""
        self.stdout.write('Creando configuraciones de seguridad...')
        
        settings = [
            {
                'key': 'SECURITY_REQUIRE_2FA',
                'value': False,
                'category': 'SECURITY',
                'description': 'Requiere autenticación de dos factores para todos los usuarios',
                'is_public': True,
            },
            {
                'key': 'SECURITY_SESSION_TIMEOUT_MINUTES',
                'value': 480,
                'category': 'SECURITY',
                'description': 'Tiempo de inactividad antes de cerrar sesión (minutos)',
                'is_public': True,
            },
            {
                'key': 'SECURITY_PASSWORD_MIN_LENGTH',
                'value': 8,
                'category': 'SECURITY',
                'description': 'Longitud mínima de contraseña',
                'is_public': True,
            },
            {
                'key': 'SECURITY_MAX_LOGIN_ATTEMPTS',
                'value': 5,
                'category': 'SECURITY',
                'description': 'Intentos máximos de login antes de bloquear cuenta',
                'is_public': False,
            },
        ]
        
        for setting in settings:
            SystemSetting.objects.update_or_create(
                key=setting['key'],
                defaults=setting
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(settings)} configuraciones de seguridad'))
    
    def _create_feature_flags(self):
        """Feature flags para módulos opcionales"""
        self.stdout.write('Creando feature flags...')
        
        features = [
            {
                'code': 'MODULE_FISCAL',
                'name': 'Módulo Fiscal y Contabilidad',
                'description': 'Habilita funciones de contabilidad, fiscal y facturación',
                'is_active': True,
                'rollout_percentage': 100,
            },
            {
                'code': 'MODULE_RRHH',
                'name': 'Módulo RRHH',
                'description': 'Habilita gestión de personal y nómina',
                'is_active': True,
                'rollout_percentage': 100,
            },
            {
                'code': 'MODULE_OBRAS',
                'name': 'Módulo de Obras y Construcción',
                'description': 'Habilita el módulo de gestión de obras',
                'is_active': False,
                'rollout_percentage': 100,
            },
            {
                'code': 'MODULE_CRM',
                'name': 'Módulo de CRM',
                'description': 'Habilita el módulo de gestión de relaciones con clientes',
                'is_active': False,
                'rollout_percentage': 100,
            },
            {
                'code': 'MODULE_ECOMMERCE',
                'name': 'Módulo de E-Commerce',
                'description': 'Habilita integración con tienda en línea',
                'is_active': False,
                'rollout_percentage': 100,
            },
            {
                'code': 'FEATURE_AI_ASSISTANT',
                'name': 'Asistente IA Avanzado',
                'description': 'Habilita funciones avanzadas del asistente IA',
                'is_active': True,
                'rollout_percentage': 100,
            },
            {
                'code': 'FEATURE_ADVANCED_REPORTS',
                'name': 'Reportes Avanzados',
                'description': 'Habilita generación de reportes avanzados con BI',
                'is_active': False,
                'rollout_percentage': 50,  # A/B testing al 50%
            },
            {
                'code': 'FEATURE_MOBILE_APP',
                'name': 'Aplicación Móvil',
                'description': 'Habilita acceso desde aplicación móvil',
                'is_active': False,
                'rollout_percentage': 100,
            },
        ]
        
        for feature in features:
            FeatureFlag.objects.update_or_create(
                code=feature['code'],
                defaults=feature
            )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(features)} feature flags'))
