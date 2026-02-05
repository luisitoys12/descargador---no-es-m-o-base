# Estación KUS Medios Downloader

Descargador privado (audio MP3 + video MP4) con interfaz web profesional y control de acceso por código.

## Acceso privado
- Código por defecto: `estacionkusmedios`
- Recomendado en producción: configurar `ACCESS_CODE` como secreto/variable de entorno.

## Ejecutar local en modo web
```bash
cd Proyecto_GitHub_Final
npm install
ACCESS_CODE=estacionkusmedios APP_RUNTIME=web npm run start:web
```
Abrir: `http://localhost:3000`

## Variables de entorno
- `PORT`: puerto HTTP (default `3000`)
- `HOST`: host bind (default `0.0.0.0`)
- `ACCESS_CODE`: código privado requerido
- `APP_RUNTIME`: usar `web` para entorno web/cloud

## GitHub: entorno para correr desde web
Este repo ya incluye:
- **Workflow CI**: `.github/workflows/web-ci.yml`
  - Instala dependencias
  - Ejecuta checks de sintaxis
  - Levanta servidor en modo web y hace smoke test HTTP
- **Dockerfile** (`Proyecto_GitHub_Final/Dockerfile`) para desplegar en Render/Railway/Fly/Docker host.

### Despliegue recomendado (Render o Railway)
1. Conecta el repo de GitHub.
2. Elige despliegue con Docker.
3. Configura variables:
   - `ACCESS_CODE=tu_codigo_privado`
   - `APP_RUNTIME=web`
4. Publica el servicio y abre la URL pública.

## Notas importantes
- En entorno web se deshabilita seleccionar carpeta local y “abrir carpeta” (funciones de escritorio/Windows).
- Mantén `yt-dlp` y `ffmpeg` disponibles en imagen/servidor si usarás descargas reales.
