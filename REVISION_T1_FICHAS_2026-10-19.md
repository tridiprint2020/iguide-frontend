# Descripciones de Bicho y Museo Salesiano para T1

Fecha: 19/10/2026. Rama: `fix/t1-place-descriptions-v1`.
Base exacta: `d089d8534398aa249787cbc974716b9ee36c7381`.

## Alcance completo

Incremento de seis archivos: `src/data/experiences/cafes/cafes.ts`,
`src/data/experiences/museums/museums.ts`, `src/i18n/en.ts`,
`src/types/experience/experience.ts`,
`tests/itinerary-engine.integration.test.mjs` y este registro.
Acumulado desde main `4d1c6c80cf33fe9e6447d12fd6ddbdea04050244`:
quince archivos y cuatro commits, incluyendo T0, el acta/SPEC inicial y la
corrección de intensidad. No incluye la revisión documental independiente
`docs/t2-audit-adjustments-v1 @ 2e5e4e1`.

## Contenido y procedencia

Bicho: el Fundador confirmó hoy que vende café de especialidad. Se redactó
una descripción breve y su versión inglesa a partir de ese dato. La comparación
que hizo con una cadena sirve de contexto, no se publica como afiliación ni
se inventan carta, origen del grano, métodos de preparación o verificaciones
de puerta/horario. La fecha editorial no certifica esos otros datos.

Salesiano: descripción ES/EN sobre las colecciones y dirección documentadas.
Fuentes consultadas el 19/10/2026:

- Inventario Nacional de Recursos Turísticos, ficha 1179, DIRCETUR Junín,
  actualización indicada 31/03/2025:
  https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=1179
- Ministerio de Cultura, Guía de Museos e Instituciones Museales del Perú
  2023, entrada del museo en página impresa 208:
  https://repositorio.cultura.gob.pe/bitstream/handle/CULTURA/1475/Guia%20museos%20e%20instituciones%20museales%202023%20web.pdf?isAllowed=y&sequence=1

Las fuentes difieren en ciertos datos históricos, cierre de tarde y tarifa
infantil. No se publican un año de fundación, horario ni precio como vigentes
por haberlos encontrado en internet. La reseña pide confirmar condiciones
de visita y fotografía; no promete permiso para fotografiar las salas.

Se retira el legado 08:00–21:00 del Salesiano, que no corresponde a esas
fuentes: `openingHours` vacío activa el estado sin verificar del motor único,
manteniendo la ficha informativa. No se crean reglas paralelas. También se
retira S/0 como tarifa; `MuseumExperience.admissionFee` pasa a opcional para
representar desconocido sin confundirlo con gratuito. No cambia el importe
de otros lugares. Fecha de actualización editorial: hoy, sin atribuir una
confirmación operativa presencial.

No se modifican coordenadas, radio de llegada, GPS, cámara, snapshots,
la puerta de misión, motores de horario/seguridad, AR, Supabase ni lockfile.
Las fotos reales siguen pendientes; no se incorpora una imagen de otro local.

## Verificación

- **102/102 pruebas aprobadas**, sin omitidas ni canceladas; una nueva prueba
  comprueba con el catálogo real que Salesiano sin horario queda fuera de la
  recomendación de Home y del itinerario, con motivo `schedule-unverified`,
  y que su tarifa desconocida no está representada por cero.
- Compilación TypeScript/Vite aprobada.
- Lint completo: baseline **11 errores y 5 advertencias**; no se declara limpio.
  Lint dirigido a los cuatro archivos de código de esta entrega: sin hallazgos.
- **Ocho renders**: dos lugares, ES/EN, catálogo Explorer y ficha Expedition.
  Componentes reales con mapas/Journey aislados; verifica traducción y contenido,
  no acredita navegador, GPS ni X8b.
- `git diff --check` aprobado.
- Entrada principal Vite: 84,48 kB gzip. Total de JavaScript emitido, gzip9
  determinista: base 285 803 bytes, candidato 286 407, diferencia +604 bytes,
  29 archivos en ambos. No incluye CSS, fotos ni transferencia de red.

## Prueba de campo y acceso

El candidato reúne las correcciones de Hospes, intensidad y estas fichas.
Comprobar ambas descripciones en ES/EN, que el museo no muestre el horario
anterior y que iniciar manualmente informe que el horario no está verificado.
No usar el museo como caso de local con apertura confirmada ni tomar fotos
de sus salas sin autorización. Las pruebas X01–X10 de T1 siguen pendientes.

El preview de la base d089d85 se comprobó sin sesión y redirige a login Vercel.
Verificar el acceso al nuevo despliegue antes de atribuir un bloqueo a la app.
Una prueba de destinatario exige acceso sin sesión del propietario. Main y
la producción no se modifican por publicar esta rama.
