# Mapa y Cerca de ti — 25/09/2026

Candidato sobre `d5a87b1`, incluye la puerta P0 pendiente de revisión.
No integrar a main sin revisar ambos cambios.

- `/mapa`: exploración geográfica del catálogo, búsqueda y filtros existentes.
- `/mapa?nearby=all`: pantalla propia; origen elegido por GPS o punto de regreso,
  radio de 1/3/5 km, orden por distancia real en línea recta (no tiempo de ruta).
- Se presentan hasta tres opciones por grupo; el resto es expandible.
- Candidatos inmediatos vienen del motor compartido, con clima desconocido durante
  carga/fallo. Hora recalculada cada minuto. El inicio pasa por la puerta P0.
- El contenido restante es secundario, informativo y abre detalles. No declara
  un lugar abierto cuando falta información. Sin origen no inventa cercanía.
- GPS se solicita al tocar Usar mi ubicación; no crea solicitudes de clima nuevas.
- `/mapa?nearby=food`, huariques, retorno, recuerdos y filtros conservan su ruta.

## Mapas

Las tres capas CARTO se sustituyen por `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
Atribución enlazada visible, también en MemoryMapCanvas; zoom nativo máximo 19.
Sin precarga ni descarga offline, con caché estándar del navegador.
Política consultada: https://operations.osmfoundation.org/policies/tiles/
Servicio sin SLA: para lanzamiento con escala debe elegirse un proveedor con
capacidad contractual. No se crean cuentas ni se contratan servicios en este cambio.
La visualización efectiva de calles y atribución en el recuerdo queda pendiente
para el preview real; build no acredita disponibilidad del servicio cartográfico.

## Validación

98/98 pruebas; build correcto; lint baseline 11 errores / 5 warnings.
JS principal: 267.85 kB gzip (+2.80 frente a main 515cd1b).
Dos pruebas nuevas comprueban radios, orden, coordenadas inválidas y cambio de origen.
Sin dependencias ni modificaciones de lockfile.

QA X8b: comparar ambas rutas; denegar GPS y usar punto de regreso; permitir GPS;
cambiar radio; revisar hora/clima; abrir detalles e iniciar misión; calles visibles
al explorar y durante misión; MemoryCard mantiene mapa y atribución al exportar.
Fotografías faltantes siguen identificadas, no se sustituyen por fotos de otro local.
