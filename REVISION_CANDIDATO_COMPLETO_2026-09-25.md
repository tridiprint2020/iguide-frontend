# Candidato completo — cierre de alcance 25/09/2026

Producción de referencia: `515cd1b`. No se ha autorizado un nuevo merge.
Cadena pendiente de integrar, en orden:
- `d5a87b1`: puerta común al iniciar misión; GO técnico de Claude recibido.
- `65d46a7`: Cerca de ti separado y primera sustitución de CARTO.
- `70ce533`: capas omitidas de MapPage/exportación; calles confirmadas en captura X8b.
- Esta entrega: GPS automático en Cerca de ti, vista geográfica de 30 km de radio
  y carga diferida por rutas en App. No contiene AR ni Supabase.

## Dos ajustes pedidos por el Fundador

Cerca de ti solicita una posición nueva al montar (maximumAge 0), sin botón
previo. Respeta permiso del navegador. Fallo permite reintentar o elegir punto
de regreso; nunca finge que ese punto es la ubicación GPS. Se ignoran callbacks
tras desmontaje. Cambiar de ruta y volver solicita una posición nueva.

Mapa usa bounds de 60 km de ancho (30 km de radio) al abrir incluso sin GPS.
Con GPS, UserLocationLayer conserva ese radio. Los mapas de misión no cambian.
El usuario puede acercar y filtrar como antes. No es un límite del catálogo.

## Rendimiento

Carga diferida de páginas y WalkingView; Home y JourneyProvider permanecen
montados. Suspense muestra Cargando/Loading mientras llega la pantalla.
Build: entrada 84.64 kB gzip; entrada + modulepreloads de index.html 160.11 kB
(medición gzip local) frente a 267.82 del monolito anterior. Todos los chunks JS
suman 290.21 kB gzip: se reduce carga inicial, no el total al visitar todo.
No se compara solo el archivo index para esconder dependencias compartidas.
El umbral incremental debe explicitar su SHA base; main ya avanzó a 515cd1b.

## Verificación y límites

98/98 pruebas, build correcto, lint baseline 11 errores / 5 advertencias.
Lockfile intacto. Sin prueba real de red/GPS desde el navegador del implementador.
Pendiente X8b: entrada automática, permiso denegado, mapa amplio; navegar todas
las rutas diferidas incluyendo enlace directo, volver, misión y MemoryCard.
Pendiente QA P0: cerro nocturno bloquea; cerrado confirma; cancelar conserva;
aceptar inicia; abierto inicia. Suite no sustituye recorrido de campo completo.
GO de Claude para d5a87b1 no se extiende automáticamente a esta nueva entrega.
