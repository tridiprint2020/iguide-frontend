# T2 — Contrato mínimo de datos para la beta

Fecha: 15/10/2026. Estado: **PROPUESTA PARA REVISIÓN**, no implementada.
Base del código: T0 `4927f77`, sobre main `4d1c6c8`. Responsables propuestos:
Christian decide operación y datos; Codex implementa; Claude revisa por SHA.

Este contrato prepara T3/T4/T5. No activa Supabase, R5, reservas, cobros,
cuentas de exploradores, sincronización, fotos en nube o RAG. T1 y T2b siguen
siendo condiciones previas aplicables. Aprobar el documento no acredita que
sus controles estén desplegados ni convierte una propuesta en política legal.

## 1. Qué existe y qué se propone

| Dato actual | Evidencia en código | Regla de la beta |
| --- | --- | --- |
| Nombre/perfil, favoritos, XP y visitas | `src/data/user.ts`, `src/types/user/user.ts`; localStorage `iguide_user_profile` | Se conservan locales; no se copian automáticamente al backend. |
| Punto de regreso | `returnPointEngine.ts`; `iguide-return-point`, lat/lng/etiqueta | Sigue local. La autorización del navegador para GPS no autoriza subirlo a Supabase. |
| Misión y recorrido | `JourneyContext.tsx`, `trackingEngine.ts`; claves `iguide_active_journey`, `iguide_track_*` y sesiones | Sin subida remota ni uso como comprobante de compra. |
| Foto y MemoryCard | `mediaStorage.ts`; IndexedDB `iguide-media/photos` | Blob/referencia siguen locales. Compartir una imagen por decisión del usuario es un flujo distinto. |
| Plan portable | `types/itinerary.ts`, `itineraryPersistenceEngine.ts`, `itineraryShareEngine.ts` | Ya contiene IDs, fecha/horas, preferencias y pronóstico; no necesita nombre ni GPS. El enlace remoto usará una lista explícita de campos. |
| Consejos y verificación editorial | `Experience.hospesTip`, `operationalVerification` | Fuente aprobada con precisión temporal real; un aporte nuevo no reemplaza estos datos sin revisión. |
| Servicios actuales | `main.tsx`, `weatherService.ts`, TileLayer de mapas | Analytics está montado; el clima consulta coordenadas fijas de Huancayo; los tiles reciben solicitudes del viewport. No describir la app actual como cero tráfico externo. T2b debe identificar proveedores y tratamiento. |

La beta empieza con un destino: `city_id = pe-jun-huancayo`. Validar pares
`city_id`/`experienceId` contra el catálogo aprobado; un visitante no crea ni
modifica locales por enviar un ID. La expansión Lima exige su propio catálogo,
responsable y verificación; no copiar afirmaciones locales como si fueran globales.

## 2. Finalidades separadas

| Flujo | Acción que lo inicia | Mínimo enviado | Uso permitido |
| --- | --- | --- | --- |
| Plan compartido T4 | Crear enlace compartible, con aviso visible | Snapshot validado y versión del aviso | Recuperar ese plan por su enlace hasta caducidad/revocación. No perfilar al creador. |
| Aporte T5 | Enviar pista, cambio, candidato u opinión, con aviso propio | Lugar/destino, tipo, texto, idioma y clave idempotente | Revisión interna. Solo pistas/cambios contrastados pueden convertirse en datos públicos. |
| Consejo aprobado T6 | Revisor aprueba un contenido normalizado con evidencia | Dato revisado, fuente, fecha/precisión, vigencia y revisor | Consultas guiadas de Hospes con procedencia. Nada de conversaciones abiertas o entrenamiento con opiniones privadas. |
| Reserva manual C0 | Cliente solicita una actividad al vendedor identificado | Datos de coordinación acordados en su aviso | Gestionar la actividad y cancelación. No se mezclan con GPS, aportes o ranking. Este documento no habilita un sistema de reservas. |

Rechazar campos de perfil, GPS, foto, recorrido o adjuntos en T4/T5. No guardar
sin más todo un objeto recibido. El texto libre puede incluir datos personales
por error: avisar que no se envíen, restringir acceso y revisar/eliminar lo
innecesario; no prometer detección automática infalible.
En T4, validar también `explanation.params` con una lista de campos/tipos
permitidos por `reasonCode`: no admitir texto libre, contacto o coordenadas
ocultos dentro de parámetros. El lector legacy conserva su compatibilidad;
eso no obliga a aceptar esos campos en nuevas escrituras al servidor.

