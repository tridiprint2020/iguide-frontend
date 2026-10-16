# Corrección de etiquetas de intensidad para T1

Fecha: 16 de octubre de 2026.

Rama: `fix/t1-difficulty-labels-v1`.

Base exacta: `7eede71215d3f04f009ba3384a699b312c29ceef` (`docs/t1-qa-t2-data-contract-v1`).

## Problema y resultado

La revisión de escritorio de T1 encontró `Intensidad: high` en la ficha de Huaytapallana en español. La ficha ahora presenta los nombres del diccionario de dificultad existente, traducidos según el idioma. La tarjeta de experiencia que usa Favoritos aplica la misma traducción.

Los valores internos siguen siendo `easy`, `medium` y `high`. No cambian la dificultad de ninguna experiencia, los umbrales ni las reglas para recomendar o iniciar una misión.

## Alcance completo de esta entrega

| Archivo | Cambio |
| --- | --- |
| `src/pages/Expedition.tsx` | Usa `difficultyLabels` y `tx` para la intensidad de las expediciones. |
| `src/components/ExperienceCard.tsx` | Traduce las etiquetas de intensidad ya existentes. |
| `src/i18n/en.ts` | Añade `Fácil → Easy`, `Moderada → Moderate` y `Alta → High`. |
| `REVISION_T1_INTENSIDAD_2026-10-16.md` | Declara el alcance, la validación y lo que queda pendiente. |

Incremento: cuatro archivos y un commit sobre la base documental. El código cambia nueve líneas y elimina seis. Acumulado desde `main @ 4d1c6c80cf33fe9e6447d12fd6ddbdea04050244`: diez archivos y tres commits, que incluyen T0 y los dos documentos de T1 y T2. Las ramas originales conservan sus puntas.

No cambia el catálogo, el lockfile, GPS, snapshots, seguridad, `JourneyContext`, AR ni Supabase. No se modifica el acta de T1 ni la especificación de T2 que están pendientes de revisión. Esta entrega deja corregido en un candidato el defecto menor observado en esa acta; no declara cerrado T1.

## Verificación realizada el 16 de octubre

- Suite: **101 de 101 pruebas aprobadas**, sin omitidas ni canceladas.
- Compilación de TypeScript y Vite: aprobada.
- Lint completo: **11 errores y 5 advertencias**, el baseline anterior. No se declara limpio.
- Lint de los tres archivos de código: conserva los mismos tres errores previos de `react-hooks/purity` en `Expedition.tsx`; comparados por archivo, regla, severidad y mensaje contra la base. Las expresiones señaladas no cambian con esta entrega.
- Render de los componentes reales en ES/EN: **18 comprobaciones aprobadas**. Dieciséis corresponden a las cuatro expediciones reales del catálogo en ambos idiomas y en ambos componentes. Dos comprueban `medium` en una tarjeta de prueba, porque el catálogo actual no contiene una expedición de ese nivel.
- La comprobación de render usa SSR y aísla las dependencias de mapas y Journey; verifica el texto de los componentes, no el comportamiento del navegador ni del X8b.
- `git diff --check`: aprobado.

Medición comparada en el mismo entorno, gzip nivel 9 y solo los archivos JavaScript emitidos por cada compilación:

| Medida | Base en bytes | Candidato en bytes | Diferencia |
| --- | ---: | ---: | ---: |
| Entrada principal | 83 325 | 83 324 | −1 |
| Entrada y precargas del HTML | 159 638 | 159 665 | +27 |
| Todo el JavaScript, 29 archivos | 285 743 | 285 803 | +60 |

La medición no incluye CSS, imágenes ni transferencia de red. Los 84,48 kB gzip que informa Vite corresponden solamente a la entrada principal.

## Comprobación visual pendiente

En el candidato: revisar Huaytapallana en ES con `Alta` y en EN con `High`; revisar una expedición fácil con `Fácil` y `Easy`; comprobar las tarjetas de Favoritos en ambos idiomas. Esto no reemplaza las pruebas de campo de T1, que siguen pendientes.

`main` no se integra con esta publicación. Supabase continúa en espera del cierre de QA y del contrato de datos. La ficha comercial C0 es una herramienta de visita separada; no añade funciones al producto. Fotos, vista sencilla, Guardianes y Qhapaq Ñan requieren entregas con alcance propio. El AR anclado por GPS y brújula permanece retirado.
