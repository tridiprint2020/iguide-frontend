# Activar portadas de locales

La activación se verifica primero en el piloto `iguide-pilot-test`.
La migración de portadas quedó registrada en ese proyecto como
`20261110022352_place_covers_v1_hardened`. En el piloto, continuar con la
configuración de Auth y el preview del paso 4 en adelante.

## Qué permite esta entrega

En `/admin/locales`, un editor autorizado selecciona un negocio del catálogo
y arrastra una foto al recuadro desde su computadora. En el teléfono puede
tomar una foto o elegirla de su galería. En ambos casos revisa la vista previa
y confirma los derechos antes de pulsar **Publicar portada**.
La portada se usa en la ficha, Explorar, las tarjetas de favoritos, las tarjetas
del mapa, Cerca de ti y las tarjetas de destino de Inicio. El editor abre el
panel por URL directa. La configuración de Vercel declara `X-Robots-Tag: noindex`
para esa ruta. La edición requiere una cuenta autorizada.

No añade locales nuevos: las fichas siguen siendo editoriales y el panel cambia
solo su portada. No cambia sus datos operativos, categoría, valoración,
recomendaciones, patrocinio, planes ni fotos personales. La interfaz de edición
está en español; los visitantes conservan la aplicación ES/EN.

## Pauta para las portadas

- Usa una foto real horizontal, preferiblemente 16:9 (1600 × 900 px). Centra la
  fachada, el ambiente o el plato principal y deja aire en los bordes para el
  recorte de las tarjetas.
- Mantén luz natural, líneas rectas y colores fieles al lugar. Evita texto,
  marcas de agua y personas identificables sin permiso.
- Si preparas el archivo antes de subirlo, apunta a un JPG de 150–350 kB.
  El panel admite un original JPG, PNG o WebP de hasta 12 MiB y lo convierte a
  JPG con un máximo de 1600 px en el lado largo y 2 MiB.

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
4. En **Authentication → Sign In / Providers**, desactivar **Allow new users to
   sign up**. El operador crea su cuenta desde **Authentication → Users**.
   Con el UUID confirmado del editor, agregar su autorización.

   ```sql
   insert into public.iguide_photo_editors (user_id)
   values ('UUID_VERIFICADO_DEL_EDITOR');
   ```

   La lista es administrada solo desde un contexto privilegiado del operador;
   ningún usuario puede concederse acceso desde la aplicación.
5. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el preview
   del piloto a partir de `.env.example`. Usar una clave publishable o una anon
   heredada. La contraseña del editor se ingresa directamente en Supabase o el
   formulario del panel.
6. Verificar los casos siguientes en el preview y registrar su SHA. Actualizar
   el aviso de privacidad público antes de conectar las variables en producción.
   Publicar e integrar el candidato requiere el GO del Fundador.

## Prueba real imprescindible

- Anónimo: lee portadas, no puede subir/escribir/listar objetos del bucket.
- Autenticado sin permiso: ni carga ni modifica portadas y no puede añadirse a
  `iguide_photo_editors`. El editor solo lee su propia autorización.
- Editor: publicar y sustituir una portada, abrir la ficha desde otro navegador
  sin sesión y comprobar imagen y texto alternativo. Confirmar lectura pública
  de metadatos seleccionados y ausencia de `published_by`.
- Arrastrar un JPG desde la computadora. Verificar que aparece en vista previa
  y la ficha cambia después de confirmar derechos y pulsar **Publicar portada**.
- Probar la cámara y galería del teléfono, orientación, compresión y legibilidad.
- Archivo incompatible, carga interrumpida, caducidad y pérdida de respuesta de
  la publicación: ningún mensaje de éxito sin confirmación del servidor.
- Reemplazo y retirada concurrentes: abrir el mismo local en dos pestañas.
  Tras publicar en una, la otra debe pedir que se actualicen las portadas en vez
  de reemplazar o retirar la nueva. Storage protege el archivo vigente.
- Retirada normal: desaparece de la guía y el borrado de archivo se confirma;
  distinguir fallo de borrado del archivo de la retirada de la ficha.
- Sin configuración o sin red: catálogo, misiones, favoritos y MemoryCards
  siguen funcionando con sus imágenes incorporadas.

## Sesiones y mantenimiento

El acceso dura como máximo el TTL de Auth, limitado a 24 h en el cliente. No se
guardan JWT, refresh tokens ni contraseñas en almacenamiento del navegador;
una recarga requiere entrar otra vez. Las portadas públicas se refrescan al
abrir la aplicación y cada quince minutos mientras está visible. Volver a la
pestaña refresca si ya pasó ese intervalo. El editor puede actualizar manualmente.

Durante el piloto, informar a quienes prueben el preview de que el navegador
consulta Supabase para cargar las portadas y sus datos públicos. Supabase recibe
los datos de conexión de esas peticiones, como la dirección IP. El correo y la
contraseña del editor se usan para entrar por Supabase Auth. Las portadas del
bucket son públicas. Para probar, usar una imagen autorizada para publicación.

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