## 3. Estructura lógica propuesta

Son entidades a revisar, no tablas creadas. Los nombres finales pertenecen a
la migración de T3. Evitar una tabla universal de todo lo que hace el usuario.

| Entidad | Campos y restricciones mínimas | Acceso |
| --- | --- | --- |
| `shared_plans` | ID interno, hash del token de lectura, hash del secreto de gestión, snapshot saneado, schemaVersion, created_at, expires_at, revoked_at, notice_version. Sin exclusiones editoriales en el portable. | API de lectura por token exacto; sin listado público. Gestión solo con secreto de gestión. |
| `local_submissions` | ID, ciudad/lugar, tipo, texto original ≤500 caracteres Unicode, idioma, estado, notice_version, fechas, clave idempotente/hash de contenido y hash del secreto de gestión. No nombre/contacto requerido. | Visitante recibe comprobante de su envío; sin lectura de otros aportes ni aprobación propia. |
| `local_facts` | ID, ciudad/lugar, texto público normalizado, tipo de dato, condiciones, fuente editorial, verified_at, precisión day/month/year, expires_at, revisor, revisión y estado. | Solo hechos aprobados y vigentes por API pública. Evidencia privada y notas de revisión quedan fuera de su proyección. |
| `review_actions` | ID de aporte/hecho, actor autorizado, decisión, motivo y fecha; sin replicar el texto completo en cada evento. | Solo revisión interna. No es telemetría de usuarios ni reporte comercial de visitas. |

`Cuenta tu experiencia` y `Recomienda un lugar` permanecen internos en beta.
No basta cambiar un flag de publicación: la API pública debe excluirlos.
Para publicar un hecho, generar una versión normalizada distinta del texto
original, contrastar evidencia y conservar su trazabilidad privada.

## 4. API y permisos propuestos

Ruta de referencia para T4: `/p/<token-lectura>`, a implementar expresamente
en la app; hoy no existe. El lector V1/c1 de `/itinerario?plan=...` se conserva.
Generar lectura y gestión con CSPRNG independientes: lectura con al menos
128 bits; gestión con al menos 256 bits. Guardar hashes; el secreto de gestión
no viaja en el enlace público, los logs o la respuesta de lectura.

Crear el enlace informa que cualquiera que lo reciba puede reenviarlo y ver
lugares y horarios previstos. Un token opaco reduce adivinación, no convierte
el plan compartido en información privada frente a sus destinatarios.

| Operación | Anónimo | Explorador autenticado normal | Revisor autorizado |
| --- | --- | --- | --- |
| Crear plan/aporte | Solo API validada, aviso vigente y límites | Mismos controles; no obtiene acceso adicional por iniciar sesión | Mismos controles en pruebas, identificadas como internas si se miden después |
| Leer un plan | Solo token válido, vigente y no revocado | Igual; no hay listado por usuario | Sin listado por defecto ni excepción por ser revisor |
| Revocar plan/retirar aporte | Solo secreto de gestión correcto | Igual; no basta presentar un ID | Flujo de gestión de incidente auditado, si se habilita expresamente |
| Leer aportes/notas de revisión | Denegado | Denegado | API autenticada y autorización de revisor comprobada en servidor |
| Publicar/editar hechos | Denegado | Denegado | Revisión autorizada con motivo y evidencia; nunca client-side role=true |
| Consultar consejos públicos | Solo proyección aprobada y vigente | Igual | Igual en la interfaz pública |

Propuesta: acceso mediante funciones de servidor, con tablas privadas y
revocación de grants de `anon`/`authenticated`; probar además cualquier tabla
expuesta con RLS habilitado. No crear una política SELECT universal para
planes/aportes esperando que la UI oculte el listado. Probar también REST/RPC,
vistas y respuesta de API, no solo los botones del frontend.

Secret keys y `service_role` solo servidor. Esas claves pueden omitir RLS:
la validación y la autorización de la función son necesarias. Un JWT válido
de un usuario cualquiera no lo convierte en revisor; la pertenencia debe
resolverla el servidor desde una lista/rol controlado, nunca desde el payload.

## 5. Conservación y eliminación propuestas

Los siguientes plazos son decisiones de producto a confirmar, no plazos
legales afirmados. El responsable debe validar aviso, base aplicable y proveedores.

