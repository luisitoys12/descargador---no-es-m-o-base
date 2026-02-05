# instrucciones.md

## Cambios realizados en esta versión
- Se configuró despliegue completo para **Netlify** con arquitectura lista para producción.
- Se añadió `netlify.toml` con:
  - publicación estática desde `Proyecto_GitHub_Final/public`
  - redirect de `/*` a `index.html`
  - proxy de `/backend/*` a función serverless.
- Se creó `netlify/functions/backend-proxy.js` para reenviar llamadas API/SSE al backend Node usando variable `BACKEND_ORIGIN`.
- El frontend ahora usa `/backend` por defecto automáticamente cuando se ejecuta en dominio `*.netlify.app`.
- Se actualizó `README.md` con guía de despliegue Netlify + backend Node.

## Requisitos o dependencias nuevas
- No se agregaron paquetes npm nuevos.
- Requisito operativo nuevo en Netlify:
  - Definir variable de entorno `BACKEND_ORIGIN` con la URL pública del backend.

## Guía paso a paso para probar la funcionalidad
1. Desplegar backend Node (Render/Railway/Fly) con:
   - `ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4`
   - `APP_RUNTIME=web`
2. En Netlify, conectar el repo y configurar:
   - Publish directory: `Proyecto_GitHub_Final/public`
   - Variable: `BACKEND_ORIGIN=https://tu-backend-publico.com`
3. Deploy del sitio Netlify.
4. Abrir URL Netlify final (`https://tu-sitio.netlify.app`).
5. Ingresar código:
   - `ESTKUS-2026-PRIV-9X7F2A-KM4`
6. Verificar que login funcione y que las llamadas API pasen por `/backend` correctamente.

## Validación local recomendada
1. `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. `npm run ci:check`
3. `ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4 APP_RUNTIME=web npm run start:web`
4. Abrir `http://localhost:3000` y validar login.
