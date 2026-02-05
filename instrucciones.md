# instrucciones.md

## Cambios realizados en esta versión
- Se corrigió la validación de acceso para evitar falsos "Código incorrecto" por diferencias de mayúsculas/minúsculas o espacios accidentales.
- `server.js` ahora normaliza el código (`trim + lowercase`) en:
  - validación de login (`/api/access/validate`)
  - autorización de endpoints protegidos (`x-access-code`, body, query).
- Se mejoró el mensaje de error en frontend:
  - si responde 401: `Código incorrecto`.
  - si falla backend/URL: mensaje específico para revisar la URL del backend.

## Requisitos o dependencias nuevas
- No se agregaron dependencias nuevas.
- El código activo por defecto sigue siendo:
  - `estacionkusmedios`

## Guía paso a paso para probar la funcionalidad
1. Ir al proyecto:
   - `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Ejecutar validación sintáctica:
   - `npm run ci:check`
3. Iniciar servidor:
   - `ACCESS_CODE=estacionkusmedios APP_RUNTIME=web npm run start:web`
4. Probar login válido (con variaciones):
   - `estacionkusmedios`
   - ` EstacionKusMedios `
5. Verificar que ambos permitan acceso.
6. Probar login inválido:
   - `otro-codigo`
7. Verificar que muestre `Código incorrecto`.
8. Si estás en GitHub Pages, confirmar URL backend correcta en el campo de configuración.
