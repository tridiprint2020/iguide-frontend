# Sprint de integración — primer bloque técnico

## Evidencia de partida

- Repositorio clonado: https://github.com/tridiprint2020/iguide-frontend.git
- `git rev-parse origin/main`: `5abd94f357afdf41d3bf37f9fb2ae3695e3dae3f`.
- Candidato remoto: `9619a8bf1f9ef3fea40c545717a9d053b398fa3f`.
- Rama de corrección local: `fix/sprint-integration-validation-v1`.
- Instalación desde lockfile mediante `npm ci --no-audit --no-fund`.
- No se encontraron archivos AGENTS.md en el árbol del repositorio.

## Correcciones verificadas

1. `closedOnHolidays` antes solo alimentaba el texto público. Ahora se aplica
   en el motor compartido a estado de apertura, recomendación e itinerario.
2. La hora exacta de cierre deja de considerarse abierta.
3. La política conservadora de cierre por feriado cubre el día civil entero:
   el turno anterior termina como máximo a medianoche y un turno que no abrió
   en feriado no reaparece en la madrugada siguiente. Confirmar excepciones
   particulares con el local antes de modelar otra política.
4. Se cubre la preservación de los motivos `schedule-unverified` y
   `schedule-variable` al serializar y validar el fixture V1 ya migrado.
   No se modificó el fixture ni el motor de migración en este bloque.

Calendario del piloto Perú: reglas nacionales vigentes, fuente
https://www.gob.pe/feriados consultada el 15/09/2026. Catorce fechas fijas y
Jueves/Viernes Santo calculados con computus gregoriano. No se incluyen días
compensables ni cierres regionales. Revisar el calendario cada año y separar
por país antes de ampliar fuera de Perú; no usar como calendario histórico.

## Pruebas ejecutadas

| Ejecución | Resultado |
| --- | --- |
| Suite original sin cambios | 64/64 |
| Nuevas regresiones antes de corregir | 65/67; fallan feriados y minuto de cierre |
| Suite final con cobertura adicional | 69/69, ninguna omitida |
| `npm run build` (incluye TypeScript) | PASÓ |
| `npm run lint` | FALLÓ: 11 errores y 5 advertencias heredados, mismo resultado inicial |
| JavaScript gzip | 261.17 → 261.58 kB; +0.41 kB |
| Lockfile | Intacto respecto al candidato remoto |

La suite nueva verifica los 16 feriados de 2026 recorriendo el año completo,
Polares cerrado en feriados fijos y Semana Santa, apertura en día ordinario,
La Serranita abierta en feriado, continuidad nocturna y límite de cierre.

## Estado del sprint

| Bloque | Estado |
| --- | --- |
| Identidad y candidato | PASÓ |
| Pruebas automatizadas y build | PASÓ para este bloque; no equivale a auditoría completa |
| Migración: motivos nuevos + fixture V1 | PASÓ en pruebas automatizadas |
| Navegador, ES/EN visual, fichas y reacciones | PENDIENTE |
| HONOR X8b: GPS, cámara, compartir, suspensión | PENDIENTE; necesita dispositivo real |
| Puerta de Valle Azul | PENDIENTE de confirmación física |
| Enlaces cortos | BLOQUEADO: `git ls-remote` no devuelve la rama y `ef490ce` no existe en el clon |
| Auditoría de Claude y GO final | PENDIENTE |
| Publicación de correcciones y main | NO REALIZADA |

No se hicieron push, merge, despliegues, cambios de Supabase ni de AR.
Las correcciones locales no están disponibles todavía en el preview remoto.
Siguiente bloque: regresión en navegador y resolución de los defectos que
aparezcan; después validación X8b y auditoría del SHA final. Main requiere la
autorización final acordada, posterior a las pruebas.
