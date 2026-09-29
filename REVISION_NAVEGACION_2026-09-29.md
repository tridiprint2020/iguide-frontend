# Navegación: candidato para revisión

Base remota: 7a1b0051143693ac92fb879e327e4543173984d3.
Main conocido: 515cd1b646209ce6765172d3cf910d1102b96bb8. Esta entrega no integra main.

## Cambio de esta entrega
- Explorer: catálogo por categorías, búsqueda, huariques y tarjetas; sin MapView. Ver en mapa transfiere búsqueda/categorías.
- Encabezado compartido en Explorer, Mapa, Cerca de ti, Itinerario y ficha Expedition.
- Ficha: Volver usa origen interno permitido; enlaces directos vuelven a Explorer. Inicio usa resetToHome existente.
- Catálogo, mapa, Cerca de ti e itinerario envían origen a ficha. Filtros del mapa y radio de Cerca de ti quedan en URL.
- Mapa conserva radio 10 km; Cerca de ti conserva GPS automático y minimapa 1 km.
- Textos nuevos ES/EN. No se modifica sidebar, Home, puerta de misión, snapshots, AR ni Supabase.

## Alcance acumulado de la rama
Incluye d5a87b1 (puerta central de misión), 65d46a7 (Cerca de ti), 70ce533 (mapas/CARTO), 84c0640 (GPS y carga diferida), 7a1b005 (mapa 10 km y minimapa 1 km), más esta entrega. No confundir esta revisión con una aprobación de todo el candidato en campo.

## Verificación ejecutada
101/101 pruebas; build correcto; lint 11 errores y 5 advertencias (baseline). Tres pruebas nuevas: origen con filtros, rechazo de origen externo/directo, categorías permitidas. No se ejecutó navegador ni prueba física X8b en esta entrega.

## QA pendiente del preview
Explora: buscar, filtrar, abrir ficha, Volver conserva filtros. Ver en mapa conserva selección.
Mapa y Cerca de ti: ficha/Volver conserva filtros o radio; GPS vuelve a solicitar posición al montar.
Ficha directa: Volver a Explorer; Inicio permite retomar misión persistida.
Comprobar legibilidad, encabezados y carga diferida en X8b. Mantener QA de seguridad y recorrido de misión/MemoryCard pendiente del candidato anterior.
