# Revisión de ajustes de T2

Fecha: 19/10/2026. Rama: `docs/t2-audit-adjustments-v1`.

Base exacta auditada: `7eede71215d3f04f009ba3384a699b312c29ceef`.
`main` consultado antes de preparar la entrega:
`4d1c6c80cf33fe9e6447d12fd6ddbdea04050244`.

## Alcance completo

Esta entrega cambia solamente `SPEC_T2_DATOS_BETA_V1.md` y añade este registro.
No cambia el acta de T1 ni código, pruebas, dependencias, configuración o
lockfile. Incremento: dos archivos y un commit. Acumulado desde el main
indicado: ocho archivos y tres commits, incluyendo T0 y los documentos de T1/T2.
Publicar esta rama no integra ninguno de ellos en main.

La corrección de intensidad ES/EN vive aparte, en
`fix/t1-difficulty-labels-v1 @ d089d8534398aa249787cbc974716b9ee36c7381`.
No está incorporada en esta rama documental. Evitar atribuir aquí sus renders,
pruebas o cambios de componentes. Tampoco hay altas de gastronomía en el catálogo.

## Respuesta a los cinco ajustes de la auditoría

| Ajuste | Cambio documental |
| --- | --- |
| 1. Caducidad vinculada al viaje | Fórmula con mínimo de treinta días desde creación y siete días tras el final del día del plan en Lima; máximo de noventa días. Fecha calculada por servidor. Si no cabe ese margen en noventa días, no crear un enlace engañoso y mantener el plan local. DAT10 incluye viaje a seis semanas, fronteras y zona horaria. |
| 2. Tokens en Analytics y Referer | DAT13 nuevo. Política de referencia explícita desde el HTML inicial, incluyendo la entrada por SPA. Analytics propuesto apagado hasta T2b; si se habilita en rutas generales, exclusión central de la sesión que abre un plan. La prueba inspeccionará transporte activo, navegación y referencias al mismo origen y a otro destino. |
| 3. Enlace corto con entropía suficiente | Mantiene lectura de al menos 128 bits y gestión independiente de al menos 256; se declara la codificación de 16 bytes en 22 caracteres base64url. Se descarta el código de seis caracteres para este contrato. |
| 4. Reposición de exclusiones | DAT05 exige reponer `exclusions: []` en el adaptador de lectura remota antes de validar/migrar e hidratar; el servidor no publica exclusiones editoriales. No se modifican los lectores antiguos. |
| 5. Crecimiento total y purga | Propone un tope conjunto de 10 000 filas persistentes, más 2 000 contadores de abuso y límites al historial de mantenimiento. Admisión transaccional, rechazo honesto al llenarse y job horario `beta_purge_expired_v1` mediante Supabase Cron/pg_cron. DAT14 nuevo cubre concurrencia, duplicados, purga y fallas. |

Los números de cuota, plazos y operación quedan explícitamente como decisiones
de producto a ratificar en D02; no se presentan como límites de Supabase ni
como obligaciones legales. Los ajustes están incorporados a la propuesta,
no desplegados.

## Evidencia revisada

- `src/main.tsx` monta `<Analytics />` sin `beforeSend`; el lockfile fija la
  versión instalada 2.0.1. Su implementación local permite pasar `beforeSend`
  a la cola antes de inyectar el script. No se capturó un envío real de un token:
  la ruta de lectura remota aún no existe.
- Vercel documenta que Analytics puede registrar URL/referrer y transiciones,
  y que una ruta con identificadores necesita filtrado propio. Consultadas las
  páginas de privacidad y redacción citadas en la SPEC.
- Contrastadas las secciones pertinentes de las tres fuentes Supabase que
  cita el documento original: RLS y claves con bypass, secretos de funciones
  y backups. Añadida la documentación oficial de Cron y la política W3C.
- `src/types/itinerary.ts` exige `exclusions`; la proyección portable local
  ya usa un array vacío. El nuevo contrato remoto mantiene esa adaptación
  explícita y la lista de parámetros permitidos por `reasonCode`.
- Revisión del diff, comprobación de formato y comparación con la base para
  acreditar que no cambian archivos de ejecución, pruebas ni configuración.

No se volvió a ejecutar la suite al preparar esta entrega documental. No hay
un nuevo resultado de tests o build que reportar: el código es idéntico al de
la base auditada por Claude en 101/101, con su lint baseline de 11/5.
DAT01–14 son criterios por implementar y ejecutar; ninguno se marca aprobado.

## Estado para continuar

T1 permanece abierto: X01–X10, destinatario ajeno y los demás pendientes del
acta requieren evidencia propia. Los textos de Bicho y Museo Salesiano siguen
pendientes de aporte y revisión editorial. El ajuste de intensidad está
publicado por separado, pendiente de revisión visual y de integración.

Supabase no está activado. T3 requiere el cierre de T1, las decisiones de T2,
los requisitos aplicables de T2b y autorización explícita de ese alcance. Esta
revisión no acredita que Analytics esté desactivado en producción ni que
exista ya una cabecera nueva, una purga instalada o un enlace remoto.
