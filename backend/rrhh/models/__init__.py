from .organizacion import Departamento, Puesto, CentroTrabajo, RazonSocial
from .empleado import (
    Empleado, EmpleadoDetallePersonal, EmpleadoDocumentacionOficial,
    EmpleadoDatosLaborales, EmpleadoNominaBancaria, EmpleadoCreditoInfonavit,
    EmpleadoContactoEmergencia
)
from .conceptos import ConceptoNomina, TipoConcepto
from .nomina import NominaCentralizada, PeriodoNomina
from .asistencia import Asistencia, DistribucionCosto, TipoIncidencia, OrigenChecada

# Importar modelos de archivos adjuntos (backward compatibility)
from ..models_nomina import (
    TablaISR, RenglonTablaISR, ConfiguracionEconomica,
    SubsidioEmpleo, RenglonSubsidio, Nomina, ReciboNomina, DetalleReciboItem,
    ClasificacionFiscal, BuzonIMSS
)
from ..models_portal import (
    SolicitudVacaciones, SolicitudPermiso, Incapacidad, DocumentoExpediente
)
