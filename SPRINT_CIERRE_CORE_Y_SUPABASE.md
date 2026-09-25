# Sprint de cierre del core y ruta a Supabase

Fecha: 18/09/2026. Actualizado: 25/09/2026. Responsable técnico: Codex. Auditor: Claude, mediante
evidencia compartida por el Fundador. QA de dispositivo y decisiones: Fundador.

## Objetivo y alcance

Cerrar una misión completa: descubrir → planificar → guardar → iniciar → llegar
→ crear un recuerdo → recuperar el estado. Integrar el core revisado antes de
activar backend. Guardianes locales y AR opcional son entregas posteriores,
con sus propios criterios; no se declaran incluidos en el core actual.

Este documento organiza trabajo; no autoriza merge, cambios de protección Vercel
ni activación de Supabase. Enlaces cortos remotos siguen en HOLD hasta abrir
expresamente su bloque. No hay fecha de cierre inventada: se avanza por gates.

## Evidencia de partida

- Auditoría aportada de `ffb2da8`: GO condicionado, 78/78 pruebas, build correcto,
  lint heredado 11 errores/5 warnings, bundle 262.43 kB gzip. No se repitió esa
  suite al redactar este plan.
- La cadena remota incluye las nueve pruebas de compartir/reacciones; no hace
  falta rescatar el commit local `755f729`.
- Fundador confirmó acceso y guardado/recuperación en X8b.
- Capturas de escritorio: sábado 19, tarde 15:00–18:00 conservados; Bicho
  15:06–16:06, 6 minutos de traslado y 60 de visita, con 17 descartes.
  Esto no demuestra que todos los motivos de descarte sean correctos.
- El motor usa franjas de comida ocupadas y puede esperar a otra franja antes
  de evaluar tiempo. Es una hipótesis fundada para reproducir el caso, no un
  diagnóstico final ni motivo para encadenar restaurantes.
- La apertura del enlace por destinatarios continúa pendiente; compactar el
  payload no elimina la protección del deployment ni crea un enlace corto.

## Sprint 1: cerrar e integrar el core

| Orden | Responsable | Trabajo concreto | Criterio de cierre |
|---|---|---|---|
| P0-1 | Codex | Reproducir París 12–15 y Bicho 15–18 con fecha, ubicación y transporte controlados. Separar falta de tiempo, franja de comida ocupada y siguiente franja fuera del plan. Corregir lógica o explicación según evidencia; ES/EN y prueba de regresión. | Cada descarte se puede justificar con horario, duración y regla real. Una sola comida no se considera defecto por sí misma. No se rellena artificialmente la ventana. |
| P0-2 | Codex + Fundador | Identificar un único preview por SHA. Probar enlace compacto y V1 en navegador limpio; guardar, recargar, reemplazar; compartir/cancelar/volver y apertura por destinatario. Resolver la vía de acceso al preview con el propietario si está protegido. | Plan idéntico al abrir, fixture antiguo conserva ocho paradas, sin copia al cancelar ni pantalla negra. Acceso del destinatario comprobado por separado de la longitud. |
| P0-3 | Codex + Fundador | Recorrido X8b: Hospes → misión cercana → GPS/llegada → cámara vertical/selfie → MemoryCard → suspensión y recuperación. Incluir puerta de Valle Azul cuando se visite. Corregir fallos reproducibles. | Inicio y cierre correctos, llegada según regla vigente, foto y recorrido recuperables, sin pérdida ni saltos imposibles tras suspensión. Evidencia del teléfono; simulación no sustituye campo. |
| P0-4 | Codex + Fundador | Completar checklist A/B/C/E/H aplicable: mañana/tarde/noche, lluvia/interiores, nocturnos y medianoche, feriados, ficha lechón, huariques, ES/EN y reacciones simultáneas. Agrupar en una sesión de escritorio y una salida X8b. | Cada caso tiene PASÓ/FALLÓ/NO APLICA justificado, dispositivo y evidencia. No repetir casos ya probados salvo que un cambio los afecte. |
| P0-5 | Codex; revisión Claude | Publicar candidato corregido en rama autorizada con enlace y SHA. Ejecutar suite relevante y gate final: build, lint sin aumento del baseline, compatibilidad, bundle y alcance. Entregar diff incremental. | Auditoría del SHA exacto; ningún fallo de persistencia, llegada o seguridad abierto. Incremento gzip bajo el umbral vigente de 15 kB frente a main. |
| P0-6 | Fundador autoriza; Codex ejecuta | Verificar main remoto y posibilidad de fast-forward; integrar candidato aprobado y comprobar deployment de producción, rutas, plan antiguo/nuevo y misión. Preparar recuperación al SHA previo. | Autorización final sobre candidato concreto, SHA main/deployment verificables y smoke test aprobado. Si main avanzó, revisar y validar nueva base antes de integrar. |

Dependencia: P0-1 y preparación técnica de P0-2/3/4 preceden al candidato final;
el Fundador agrupa QA mientras Codex resuelve lo reproducible. P0-5 requiere
cerrar P0-1/2/3/4. P0-6 requiere P0-5. No pedir una caminata por cada commit.
Una sesión y una salida son un objetivo, no un techo. Si un cambio real afecta
un caso validado, repetir los casos afectados con nueva evidencia.