| Dato | Propuesta | Conducta al terminar |
| --- | --- | --- |
| Plan compartido | 30 días desde creación; revocación anticipada con secreto | Lectura deja de resolver inmediatamente al caducar/revocar; purga de snapshot en ≤24 h. El mensaje no publica información de otros planes. |
| Aporte bruto | Máximo 90 días desde recepción | Eliminar texto original y secretos al vencer; conservar solo el hecho aprobado independiente y auditoría mínima si corresponde a su finalidad. |
| Borrador local de aporte | Hasta enviar, borrar o 30 días | Explicar que solo está en el dispositivo; ninguna sincronización automática. |
| Contadores de abuso | TTL máximo 24 h | Borrado automático; no reutilizarlos para marketing, visitas o R5. |
| Auditoría mínima de revisión | 180 días, sin texto bruto innecesario | Purgar o reducir al registro editorial justificado que se acuerde en el aviso. |
| Hecho público | Vigencia específica según tipo, nunca indefinida por omisión | Al vencer, salir de recomendaciones aprobadas y pedir contraste; historial editorial mínimo según contrato final. |

El comprobante debe explicar cómo retirar usando el secreto y qué ocurre si
se pierde. No prometer recuperación por cuenta cuando no hay cuenta. Christian
debe fijar un canal de privacidad del responsable antes de activar T3.

Definir retención de logs, backups y restauración con el plan elegido: borrar
una fila no borra instantáneamente un backup. El aviso debe reflejarlo.
Tras restaurar, aplicar vencimientos/revocaciones antes de reabrir lecturas;
no resucitar enlaces o aportes retirados. Fotos no se subirán en esta beta.
Si no se conserva una fuente fiable de retiradas posteriores al backup,
mantener cerradas las APIs y descartar planes/aportes brutos restaurados en
vez de publicarlos de nuevo. T3 debe documentar y probar esa decisión de recuperación.

## 6. Recepción honesta y control de abuso

- Mensajes de producto: Enviado solo tras confirmación de escritura del
  servidor. Sin red: Guardado en este dispositivo. Un timeout no demuestra
  recepción; reintentar con la misma clave idempotente.
- El servidor decide estado inicial, fechas y publicabilidad. Rechazar
  campos adicionales, lugar inexistente, tipo no permitido y texto vacío.
  Propuesta: 500 caracteres Unicode y máximo de cuerpo 16 KiB. Especificar
  normalización y contar longitud también en servidor.
- Probar duplicados exactos y reintentos concurrentes: una fila y un solo
  comprobante por clave+contenido. Misma clave con otro contenido: conflicto,
  sin sobrescribir el aporte anterior ni devolver textos de terceros.
- Mostrar texto de terceros escapado también en la bandeja; sin HTML,
  ejecución de scripts ni enlaces convertidos automáticamente. Validar por
  tipo y contexto: una corrección de horario no actualiza el catálogo sola.
- Propuesta inicial para revisar: tres envíos por 15 min y diez por día por
  clave de control de servidor; lectura de planes con su propio presupuesto.
  Fijar los límites definitivos y probar concurrencia antes de desplegar.
- Para una beta sin cuenta, evaluar bucket HMAC de IP con clave diaria/TTL
  24 h, sin IP en texto plano en nuestra tabla. Sigue siendo procesamiento
  de datos y puede afectar a una red compartida: necesita decisión en T2 y
  aviso, no llamarlo anónimo. No sustituirlo por un límite solo en localStorage.
  Acordar logs del proveedor y no prometer ausencia de IP en toda su infraestructura.
- No imprimir cuerpos, tokens, fotos ni secretos en logs. El rate limit no
  garantiza identidad humana ni evita todo abuso; el revisor mantiene la puerta.

## 7. Fuente local y neutralidad de Hospes

Formato mínimo de un consejo: lugar/destino, qué conviene hacer, cuándo
aplica, restricciones, fuente, fecha con precisión real, evidencia, revisor,
vigencia y estado. Separar quién lo contó de quién lo comprobó. Fuente de
amistades no pasa a confirmado personalmente al aprobar el texto.

Horario, precio y disponibilidad requieren contraste operativo. Fecha aproximada
no se convierte en un día inventado. Si falta confirmar, decirlo. Una opinión
privada no se incorpora al motor de recomendación ni al RAG.

Pagar compra una oferta/visibilidad rotulada, no el ranking editorial ni la
retirada de información válida. Publicar opiniones exige política propia,
criterios de moderación y réplica; no se habilita en la beta de este contrato.

## 8. Casos de aceptación para T3/T4/T5

