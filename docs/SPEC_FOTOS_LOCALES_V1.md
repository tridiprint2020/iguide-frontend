# Fotos de locales — primera entrega comercial

Estado: IMPLEMENTADO; publicación de rama autorizada para revisión. Activación pendiente.
Implementación local autorizada por Christian el 02/11/2026.
Base: main `0eeaf8464f3a484c134a51281c58c7e17a299d70`.

## Resultado

Christian inicia sesión, elige un local existente del catálogo, toma o selecciona
una fotografía, revisa la vista previa y publica su portada. Otro visitante ve
la imagen en la ficha y las tarjetas sin recompilar la aplicación.

Esta autorización adelanta exclusivamente las portadas comerciales respecto
del orden del sprint anterior. No abre las otras funciones de Supabase.

## Alcance y acceso

- Ruta `/admin/locales`, interfaz adaptable al celular, edición solo para usuarios
  de Supabase Auth incluidos por el operador en `iguide_photo_editors`.
- Acceso con correo y contraseña; sin altas públicas desde la aplicación. Sesión
  solo en memoria y con caducidad; una recarga exige volver a entrar.
- Primera versión: una portada por local ya presente en el catálogo. Alta de
  locales, galerías, autoservicio de dueños, cobros y anuncios quedan separados.
- Reutilizar la compresión existente: JPEG, máximo 1600 px y 2 MiB publicados;
  entrada JPEG/PNG/WebP hasta 12 MiB. No subir el archivo original ni EXIF.
- Confirmación explícita de autorización para publicar esa fotografía. El bucket
  es público: la imagen es pública desde su subida, no un almacén de borradores.
- Cada publicación usa una ruta nueva; no sobrescribe el archivo anterior.
  Solo se muestra éxito después de confirmar la fila persistida en servidor.
- Una retirada elimina la referencia pública, intenta borrar el archivo y avisa
  si queda limpieza pendiente. Reemplazos conservan archivos anteriores hasta
  limpieza por el operador; revisar cuota y copias antes de activar producción.
- Permisos de servidor: lectores públicos solo acceden a metadatos públicos;
  solo editores autorizados pueden subir, publicar, retirar o eliminar. Las
  políticas restrictivas del bucket impiden que otra política amplia lo abra.
- Nunca incluir service_role, sb_secret, contraseñas ni tokens en VITE, logs,
  URLs, repositorio, localStorage o sessionStorage.

## Integración

Supabase REST (Auth, Storage y PostgREST), sin dependencias nuevas. Configuración
con URL HTTPS del proyecto y clave publishable (o anon heredada). La protección
real está en permisos y RLS, no en ocultar la ruta del panel.

Los datos remotos solo sustituyen imágenes de presentación. No modifican
horarios, coordenadas, recomendaciones, patrocinio, XP, fotos personales,
misiones ni MemoryCards. Sin configuración no se hace ninguna petición nueva;
si falla la red se conserva el catálogo y sus imágenes incorporadas.

## Aceptación

1. Sin configuración: estado de activación pendiente, sin botón de publicación
   utilizable ni simulación de éxito.
2. Sin sesión, con sesión caducada o usuario sin autorización: escritura bloqueada
   en cliente y servidor; un usuario no puede nombrarse editor.
3. Imagen válida: vista previa → confirmar derechos → subir → confirmar datos →
   mostrar enlace de ficha. Una recarga de otro navegador recupera la portada.
4. Error en subida o publicación: aviso concreto, sin falso éxito ni borrado de
   una portada que el servidor pudiera haber confirmado tras un timeout.
5. Cambio de local durante una operación no atribuye el resultado a otra ficha.
6. Publicación concurrente: nuevas rutas y última escritura confirmada; retirada
   condicionada a la ruta leída para no borrar una publicación más reciente.
7. Restaurar portada incorporada al retirar; comunicar borrado pendiente del
   archivo si Storage no lo confirma.
8. Pruebas existentes y build; pruebas nuevas de contrato HTTP, caducidad,
   autorización, fallo de red/publicación y presentación. RLS se debe comprobar
   con roles reales en el proyecto antes de dar GO productivo.

## Entrega y activación

Desarrollo, migración y comprobaciones en rama local. No push, merge, despliegue,
modificaciones del proyecto Supabase, registro de cuentas o gasto implícitos.
Activación requiere seleccionar el proyecto conectado, inspeccionar políticas
existentes, aplicar la migración revisada, habilitar al editor y comprobar los
roles reales. Si no hay conexión, completar todo el trabajo local y declarar el
bloqueo con precisión. Christian conserva el GO de publicación.
