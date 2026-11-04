# Portadas comerciales — candidato local

Rama: `feat/merchant-cover-supabase-v1`. Base: `main @ 0eeaf84`.
Estado: CANDIDATO PARA REVISIÓN; publicación de rama autorizada, activación real pendiente.

## Comportamiento

Panel de editor en `/admin/locales`, enlazado al final de Perfil. Selección y
búsqueda de locales existentes, cámara/galería, compresión de imágenes, vista
previa, confirmación de derechos, publicación y retirada. Los visitantes ven
la portada en ficha y tarjetas; sin conexión se conserva el catálogo estático.

Integración REST de Supabase Auth, Storage y PostgREST con variables públicas.
Sin dependencias nuevas; package.json y package-lock.json intactos. Sesión
en memoria. Nunca se usa una clave privilegiada en cliente. Migración separada
con lista de editores, metadatos publicados y bucket JPEG de hasta 2 MiB.

Solo cambian las imágenes de presentación. No se editan motores de seguridad,
inicio de misiones, seguimiento, clima, datos del catálogo ni almacenamiento de
fotos personales. Subir una foto no altera la condición comercial o editorial
de un local, su valoración ni su posición en recomendaciones.

## Comprobaciones completadas

- `npm run test:itinerary`: **115/115**, sin omitidas. 102 previas y 13 nuevas.
- Pruebas HTTP: editor no habilitado, caducidad, consentimiento, configuración
  inválida/privilegiada, fallo de carga, publicación no confirmada, respuesta
  perdida después de persistir, retirada concurrente y borrado no confirmado.
- Migración ejecutada en PostgreSQL/WASM (PGlite) con fixtures de Auth/Storage:
  **11/11 comprobaciones**. Incluye INSERT/UPSERT reales con rol authenticated,
  clientes anónimos, usuario sin permiso, permisos por columna, helper de autorización en esquema privado, estampado del
  autor, imposibilidad de autoautorizarse, sobrescritura y borrado del archivo
  vigente, retirada condicionada y preservación de otros buckets. Se prueba
  también con una política previa deliberadamente demasiado amplia.
- `npm run build`: TypeScript y Vite correctos; entrada **85,50 kB gzip**.
- Lint global: **11 errores y 5 advertencias**, mismo baseline. Archivos nuevos
  y componentes de imagen modificados comprobados sin hallazgos nuevos.
- `git diff --check` correcto. Lockfile, dependencias, motores de misión,
  seguimiento y almacenamiento de fotografías personales intactos.

## Límites y puerta de activación

Supabase está conectado. El 03/11/2026 se recuperó el entorno original y se
confirmó que `iguide-pilot-test` está `ACTIVE_HEALTHY`, en el plan gratuito.
La inspección encontró solo `pilot_events`, ningún bucket y cero usuarios Auth.
No se aplicó esta migración ni se habilitó un editor. Christian autorizó
expresamente el 03/11/2026 publicar `feat/merchant-cover-supabase-v1` en
`tridiprint2020/iguide-frontend` para la revisión conjunta con Claude. La
identidad remota se comprobará contra el árbol local recuperado. La integración
en main y la activación productiva siguen pendientes. Sin variables el panel
declara activación pendiente y deshabilita la publicación de fotos.

Los fixtures PostgreSQL comprueban SQL y permisos, no el gateway real de
Supabase, su configuración de Auth, MIME/tamaño de Storage, cámara del teléfono
ni visibilidad entre navegadores. Verificar los casos de
`docs/ACTIVAR_FOTOS_LOCALES_V1.md` en el proyecto conectado antes de producción.

QA visual en navegador: pendiente de comprobar en el entorno recuperado.
El fallo anterior de infraestructura no equivale a una prueba visual pasada.

Los archivos de portadas reemplazadas conservan su URL hasta limpieza del
operador. La retirada distingue eliminar la referencia de la ficha de borrar
el archivo; un fallo de Storage se comunica. Todo el contenido del bucket es
público desde su subida y requiere autorización para ese uso.

**Veredicto: candidato para auditoría por SHA; activación productiva pendiente.**
