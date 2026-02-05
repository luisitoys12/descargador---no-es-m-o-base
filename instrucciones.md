# instrucciones.md

## Cambios realizados en esta versión
- Se habilitó soporte formal para configurar backend como **ruta relativa** (ejemplo: `/backend`) además de URL completa.
- Se corrigió la normalización de `apiBase` en frontend para aceptar:
  - `https://tu-backend.com`
  - `https://tu-backend.com/subruta`
  - `/backend`
- Se reforzó el armado de endpoints para evitar errores de barras (`//`) al construir URLs de API y SSE.
- Se actualizaron placeholders de UI para guiar al usuario con ejemplo directo: `URL backend o ruta (ej: /backend)`.
- Se actualizó documentación operativa (`README.md`) para incluir el modo `/backend`.

## Requisitos o dependencias nuevas
- No se agregaron dependencias nuevas.
- Para usar `/backend`, tu infraestructura debe enrutar esa ruta al servidor Node del descargador.

## Guía paso a paso para probar la funcionalidad
1. Entrar al proyecto:
   - `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Ejecutar checks:
   - `npm run ci:check`
3. Iniciar backend:
   - `ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4 APP_RUNTIME=web npm run start:web`
4. Abrir app:
   - `http://localhost:3000`
5. En login, configurar backend:
   - URL completa: `http://localhost:3000`
   - o ruta relativa (si aplica): `/backend`
6. Presionar `Guardar backend`.
7. Ingresar código:
   - `ESTKUS-2026-PRIV-9X7F2A-KM4`
8. Verificar acceso concedido.

## Nota de despliegue
- En GitHub Pages normalmente usarás URL completa pública del backend.
- Usa `/backend` cuando frontend y backend estén detrás del mismo dominio con reverse proxy.
