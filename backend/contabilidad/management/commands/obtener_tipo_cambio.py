"""Comando para consultar y actualizar el tipo de cambio de Banxico."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from django.core.management.base import BaseCommand, CommandError

from contabilidad.utils import sincronizar_tipo_cambio_banxico


class Command(BaseCommand):
    help = (
        "Consulta la API del Banxico y registra el tipo de cambio del DOF para "
        "el escenario BANXICO. Se puede ejecutar periódicamente (por ejemplo, cron)."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--fecha",
            type=str,
            help=(
                "Fecha objetivo en formato YYYY-MM-DD. Si no se proporciona, "
                "se usa la fecha actual y, de no haber dato publicado, se "
                "busca el día hábil previo."
            ),
        )

    def handle(self, *args, **options) -> None:
        fecha_opcional = options.get("fecha")
        fecha_base = self._parse_fecha(fecha_opcional)

        max_reintentos = 5 if fecha_opcional is None else 0

        for offset in range(max_reintentos + 1):
            fecha_en_turno = fecha_base - timedelta(days=offset)
            resultado = sincronizar_tipo_cambio_banxico(fecha_en_turno)

            if resultado.get("success"):
                if offset > 0:
                    self.stdout.write(
                        self.style.WARNING(
                            "La fecha solicitada no tenía dato disponible; "
                            f"se usó {fecha_en_turno:%Y-%m-%d}."
                        )
                    )

                self.stdout.write(self.style.SUCCESS(resultado["message"]))
                return

            if resultado.get("code") == "no_data" and offset < max_reintentos:
                self.stdout.write(self.style.WARNING(resultado["message"]))
                continue

            raise CommandError(resultado.get("message", "Error desconocido al obtener el tipo de cambio."))

        raise CommandError(
            "No se encontró un tipo de cambio publicado en los últimos "
            f"{max_reintentos + 1} días."
        )

    def _parse_fecha(self, fecha_opcional: str | None) -> date:
        if not fecha_opcional:
            return date.today()

        try:
            return datetime.strptime(fecha_opcional, "%Y-%m-%d").date()
        except ValueError as exc:
            raise CommandError(
                "El formato de fecha debe ser YYYY-MM-DD"
            ) from exc
