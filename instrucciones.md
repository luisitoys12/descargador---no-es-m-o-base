# instrucciones.md

## Cambios realizados en esta versión
- Se corrigió la parte faltante de **GitHub Pages** creando el workflow de despliegue automático: `.github/workflows/deploy-pages.yml`.
- Se preparó el frontend para ejecutarse en GitHub Pages con configuración de backend externo:
  - Nuevo archivo `Proyecto_GitHub_Final/public/config.js`.
  - Nuevo campo en UI para guardar la **URL del backend** (`apiBase`) desde el navegador.
  - `public/script.js` ahora construye llamadas API dinámicamente hacia la URL configurada.
- Se actualizó `Proyecto_GitHub_Final/public/index.html` para incluir la configuración de backend y cargar `config.js`.
- Se añadieron estilos profesionales para la nueva sección de configuración en `public/style.css`.
- Se actualizó `Proyecto_GitHub_Final/README.md` con guía completa de GitHub Pages + backend.

## Requisitos o dependencias nuevas
- No se añadieron dependencias npm nuevas.
- Requisito operativo nuevo:
  - Activar GitHub Pages en **Settings → Pages → Source: GitHub Actions**.
  - Tener backend Node desplegado públicamente (Render/Railway/Fly/Docker) para endpoints `/api/*`.

## Guía paso a paso para probar la funcionalidad
1. Probar localmente:
   - `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
   - `npm ci`
   - `ACCESS_CODE=estacionkusmedios APP_RUNTIME=web npm run start:web`
2. Abrir en navegador:
   - `http://localhost:3000`
3. Validar UI:
   - Verifica que aparezca el campo **URL backend (opcional para GitHub Pages)**.
   - Guarda `http://localhost:3000` como backend y valida que no muestre error.
4. Validar código:
   - Ingresar `estacionkusmedios` en el login.
5. Publicar en GitHub Pages:
   - Hacer push a `main`.
   - Verificar workflow `deploy-pages` en Actions.
   - Abrir la URL de Pages generada por GitHub.
6. En Pages, configurar backend real:
   - Pegar URL pública del backend (por ejemplo, Render/Railway) y presionar **Guardar backend**.
   - Ingresar código de acceso y probar descargas.
