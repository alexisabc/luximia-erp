from .organizacion import Departamento, Puesto, CentroTrabajo, RazonSocial
from .empleado import (
    Empleado, EmpleadoDetallePersonal, EmpleadoDocumentacionOficial,
    EmpleadoDatosLaborales, EmpleadoNominaBancaria, EmpleadoCreditoInfonavit,
    EmpleadoContactoEmergencia
)
from .nomina import NominaCentralizada, PeriodoNomina

# Importar modelos de archivos adjuntos (backward compatibility)
from ..models_nomina import (
    ConceptoNomina, TablaISR, RenglonTablaISR, ConfiguracionEconomica,
    SubsidioEmpleo, RenglonSubsidio, Nomina, ReciboNomina, DetalleReciboItem,
    TipoConcepto, ClasificacionFiscal, BuzonIMSS
)
from ..models_portal import (
    SolicitudVacaciones, SolicitudPermiso, Incapacidad, DocumentoExpediente
)
