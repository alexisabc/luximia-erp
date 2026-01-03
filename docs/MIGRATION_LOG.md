# Bitácora de Migración y Refactorización

Este documento registra los cambios significativos realizados en el proyecto para alinearse con los principios de arquitectura y estándares de ingeniería definidos.

## Registro de Cambios

| Fecha | Módulo | Tipo | Descripción | Responsable |
|-------|--------|------|-------------|-------------|
| 2026-01-02 | Infraestructura / Docker | Configuración | Optimización de Docker Compose: Eliminación de servicio `pgadmin` (sustituido por cliente nativo Beekeeper Studio) y restricción de `mailhog` exclusivamente al entorno local (`override`). Eliminación de servicios innecesarios en producción para reducir consumo de recursos (Green Coding). | Antigravity |
