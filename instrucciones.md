# instrucciones.md

## Cambios realizados en esta versión
- Se actualizó el código privado de acceso web al nuevo valor solicitado:
  - `ESTKUS-2026-PRIV-9X7F2A-KM4`
- Se ajustó el valor por defecto en backend (`server.js`) para que el login y los endpoints protegidos funcionen con el nuevo código.
- Se actualizaron los flujos de verificación automática en CI (`.github/workflows/web-ci.yml`) para validar el nuevo código en el smoke test.
- Se actualizó la documentación operativa (`Proyecto_GitHub_Final/README.md`) con el nuevo código para pruebas locales.

## Requisitos o dependencias nuevas
- No se agregaron nuevas dependencias.
- Se mantiene la arquitectura de seguridad basada en variable de entorno:
  - `ACCESS_CODE` (si no se define, usa por defecto `ESTKUS-2026-PRIV-9X7F2A-KM4`).

## Guía paso a paso para probar la funcionalidad
1. Entrar al proyecto:
   - `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Ejecutar checks de sintaxis:
   - `npm run ci:check`
3. Iniciar la app en modo web con el nuevo código:
   - `ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4 APP_RUNTIME=web npm run start:web`
4. Abrir en navegador:
   - `http://localhost:3000`
5. En la pantalla de acceso, ingresar exactamente:
   - `ESTKUS-2026-PRIV-9X7F2A-KM4`
6. Validar API de acceso (opcional por terminal):
   - `curl -X POST http://127.0.0.1:3000/api/access/validate -H 'Content-Type: application/json' -d '{"accessCode":"ESTKUS-2026-PRIV-9X7F2A-KM4"}'`
7. Verificar resultado esperado:
   - Respuesta `{"success":true,"message":"Acceso concedido"}`.
