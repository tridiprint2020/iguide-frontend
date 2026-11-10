# Activar portadas de locales

Código preparado en `feat/merchant-cover-supabase-v1`, base `main @ 0eeaf84`.
Estado: CANDIDATO PARA REVISIÓN; proyecto conectado y publicación de rama autorizada.
Pendientes migración, acceso de editor, revisión por SHA y QA real.

## Qué permite esta entrega

En `/admin/locales`, un editor autorizado selecciona un negocio del catálogo,
toma una foto o la elige de su galería, comprueba su vista previa y la publica.
La portada se usa en la ficha, Explorar, las tarjetas de favoritos, las tarjetas
del mapa, Cerca de ti y las tarjetas de destino de Inicio. El editor abre el
panel por URL directa. La configuración de Vercel declara `X-Robots-Tag: noindex`
para esa ruta. La edición requiere una cuenta autorizada.

No añade locales nuevos: las fichas siguen siendo editoriales y el panel cambia
solo su portada. No cambia sus datos operativos, categoría, valoración,
recomendaciones, patrocinio, planes ni fotos personales. La interfaz de edición
está en español; los visitantes conservan la aplicación ES/EN.

## Conexión y aplicación

1. Seleccionar el proyecto existente de I.GUIDE mediante la conexión autorizada
   a Supabase. Verificar estado activo, entorno, región, Auth, cuotas, presupuesto
   y las políticas/grants existentes. No asumir que sigue pausado ni restaurarlo
   o crear otro proyecto por iniciativa propia.
2. Revisar `supabase/migrations/202611020001_place_covers.sql`. Usa nombres nuevos
   y un bucket propio. Si ya existen, detenerse y conciliar el esquema, sin
   sobreescribir ni borrar nada. Inspeccionar también roles adicionales y
   políticas del proyecto que no figuran en las pruebas locales.
3. Aplicar la migración revisada en el entorno acordado. El bucket es público y
   permite solamente JPEG hasta 2 MiB. Los originales y sus EXIF no se suben;
   se publica la imagen reconstruida por canvas tras confirmación de derechos.
4. Usar una cuenta de editor confirmada de Supabase Auth. No registrar usuarios
   ni enviar invitaciones sin instrucción expresa. Con su UUID verificado:

   ```sql
   insert into public.iguide_photo_editors (user_id)
   values ('UUID_VERIFICADO_DEL_EDITOR');
   ```

   La lista es administrada solo desde un contexto privilegiado del operador;
   ningún usuario puede concederse acceso desde la aplicación.
5. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` a partir de
   `.env.example`. Admitida la clave publishable o una anon heredada. Nunca usar
   `sb_secret` o `service_role` en VITE. No compartir contraseñas por el chat.
6. Hacer build/preview del candidato, verificar los casos siguientes, recibir
   revisión por SHA y el GO del Fundador antes de push/merge/producción.

## Prueba real imprescindible

- Anónimo: lee portadas, no puede subir/escribir/listar objetos del bucket.
- Autenticado sin permiso: ni carga ni modifica portadas y no puede añadirse a
  `iguide_photo_editors`. El editor solo lee su propia autorización.
- Editor: publicar y sustituir una portada, abrir la ficha desde otro navegador
  sin sesión y comprobar imagen y texto alternativo. Confirmar lectura pública
  de metadatos seleccionados y ausencia de `published_by`.
- Probar la cámara y galería del teléfono, orientación, compresión y legibilidad.
- Archivo incompatible, carga interrumpida, caducidad y pérdida de respuesta de
  la publicación: ningún mensaje de éxito sin confirmación del servidor.
- Retirada concurrente: una solicitud con una ruta antigua no borra la portada
  más reciente. Storage no permite sobrescribir objetos ni borrar el vigente.
- Retirada normal: desaparece de la guía y el borrado de archivo se confirma;
  distinguir fallo de borrado del archivo de la retirada de la ficha.
- Sin configuración o sin red: catálogo, misiones, favoritos y MemoryCards
  siguen funcionando con sus imágenes incorporadas.

## Lectura de portadas en producción

1. En el entorno **Production** de Vercel, configurar los datos públicos aprobados
   del responsable en `VITE_PRIVACY_CONTROLLER`, `VITE_PRIVACY_ADDRESS` y
   `VITE_PRIVACY_EMAIL`. Desplegar y comprobar el aviso en `/privacidad`.
2. En el mismo entorno, configurar `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY` del proyecto que contiene las portadas
   aprobadas. Mantener `VITE_PLACE_COVER_EDITOR_ENABLED` en `false`.
3. Volver a desplegar. Abrir las fichas de Amazon Centric Hotel y Hotel Wanka
   Palace en una ventana privada y comprobar sus portadas y textos alternativos.
   La edición se gestiona desde el panel del piloto.

## Sesiones y mantenimiento

El acceso dura como máximo el TTL de Auth, limitado a 24 h en el cliente. No se
guardan JWT, refresh tokens ni contraseñas en almacenamiento del navegador;
una recarga requiere entrar otra vez. Las portadas públicas se refrescan al
abrir la aplicación, volver a la pestaña y cada cinco minutos mientras está
visible. El editor puede actualizar manualmente.

Cada reemplazo conserva el archivo anterior para no romper una publicación
concurrente o confirmada después de un timeout. Revisar periódicamente los
archivos sin referencia y la cuota desde Storage. Consulta para inventariarlos:

```sql
select o.name, o.created_at, o.metadata ->> 'size' as bytes
from storage.objects o
left join public.iguide_place_covers c on c.object_path = o.name
where o.bucket_id = 'iguide-place-covers'
  and c.object_path is null
  and o.created_at < now() - interval '24 hours';
```

Eliminar archivos huérfanos mediante la API o el panel de Storage; nunca con un
DELETE SQL sobre `storage.objects`. Conservar las referencias y archivos aún
publicados. Una retirada no revoca copias o cachés que ya tenga un tercero;
publicar solo imágenes autorizadas para acceso público.

## Verificación reproducible

`npm run test:itinerary` incluye los nuevos casos HTTP de fotos. El simulador de
HTTP comprueba el contrato del cliente, no sustituye Auth ni Storage reales.

La migración también se comprueba en PostgreSQL/WASM con fixtures locales de
`auth` y `storage`, incluyendo una política heredada deliberadamente demasiado
amplia. Instalar `@electric-sql/pglite` en un directorio temporal separado del
repo y ejecutar `scripts/check-place-cover-policies.mjs` con
`IGUIDE_PGLITE_MODULE` apuntando a su `dist/index.js`. No modifica el lockfile.
Estas comprobaciones no certifican el gateway ni la configuración de Supabase.

Fuentes técnicas oficiales consultadas:
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.github.io/auth/
- https://supabase.com/docs/reference/self-hosting-storage/upload-a-new-object

## Recuperación

Antes de activar, conservar la configuración anterior del despliegue. Desactivar
las dos variables públicas y desplegar el código aprobado sin la conexión deja
el catálogo incorporado funcionando; también puede recuperarse el SHA previo.
Esto no elimina datos ni archivos de Supabase. El borrado de estos se trata como
operación separada y explícita, conservando antes las publicaciones necesarias.