| ID | Prueba exigida antes de liberar | Resultado necesario |
| --- | --- | --- |
| DAT01 | REST/RPC/listado con rol anon y usuario normal; revisar vistas/proyecciones. | No enumeran planes, aportes, secretos ni notas privadas. |
| DAT02 | Intentar publicar, revisar o poner expires_at/role desde cliente. | Rechazo del servidor; sin mutación. |
| DAT03 | Token ausente/aleatorio, caducado y revocado; secreto de gestión incorrecto. | Sin snapshot; no autoriza gestión ni filtra existencia de otros registros. |
| DAT04 | Crear, abrir y revocar plan; intentar enumerar sin token; confirmar titularidad de gestión. | Solo snapshot mínimo, sin GPS, perfil, exclusiones ni secreto de gestión. |
| DAT05 | Ocho paradas V1 y c1 antiguas más nuevo enlace remoto. | Lectores existentes funcionan; no requieren cuenta ni pierden pronóstico. |
| DAT06 | Timeout después de escritura y dos reintentos concurrentes iguales. | Una fila; comprobante consistente, sin duplicado ni falso Enviado. |
| DAT07 | Cuerpo enorme, 501 caracteres, tipo/lugar extraños, HTML/script y URLs maliciosas. | Límites en servidor y cliente; ninguna ejecución en bandeja o vista pública. |
| DAT08 | Usuario normal intenta leer o aprobar una opinión; API pública consulta todo tipo. | Opinión/candidato internos no aparecen; solo revisor autorizado los consulta. |
| DAT09 | Alcanzar límite desde clientes distintos/concurrentes; borrado de bucket al TTL. | Control del servidor y conservación acordada, sin bloqueo permanente ni medición comercial oculta. |
| DAT10 | Vencimiento, retirada, purga y restauración de respaldo de prueba. | No resucitan datos retirados/vencidos; límites de backups documentados. |
| DAT11 | Fallar backend mientras se usa core local. | GPS/planes locales/fotos siguen su flujo; no borrado ni pérdida por fallo de red. |
| DAT12 | Dato sin evidencia, fuente indirecta, precisión mensual y consejo caducado. | Sin publicación automática, fechas inventadas o recomendación de contenido vencido. |

Estas pruebas todavía **no se ejecutaron**: no hay backend de esta beta.
T3 entrega migraciones y pruebas de permisos junto con el código, no después.

## 9. Decisiones pendientes y orden de ejecución

| ID | Decisión concreta | Quién la cierra | Bloquea |
| --- | --- | --- | --- |
| D01 | Responsable del tratamiento, canal de privacidad y vendedor de C0; validar obligaciones según servicio. | Christian con asesoría aplicable | Avisos, cobro y activación comercial |
| D02 | Aprobar/cambiar plazos, aviso por finalidad y separación de Analytics/R5; definir bucket/logs y límites. | Christian; Claude revisa coherencia técnica | T3/T5 público |
| D03 | Proyecto Supabase, estado real, región, acceso de revisores, plan, backups y presupuesto. No asumir que el aviso de pausa sigue vigente. | Christian; Codex verifica al abrir T3 | Provisionar backend |
| D04 | Vercel, clima comercial/atribución, mapas, privacidad/términos y Analytics. | T2b: propietario y responsables técnicos | Uso comercial según condiciones de cada servicio |
| D05 | Token/TTL/revocación de T4 y controles de esta SPEC, con pruebas DAT01–12. | Claude revisa; Christian decide producto | Implementación y liberación de la beta |

Mientras se revisa: completar T1 y cotizar C0 sin esperar backend. Después,
autorizar T3 explícitamente, probar permisos, liberar una función completa
(T4) y luego T5. T6 consulta datos aprobados; no necesita RAG para el piloto.

## 10. Fuentes técnicas verificadas el 15/10/2026

- Código en la base T0 indicada: contratos portable/local, contexto de misión,
  catálogo, clima, fotos y Analytics enumerados en la sección 1.
- Supabase, Row Level Security: grants, políticas y claves que omiten RLS:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase, Environment variables: secretos disponibles solo en servidor:
  https://supabase.com/docs/guides/functions/secrets
- Supabase, Database Backups: retención por plan y límites respecto a Storage:
  https://supabase.com/docs/guides/platform/backups

Usar la documentación de la versión elegida al implementar. La SPEC no
certifica cumplimiento legal ni supone contratación de los planes citados.
