# Estación KUS Medios Downloader

Descargador privado (audio MP3 + video MP4) con interfaz web profesional y control de acceso por código.

## Acceso privado
- Código por defecto: `ESTKUS-2026-PRIV-9X7F2A-KM4`
- Recomendado en producción: configurar `ACCESS_CODE` como secreto/variable de entorno.

## Ejecutar local en modo web
```bash
cd Proyecto_GitHub_Final
npm install
ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4 APP_RUNTIME=web npm run start:web
```
Abrir: `http://localhost:3000`

## Variables de entorno
- `PORT`: puerto HTTP (default `3000`)
- `HOST`: host bind (default `0.0.0.0`)
- `ACCESS_CODE`: código privado requerido
- `APP_RUNTIME`: usar `web` para entorno web/cloud

## GitHub Pages + Backend (nuevo)
Este proyecto ahora publica automáticamente el frontend en GitHub Pages con `.github/workflows/deploy-pages.yml`.

### Importante
GitHub Pages **solo sirve archivos estáticos**. Las descargas reales (API `/api/*`) requieren el servidor Node desplegado (Render/Railway/Fly/Docker).

### Flujo recomendado
1. Despliega el backend Node (Render/Railway/Fly) usando `Proyecto_GitHub_Final/Dockerfile`.
2. Define en backend:
   - `ACCESS_CODE=tu_codigo_privado`
   - `APP_RUNTIME=web`
3. Activa GitHub Pages en repo: **Settings → Pages → Source: GitHub Actions**.
4. Haz push a `main` para ejecutar `deploy-pages`.
5. Abre el link de GitHub Pages.
6. En la app, en campo **URL backend**, pega la URL pública de tu backend y presiona **Guardar backend**.
7. Ingresa el código privado y usa la app normalmente.


### Configuración de backend en frontend
Puedes configurar backend de 2 formas:
- URL completa: `https://tu-backend.com`
- Ruta relativa detrás de proxy/reverse proxy: `/backend`

Con `/backend`, el frontend llamará rutas como `/backend/api/access/validate` y `/backend/api/events`.

## CI / Validación
Workflow: `.github/workflows/web-ci.yml`
- `npm ci`
- `npm run ci:check`
- smoke test HTTP en modo web

## Notas importantes
- En entorno web se deshabilita seleccionar carpeta local y “abrir carpeta” (funciones de escritorio/Windows).
- Mantén `yt-dlp` y `ffmpeg` disponibles en imagen/servidor si usarás descargas reales.
