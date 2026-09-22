# P0-1 — diagnóstico previo a la corrección

22/09/2026. Estado: REPRODUCIDO LOCAL; no es una corrección ni un GO del sprint.

## Base y ejecución

Código local HEAD `2415fbb89d30e6aa29e386fd65fcb689b616941f`.
La referencia remota almacenada de la rama de integración apunta a
`ffb2da8f8e89c3e37a87b5aab62543034446a4c1`. Comparación de árboles sin diferencias.
No se hizo fetch en esta sesión; no se afirma que main o GitHub sigan iguales hoy.

Ejecutado con salida 0:

```bash
node scripts/diagnose-meal-exclusions.mjs
```

Cuatro escenarios del motor real y contrastes del selector de franjas; todas
las aserciones del script pasaron. No se volvió a ejecutar la suite completa,
build ni lint. No se modificó código de producción ni se hizo push/merge.

## Controles y límites

Fecha fija 19/09/2026, caminando, interés gastronomía, perfil vacío, sin clima
remoto. Catálogo real para Bicho, París y La Petite Bakery; origen fijo en el
local. El segundo restaurante del caso de almuerzo es un duplicado sintético
de París con ID distinto para aislar la regla de franjas.

No es reconstrucción exacta de la sesión del usuario: faltan sus coordenadas,
transporte y perfil completos. Por eso Bicho empieza 15:02 en el caso
controlado y 15:06 en la captura. No se han explicado individualmente los
17 descartes ni confirmado las reglas de comidas como preferencia del usuario.

## Resultados

| Caso | Resultado actual | Causa demostrada |
|---|---|---|
| Bicho + París + Bakery, 15–18 | Bicho 15:02–16:02. París: falta tiempo. Bakery: franja no disponible. | Merienda ocupada para Bakery; París espera la cena de las 18:00 y terminaría 19:00. |
| París solo, 15–18 | Ninguna parada; falta tiempo, 240 min requeridos frente a 180. | No existe comida previa. Los 240 incluyen espera hasta 18:00 y visita de 60 min; la etiqueta no explica esa espera. |
| París solo, 12–12:30 | Falta tiempo, 62 min requeridos frente a 30. | Dos minutos mínimos de traslado más visita de 60; falta real de tiempo dentro de una franja válida. |
| Dos restaurantes equivalentes, 12–15 | Uno 12:02–13:02; segundo excluido por tiempo, 358 frente a 118 min. | Almuerzo ya ocupado, se salta a cena de las 18:00. El total incluye la espera. |

Contraste directo a las 16:06: café con merienda libre devuelve la franja
16:06–18:00; con merienda usada devuelve null. Restaurante sin franjas usadas
devuelve cena desde 18:00. Esto separa ocupación de la franja y comienzo de
la siguiente fuera del plan.

## Causa en código

`itineraryTimePolicyEngine.findNextMealWindow` recibe tipo, hora más temprana,
franjas usadas y franjas permitidas. No recibe fin del plan ni duración.
Salta las franjas usadas y devuelve la siguiente, aunque empiece al final
o después del plan. Null agrupa distintos casos sin explicar por qué.

`itineraryEngine` usa esa hora para calcular fin de visita y, si supera el fin
del plan, emite `not-enough-time`. `requiredMinutes = visitEnd - cursor` incluye
espera. `ItineraryPlanResult` muestra una etiqueta genérica por código, sin
explicar los componentes. El número no es una duración de visita incorrecta;
la explicación es insuficiente para entender la decisión.

No hay evidencia de tres errores independientes de selección. Hay causas
distintas que el contrato actual de explicación mezcla. Una sola parada
gastronómica no demuestra fallo ni justifica rellenar toda la ventana.

## Corrección a implementar y probar

1. Clasificar explícitamente: franja ya cubierta, próxima franja fuera del
   plan, ninguna franja compatible y traslado/visita que no caben.
2. Separar diagnóstico de selección: mantener por ahora ventanas, duración y
   regla de una comida por franja. Si ocupación y próxima franja concurren,
   definir precedencia: franja cubierta si sin esa ocupación la visita cabría;
   en otro caso, explicar el límite que realmente impide la visita.
3. Etiquetas ES/EN fieles a la causa; si se amplían códigos o parámetros,
   revisar tipos, validación de snapshots, compactación y lectores existentes.
   No tocar migración sin documentar alcance y necesidad.
4. Convertir estos casos en pruebas de aceptación de los motivos corregidos;
   añadir límites exactos, duración que cruza una franja y horario del local
   que retrasa la visita. Preservar los planes antiguos y la categoría elegida.

El script actual caracteriza el defecto; sus aserciones sobre etiquetas
actuales deberán cambiar con la corrección. No incorporarlo como criterio
permanente que obligue a mantener el defecto.


## Implementación posterior al diagnóstico

Corrección local implementada: `explainMealConstraint` reutiliza el selector de
franjas y añade un parámetro opcional `mealConstraint` a la explicación. No
cambia selección, duración, ventanas ni códigos de razón. El componente de
resultado usa ese parámetro para dos textos nuevos ES/EN; snapshots anteriores
sin él conservan la etiqueta anterior. Migración y codec permanecen intactos.

Validación ejecutada en esta entrega: 82/82 pruebas, build correcto, lint con
el baseline exacto de 11 errores y 5 warnings, bundle 262.84 kB gzip (+0.41
frente al último informe de 262.43). Lockfile sin cambios. Las cuatro pruebas
nuevas cubren escenarios del motor, límites de horario y duración y persistencia
de parámetros conservando las ocho paradas V1. No se certificó WhatsApp ni X8b.

P0-1 queda IMPLEMENTADO LOCAL, pendiente de revisión y comprobación visual.
El script diagnóstico conserva las aserciones del comportamiento anterior de
los códigos, que siguen vigentes; la suite nueva comprueba el detalle corregido.
No se integra a main ni se activa Supabase como parte de esta corrección.
