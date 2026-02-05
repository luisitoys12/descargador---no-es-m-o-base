# instrucciones.md

## Cambios realizados en esta versión
- Se configuró el proyecto para funcionar correctamente en **entorno web/cloud** (GitHub + despliegue externo):
  - Backend ahora usa variables de entorno `PORT`, `HOST`, `ACCESS_CODE` y `APP_RUNTIME`.
  - Se eliminó dependencia rígida a `localhost` en frontend usando `window.location.origin`.
- Se añadió compatibilidad cross-platform para `yt-dlp` (`yt-dlp.exe` en Windows y `yt-dlp` en Linux).
- Se robustecieron endpoints de carpeta para entorno web:
  - `/api/choose-directory` y `/api/open-folder` devuelven error controlado en web/no-Windows.
- Se añadió **pipeline de GitHub Actions** (`.github/workflows/web-ci.yml`) con:
  - instalación de dependencias,
  - checks de sintaxis,
  - smoke test de servidor en modo web.
- Se añadió infraestructura de contenedor:
  - `Proyecto_GitHub_Final/Dockerfile`
  - `Proyecto_GitHub_Final/.dockerignore`
- Se actualizó `README.md` con guía de ejecución web y despliegue recomendado en servicios conectados a GitHub.
- Se actualizaron scripts en `package.json`:
  - `start:web`
  - `ci:check`

## Requisitos o dependencias nuevas
- No se agregaron nuevas librerías de npm.
- Requisitos de ejecución web:
  - Node.js 20+ (recomendado)
  - Variables de entorno configuradas (al menos `ACCESS_CODE` en producción)
- Requisitos para descargas reales:
  - `yt-dlp`
  - `ffmpeg`

## Guía paso a paso para probar la funcionalidad
1. Abrir terminal en:
   - `/workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Instalar dependencias:
   - `npm install`
3. Ejecutar checks:
   - `npm run ci:check`
4. Iniciar en modo web:
   - `ACCESS_CODE=estacionkusmedios APP_RUNTIME=web npm run start:web`
5. Abrir navegador:
   - `http://localhost:3000`
6. Ingresar código privado:
   - `estacionkusmedios`
7. Validar flujo:
   - Probar análisis de URL.
   - Probar cola MP3/MP4.
8. Verificar CI en GitHub:
   - Revisar workflow `web-ci` en pestaña **Actions**.
9. (Opcional) Probar contenedor local:
   - `docker build -t kus-downloader ./Proyecto_GitHub_Final`
   - `docker run -p 3000:3000 -e ACCESS_CODE=estacionkusmedios -e APP_RUNTIME=web kus-downloader`
