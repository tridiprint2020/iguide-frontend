# Colector mínimo del piloto

1. Crear un proyecto gratuito en Supabase.
2. Ejecutar, en orden, `migrations/202608220001_pilot_events.sql` y `migrations/202608280001_exclude_internal_cohort.sql` desde SQL Editor.
3. Configurar en Vercel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_APP_VERSION`.
4. Desplegar un preview y abrir `/q/<codigo-del-punto>`.
5. Consultar `pilot_funnel_by_source` (acumulado) o `pilot_funnel_daily` (día de Lima) desde SQL Editor o el dashboard con rol propietario.

El rol anónimo solamente puede insertar. No puede leer, editar ni eliminar eventos. La tabla no contiene coordenadas, rutas, nombres, correos, fotos ni notas.

`mission_certified` significa que el motor GPS del cliente aceptó la llegada. Sirve para medir el piloto, pero no es todavía una firma antifraude para canjes; los premios necesitarán verificación en el backend.

## Cohorte interna

Antes de probar el embudo en un dispositivo del fundador o de un tester, abrir una vez:

```text
https://<preview>/?cohort=internal
```

El dispositivo queda marcado localmente y sus eventos usan `source_code = 'test-internal'`. Las vistas comerciales excluyen cualquier fuente `test-*`, aunque los eventos crudos permanecen disponibles para QA con credenciales administrativas.

Para devolver ese navegador al tráfico público:

```text
https://<preview>/?cohort=public
```

El cambio solo afecta eventos futuros. Los eventos internos ya registrados nunca se reclasifican como públicos.
