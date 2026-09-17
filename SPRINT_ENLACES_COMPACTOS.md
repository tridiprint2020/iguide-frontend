# Sprint: enlaces compactos y cola Supabase

Actualización: 17/09/2026. El Fundador autorizó publicar la reducción local
probada en preview; enlaces cortos con almacenamiento remoto quedan en HOLD.
No hay autorización de integración a main.

## Cambio para revisión

Formato de transporte `c1.`: tuplas de posiciones estables y tabla de decisiones
sin repeticiones. Conserva fecha, horarios, preferencias, paradas, explicaciones
y pronóstico. El resultado se valida por el motor de persistencia existente.
Los descartes se omiten igual que en los enlaces anteriores. El lector sigue
aceptando enlaces V1 y V2 en base64url. No cambia el esquema guardado del plan.

Sin dependencias nuevas ni cambios en lockfile, Supabase, AR o permisos de Vercel.
El receptor necesita el lector nuevo: no redirigir a producción mientras siga
desplegada la versión anterior.

## Medidas en fixtures, no en el plan real del teléfono

| Payload sin dominio ni ruta | Antes | Ahora |
| --- | ---: | ---: |
| Una parada y pronóstico | 1251 caracteres | 555 caracteres |
| Ocho paradas y pronóstico | 3766 caracteres | 993 caracteres |

Es una URL autosuficiente más compacta; sigue conteniendo código y no sustituye
una URL corta de identificador. La protección Vercel sigue siendo independiente.

La suite incluye compatibilidad V1, recuperación exacta sin almacenamiento local,
formatos inválidos, Unicode, pronóstico opcional, valores cero/false, compartir,
cancelación y copia con una sola URL. Las pruebas simulan las APIs del navegador;
no certifican WhatsApp real. Incluye además las cinco pruebas complementarias
preparadas después de la auditoría de 6e8fe3a.

## Estado funcional según evidencia del Fundador

- Acceso al preview desde el teléfono: PASÓ.
- Comer local: París propuesto y 17 descartados gastronómicos: PASÓ categoría y conteo.
- Guardado/recuperación del plan: PASÓ según confirmación del Fundador.
- Explicación de descartes por tiempo: PENDIENTE de revisión.
- WhatsApp y apertura en otro navegador: PENDIENTE, afectado por longitud y acceso Vercel.
- ES/EN, reacciones visuales, ficha lechón, franjas y vida nocturna: PENDIENTES de campo.
- GPS/llegada, cámara, MemoryCard, suspensión Android y puerta Valle Azul: PENDIENTES.
- El GO condicionado de Claude es para 6e8fe3a; este cambio necesita revisión incremental.

## Cola conjunta Supabase — HOLD, sin activar

- Enlaces cortos: copia portable, código aleatorio, conservación y acceso por enlace.
- R5 y atribución QR: eventos, exclusión de pruebas internas, reportes por aliado;
  requiere política y consentimiento antes de activar mediciones.
- Premios y canjes: aliados, beneficios, stock y validación del canje.
- Consola del aliado/panel B2B: acceso y edición autorizada.
- Cuenta y sincronización entre dispositivos: perfil, planes, favoritos y colección.
- Fotos en nube y Hospes RAG: evaluar después; no son requisito de esta integración.

Guardianes, XP y colección local no requieren Supabase por sí solos. Fotos en
IndexedDB, diseño y geozonas también pueden funcionar sin backend.
