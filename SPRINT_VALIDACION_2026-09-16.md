# Sprint — validación complementaria del 16/09/2026

## Auditoría recibida

El Fundador compartió la auditoría de Claude sobre
`6e8fe3a04c77c3e5940827cd9fac009a205c95c3`, árbol `c921ef4`:
GO CONDICIONADO a validación funcional en HONOR X8b. Se aceptó la ampliación
del Set de motivos de migración y se confirmaron las siete preguntas técnicas.
El incremento acumulado de bundle reportado por Claude es 9.83 kB gzip desde
main, dentro del umbral de 15 kB. No se ejecutó otra auditoría equivalente.

## Verificación nueva ejecutada por Codex

Rama local `test/sprint-share-reactions-v1`, creada desde el SHA remoto auditado.
Solo se añaden pruebas y este registro; no cambia código de aplicación,
dependencias, bundle, datos ni el candidato desplegado.

`npm run test:itinerary`: **74/74 aprobadas**, 0 fallos, 0 omitidas.
`npx eslint tests/share-reactions.integration.test.mjs`: aprobado.
`git diff --check`: aprobado.

Las cinco pruebas adicionales llaman a los motores reales mediante Vite SSR:

1. Lectura de enlace V1 antiguo: migración conservando las ocho paradas.
2. Generación y lectura de enlace nuevo tras vaciar almacenamiento simulado:
   conserva fecha, horarios, preferencias y paradas; omite descartes según contrato.
3. Rechazo de payload inválido, corrupto, excesivo o estructuralmente incompleto.
4. Me gusta y Recomendar simultáneos tras relectura, sin duplicados ni eventos
   de actualización provocados por leer el perfil.
5. Perfil legacy con una reacción: se conserva al agregar la segunda.

Son pruebas de lógica con almacenamiento simulado. No certifican interacción
visual, recarga real del navegador, otro dispositivo ni permisos de compartir.
No se repitió build porque no hay cambios de aplicación respecto al candidato
que ya pasó build. El baseline de lint global sigue pendiente; no se declara verde.

## Bloqueos comprobados

- Navegador: continúa en formulario Google de acceso a Vercel. No hay una sesión
  autenticada verificada ni resultado de regresión visual.
- Enlaces cortos: GitHub devuelve 422 / No commit found for SHA `ef490ce`.
  La rama tampoco estaba en la búsqueda anterior. Esto no prueba que el trabajo
  no exista en otro entorno local: hace falta recuperarlo del entorno que lo creó.
  Los enlaces largos actuales sí pasan los nuevos tests de compatibilidad.

## Próximos cierres

1. Acceso al preview y regresión visual: Hospes, itinerarios, ES/EN,
   guardado/recarga, reacciones y ficha de Ruta del lechón.
2. HONOR X8b: GPS/llegada, cámara, MemoryCard, compartir y recuperación Android.
3. Puerta de Valle Azul: confirmación física.
4. Recuperar enlaces cortos por separado; no está en el candidato auditado.
5. Con evidencia funcional y autorización final, integrar el SHA aprobado y
   comprobar producción. No hay permiso de merge derivado del GO condicionado.

No se realizó push adicional, merge, despliegue ni cambios externos en este bloque.