El auditor aceptó la hoja de ruta; esto no constituye GO/NO-GO del candidato.

## Sprint 2: backend mínimo útil — todavía HOLD

Abrir tras cerrar el core y autorizar esta etapa. Implementar una función de
extremo a extremo antes de añadir las siguientes.

| Orden | Función y dependencias | Pruebas de aceptación |
|---|---|---|
| S1 | Definir datos, conservación, eliminación y consentimiento/política según uso. Preparar entornos separados, migraciones y políticas de acceso; secretos privilegiados solo servidor. | Acceso anónimo/autenticado permitido o rechazado según contrato; no se expone información de otro usuario. Fallo de red no rompe las funciones locales. |
| S2 | Enlaces cortos: snapshot portable → identificador → apertura. Definir caducidad y revocación; mantener lector legacy. | WhatsApp comparte URL corta; otro navegador recupera el plan sin iniciar sesión si ese es el contrato elegido; ID inválido/caducado muestra estado claro. |
| S3 | R5/QR: recuperar e inspeccionar implementación existente, consentimiento, exclusión de cohortes internas, cola offline y deduplicación. | Sin consentimiento no se envían eventos; reintentos no duplican; pruebas internas no contaminan reportes. |
| S4 | Primer premio real: aliado, beneficio, stock y canje; acceso del aliado, permisos y registro del canje. Depende de definir qué XP se puede validar en servidor. | Dos canjes concurrentes no gastan la misma unidad; reintentar no duplica; un aliado no modifica otro. XP local manipulable no concede beneficios por sí solo. |
| S5 | Cuenta y sincronización de planes, favoritos y colección, si se necesita entre dispositivos. | Aislamiento entre usuarios, regla explícita de conflictos y borrado; modo local conserva utilidad. |

Fotos en nube, RAG de Hospes y panel B2B completo se posponen. No construirlos
antes de demostrar uso real de enlaces, medición y un canje.

## Guardianes y AR: entregas separadas

| Orden | Entrega | Cierre verificable |
|---|---|---|
| G1 | Un circuito local de Guardián, XP y colección; escoger un solo guardián/lugar del catálogo antes de implementar. | Completar misión concede una vez, persiste al recargar, no se duplica al recuperar la pestaña. Funciona sin cuenta y sin cámara AR. |
| G2 | Animación y presentación del Guardián y su recuerdo. | Legible y fluido en X8b; assets cargados solo cuando se necesitan. Misión y colección funcionan si falla el visor. |
| AR1 | Prototipo opcional con marcador o visor 3D y captura del Guardián en MemoryCard. Revisar contratos de cámara/captura antes de reutilizar código antiguo. | Prueba X8b de permisos, estabilidad, pérdida del marcador, foto y retorno. No usar la posición visual para certificar llegada. |

El checklist vigente retira AR world-locked basado solo en GPS/brújula y el
faro de misión. La referencia histórica `b3d9efc` no pudo ser verificada por el
auditor y no se utiliza como evidencia de un commit remoto existente. No
rescatar el AR anterior. Cualquier propuesta nueva requiere especificación
y validación propias; no se reactiva el enfoque retirado por defecto.

## Rendimiento y deuda

Antes de cargar modelos de Guardianes/AR, separar sus módulos y assets del
arranque. El code splitting del core se atiende si incumple el presupuesto o
la prueba X8b identifica lentitud; no mezclar una refactorización masiva con
correcciones de persistencia. Reducir lint heredado por módulo tocado y mantener
el baseline visible; no afirmar lint verde.

## Seguimiento y siguiente acción

Cada tarea avanza: PENDIENTE → EN CURSO → IMPLEMENTADA@SHA → REVISADA →
VALIDADA → INTEGRADA. Una prueba automática no sustituye evidencia de móvil.
Cada entrega indica rama, SHA, enlace, casos comprobados y fallos restantes.

P0-1: corrección IMPLEMENTADA LOCAL; 82/82 pruebas y build correcto.
Pendientes revisión del cambio y comprobación visual.
Ver `DIAGNOSTICO_P0_1_DESCARTES.md` y el script de reproducción asociado.
El Fundador solo debe aportar controles que falten para reproducir el caso
(transporte/ubicación); Codex primero obtiene todo lo posible del código.

## Corte posterior al merge — 25/09/2026

`main @ 515cd1b`: 17 commits integrados por autorización del Fundador,
producción Vercel exitosa y Home brújula aprobado en X8b. Esto no cierra
P0-2/3/4: siguen pendientes destinatario ajeno y misión completa en producción.
Claude confirmó la brecha de inicio manual desde ficha. Corrección candidata:
puerta común en `startWalking`, seguridad bloqueante y horarios con confirmación
explícita; planificación previa sigue bloqueando el inicio espontáneo.
La propuesta mantiene motores compartidos y no altera GPS/llegada ni snapshots.
Pruebas y evidencia del candidato: `REVISION_P0_INICIO_MISION.md`.
Supabase permanece HOLD hasta cerrar el core y abrir su etapa.
