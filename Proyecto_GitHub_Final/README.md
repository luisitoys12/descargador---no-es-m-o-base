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

## Despliegue recomendado: Netlify + Backend Node
Este repo ya quedó listo para Netlify con:
- `netlify.toml` (publish + redirects)
- `netlify/functions/backend-proxy.js` (proxy seguro hacia backend)

### Flujo profesional (producción)
1. Despliega backend Node (Render/Railway/Fly) usando `Proyecto_GitHub_Final/Dockerfile`.
2. En backend define:
   - `ACCESS_CODE=tu_codigo_privado`
   - `APP_RUNTIME=web`
3. Crea sitio en Netlify conectado a este repo.
4. En Netlify configura:
   - Build command: *(vacío)*
   - Publish directory: `Proyecto_GitHub_Final/public`
   - Variable de entorno: `BACKEND_ORIGIN=https://tu-backend-publico.com`
5. Deploy.
6. Abre tu dominio Netlify (`https://tu-sitio.netlify.app`) y entra con el código.

### ¿Cómo funciona?
- Frontend en Netlify usa `/backend` por defecto (solo en `*.netlify.app`).
- Netlify redirige `/backend/*` a la función `backend-proxy`.
- La función reenvía la petición al backend real usando `BACKEND_ORIGIN`.

## CI / Validación
Workflow: `.github/workflows/web-ci.yml`
- `npm ci`
- `npm run ci:check`
- smoke test HTTP en modo web

## Notas importantes
- En entorno web se deshabilita seleccionar carpeta local y “abrir carpeta” (funciones de escritorio/Windows).
- Mantén `yt-dlp` y `ffmpeg` disponibles en imagen/servidor si usarás descargas reales.
