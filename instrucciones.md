# instrucciones.md

## Cambios realizados en esta versión
- Se corrigió el flujo de autenticación para evitar el bloqueo con mensaje: `No se pudo validar con el backend configurado`.
- Se añadió configuración de backend directamente en la pantalla de login (overlay):
  - campo `URL backend (obligatorio en GitHub Pages)`
  - botón `Guardar backend`.
- Se sincronizó la URL del backend entre el overlay de acceso y el panel principal para evitar configuraciones inconsistentes.
- Se agregó detección explícita de GitHub Pages:
  - si estás en `github.io` y no configuraste backend externo, se muestra un mensaje claro antes de validar código.
- Se mejoraron mensajes de error de login para distinguir:
  - código inválido (401),
  - backend con error,
  - falta de conectividad o URL incorrecta.

## Requisitos o dependencias nuevas
- No se agregaron dependencias nuevas.
- Requisito operativo clave en GitHub Pages:
  - Configurar la URL pública del backend antes de ingresar el código.

## Guía paso a paso para probar la funcionalidad
1. Ir al proyecto:
   - `cd /workspace/descargador---no-es-m-o-base/Proyecto_GitHub_Final`
2. Ejecutar verificación de sintaxis:
   - `npm run ci:check`
3. Iniciar backend local:
   - `ACCESS_CODE=ESTKUS-2026-PRIV-9X7F2A-KM4 APP_RUNTIME=web npm run start:web`
4. Abrir app:
   - `http://localhost:3000`
5. En login, confirmar backend:
   - En local: `http://localhost:3000`
   - En GitHub Pages: URL pública real del backend (Render/Railway/Fly).
6. Presionar `Guardar backend`.
7. Ingresar código:
   - `ESTKUS-2026-PRIV-9X7F2A-KM4`
8. Validar resultado:
   - Debe desbloquear la app sin mostrar el error de backend.
