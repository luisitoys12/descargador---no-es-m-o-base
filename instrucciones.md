# instrucciones.md

## Cambios realizados en esta versión
- Se corrigió el problema reportado en GitHub Actions (**Setup Node cache path unresolved**).
- Se agregó `Proyecto_GitHub_Final/package-lock.json` para que:
  - `npm ci` funcione de forma determinística en CI.
  - `actions/setup-node` pueda resolver correctamente el `cache-dependency-path` configurado en `.github/workflows/web-ci.yml`.
- Se validó nuevamente el flujo de instalación y checks en entorno limpio con `npm ci` + `npm run ci:check`.

## Requisitos o dependencias nuevas
- No se agregaron nuevas dependencias de aplicación.
- Se añadió lockfile de npm como artefacto de control de versiones:
  - `Proyecto_GitHub_Final/package-lock.json`

## Guía paso a paso para probar la funcionalidad
1. Abrir terminal en:
   - `/workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Instalar dependencias de forma reproducible:
   - `npm ci`
3. Ejecutar validaciones de sintaxis:
   - `npm run ci:check`
4. Ejecutar app en modo web:
   - `ACCESS_CODE=estacionkusmedios APP_RUNTIME=web npm run start:web`
5. Abrir navegador:
   - `http://localhost:3000`
6. Verificar en GitHub Actions:
   - workflow `web-ci` debe pasar sin warning de cache path no resuelto en `Setup Node`.
