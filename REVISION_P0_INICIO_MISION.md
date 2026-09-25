# Candidato P0: inicio manual de misión — 25/09/2026

Base remota de producción: `515cd1b646209ce6765172d3cf910d1102b96bb8`.
Revisión independiente previa de Claude confirma la brecha y propone:
seguridad bloquea; horario informa y requiere aceptación explícita.

## Cambio

- `JourneyContext.startWalking` ejecuta la puerta común antes de feedback,
  GPS, escritura de estado o modificaciones de la misión existente.
- `missionStartPolicy` reutiliza `getExperienceSafetyReason` (la misma política
  de `filterSafeExperiences`), `getScheduleReadiness` y `getExperienceOpeningStatus`.
- Riesgo climático, nocturno o lugar inactivo: bloqueo sin opción de omitir.
- Clima cargando o fallido se entrega como desconocido, no como clima de respaldo.
- Cerrado, horario variable o no verificado: confirmación explícita ES/EN;
  cancelar devuelve false sin iniciar. No se afirma cerrado un horario desconocido.
- Planificación previa: mantiene bloqueo de salida espontánea, incluido Huaytapallana.
- Consulta hora al pulsar iniciar. No modifica las reglas de GPS/llegada,
  recuperación de misión en curso, snapshots, catálogo, AR ni Supabase.
- Se usan diálogos nativos del navegador; validación visual X8b pendiente.

## Verificación ejecutada

96/96 pruebas. Build correcto; JS principal 266.05 kB gzip.
Lint: baseline 11 errores / 5 advertencias. Lockfile sin cambios.
Siete pruebas nuevas: riesgos sin override; aceptación/cancelación de cerrado;
horario desconocido; interior abierto con lluvia; planificación previa;
medianoche/cierre exacto; handlers reales de JourneyProvider sin efectos al denegar.
El test del Provider ejecuta código transpilado con dobles de navegador y hooks:
no sustituye pruebas físicas de GPS ni de cámara.

## Revisión solicitada a Claude

1. Verificar que todos los consumidores de startWalking atraviesan la puerta.
2. Revisar distinción seguridad/horario/planificación y ausencia de override del bloqueo.
3. Verificar que cancelar no modifica misión activa ni dispara GPS.
4. Confirmar alcance y mensajes ES/EN antes de integrar el candidato.

## QA y pendientes

X8b: ficha nocturna de cerro bloquea; local cerrado seguro muestra aviso;
cancelar conserva estado; aceptar inicia; local abierto sigue iniciando.
No salir a un lugar riesgoso para probar el bloqueo.
Luego: recorrido seguro completo en producción y destinatario ajeno del enlace.
Supabase sigue HOLD. Este documento no declara GO de campo ni merge del candidato.
