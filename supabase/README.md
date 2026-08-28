# Colector mínimo del piloto

1. Crear un proyecto gratuito en Supabase.
2. Ejecutar `migrations/202608220001_pilot_events.sql` desde SQL Editor.
3. Configurar en Vercel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_APP_VERSION`.
4. Desplegar un preview y abrir `/q/<codigo-del-punto>`.
5. Consultar `pilot_funnel_by_source` (acumulado) o `pilot_funnel_daily` (día de Lima) desde SQL Editor o el dashboard con rol propietario.

El rol anónimo solamente puede insertar. No puede leer, editar ni eliminar eventos. La tabla no contiene coordenadas, rutas, nombres, correos, fotos ni notas.

`mission_certified` significa que el motor GPS del cliente aceptó la llegada. Sirve para medir el piloto, pero no es todavía una firma antifraude para canjes; los premios necesitarán verificación en el backend.
