# Checklist de regresión de I.GUIDE

**Producción actual:** `main @ b88540a`  
**Última actualización:** 3 de septiembre de 2026  
**Punto de recuperación anterior:** `dc28ede`

## Para qué existe este archivo

Esta lista es la memoria del producto. Ningún preview se aprueba sin probar el
bloque A; si el cambio toca un módulo concreto, se prueba también su bloque.
Cada resultado se marca como `PASÓ`, `FALLÓ` o `NO APLICA`.

## A. Obligatorio en todo preview

- [ ] A1. La app abre en incógnito sin errores ni pantalla en blanco.
- [ ] A2. Home carga con el clima actual visible.
- [ ] A3. Hospes propone una misión con contexto de clima y hora.
- [ ] A4. Cambiar ES ↔ EN no deja pantallas mezcladas.
- [ ] A5. Los planes guardados previamente siguen abriendo.
- [ ] A6. El `FIXTURE-V1-X8B` abre con sus ocho paradas en incógnito.
- [ ] A7. Guardar un plan, recargar y volver a abrirlo funciona.
- [ ] A8. «Me gusta» y «Recomendar» quedan activos juntos tras recargar.
- [ ] A9. La certificación de llegada por GPS a 20 m funciona.
- [ ] A10. Se genera y se ve la MemoryCard.
- [ ] A11. No hay puntuaciones opacas como `83/100` o `score`.
- [ ] A12. Una ruta inexistente muestra la página 404.

> A5 y A6 protegen datos y enlaces existentes. Si fallan, no existe GO
> condicionado: el preview es NO GO.

## B. Clima y franjas

- [ ] B1. Tocar el clima abre el diálogo semanal.
- [ ] B2. Se ven siete días por defecto y el mes completo es opcional.
- [ ] B3. Cada día muestra mañana, tarde y noche con símbolo y temperatura.
- [ ] B4. Martes/tarde abre ese martes de 15:00 a 18:00.
- [ ] B5. Mañana prepara 09:00–12:00.
- [ ] B6. Noche prepara 19:00–21:00.
- [ ] B7. Con lluvia, Hospes prioriza interiores y explica la razón.
- [ ] B8. El riesgo de montaña siempre muestra su motivo.
- [ ] B9. Sin pronóstico hay un mensaje conservador, nunca una franja verde.
- [ ] B10. El diálogo cierra con Escape y con el botón.

## C. Itinerario

- [ ] C1. Se respetan las horas de inicio y término.
- [ ] C2. Se pueden elegir varios intereses.
- [ ] C3. No hay cadenas de restaurantes; las comidas respetan su horario.
- [ ] C4. Los tiempos entre paradas varían según la distancia.
- [ ] C5. El tiempo disponible es un límite, no una orden para rellenar el día.
- [ ] C6. Ningún exterior sensible termina después del atardecer.
- [ ] C7. Las exclusiones muestran un motivo legible.
- [ ] C8. Compartir genera un enlace que abre en otro navegador.
- [ ] C9. Los planes v1 y v2 conviven sin perder información.

## D. Misión y MemoryCard

- [ ] D1. Iniciar una misión desde Hospes funciona.
- [ ] D2. El recorrido usa GPS real y su línea de tiempo persiste.
- [ ] D3. La cámara abre al primer toque.
- [ ] D4. La foto vertical es correcta y la selfie no queda espejada.
- [ ] D5. Compartir y volver no produce una pantalla negra.
- [ ] D6. Si Android suspende la pestaña, se recupera sin saltos imposibles.
- [ ] D7. La MemoryCard muestra mapa, ruta, foto, categoría y marca.

## E. Seguridad de recomendación R1

- [ ] E1. Con lluvia no se proponen exteriores sensibles.
- [ ] E2. De noche solo aparecen experiencias compatibles.
- [ ] E3. Sin candidatos aparece un estado seguro con explicación.
- [ ] E4. Hospes usa hitos urbanos como referencia, no restaurantes.

## F. Lo que nunca debe aparecer

- [ ] F1. Cero AR world-locked basado solo en GPS y brújula.
- [ ] F2. Sin «Faro de misión» ni botón para recentrar la escena.
- [ ] F3. Cero telemetría R5/Supabase sin consentimiento y política.
- [ ] F4. Publicidad y recomendación editorial diferenciadas.
- [ ] F5. Ningún dato personal identificable sale del dispositivo.

## G. Verificación técnica

```bash
npm run build
npm run lint
npm run test:itinerary
git diff --stat main..HEAD -- package-lock.json
```

- [ ] G1. Build verde.
- [ ] G2. Lint en el baseline: 11 errores y 5 warnings, ninguno nuevo.
- [ ] G3. Todos los tests están verdes.
- [ ] G4. `package-lock.json` está intacto.
- [ ] G5. El bundle aumenta menos de 15 kB gzip.
- [ ] G6. AR, telemetría, Supabase, `mediaStorage`, `trackingEngine` y el motor
      de migración permanecen intactos salvo autorización expresa.
- [ ] G7. La rama nace de `main`, permite fast-forward y no tiene ancestría AR.

## Fixture V1 X8b

El snapshot real vive en `tests/fixtures/itinerary-v1-x8b.mjs`. Nunca se
modifica. Debe migrar `priority: "gastronomy"` a
`priorities: ["gastronomy"]` y conservar fecha, clima y ocho paradas.

## Pendientes conocidos

- El enlace del itinerario funciona, pero es demasiado largo.
- `reaction` y `reactions` todavía conviven en `UserFavorite`.
- El baseline contiene 11 errores y 5 warnings de lint heredados.
- El bundle necesita división de código.
- Los Guardianes aún no están integrados.
- Huariques, historias locales y el diseño claro tipo Instagram están pendientes.
- La telemetría sigue desconectada hasta contar con consentimiento y política.

## Historial de producción

| Versión | Qué entró |
| --- | --- |
| `58772c2` | Categoría en MemoryCard. |
| `c3aa335` | Clima, itinerario, planes, aliados, listings y seguridad R1. |
| `2165683` | Clima semanal y reacciones independientes. |
| `dc28ede` | Ventanas, distancias, atardecer, snapshots y guardado verificado. |
| `b88540a` | Cada franja del clima abre el itinerario preparado. |

## Retirado

El AR world-locked por GPS y brújula queda fuera. Se conservan la certificación
GPS, la captura para MemoryCard y los modelos 3D. Los Guardianes deberán
coleccionarse sin depender del AR; un visor con marcador podrá ser opcional.

## Resultado para copiar

```text
Acceso público:
Clima → itinerario:
Itinerario inteligente:
Guardado y planes antiguos:
Misión y GPS:
MemoryCard:
Me gusta + Recomendar:
ES/EN sin mezclas:
Problemas encontrados:
Dispositivo y navegador:
VEREDICTO: GO / NO GO
```
