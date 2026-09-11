# Auditoría de candidatos de Hospes

**Fecha:** 11 de septiembre de 2026
**Base:** `fix/hospes-nightlife-safety-v1` desde `4969165`

Este registro separa tres estados que no deben confundirse:

- **Recomendable:** Hospes conoce categoría, relación con el clima y horario.
- **Visible, no recomendable:** la ficha puede existir en el mapa, pero Hospes no
  debe enviarnos allí hasta verificar el dato faltante.
- **Retirado/inactivo:** no participa en el catálogo público.

La clasificación técnica de ambiente se basa en el tipo y la descripción ya
existentes. No otorga un sello de «verificado» al negocio; los horarios heredados
y los cierres semanales continúan señalados para comprobación en campo.

## Resultado del inventario

- 42 experiencias activas después de retirar `El San` y activar tres discotecas.
- 35 candidatos del itinerario; los 7 hoteles no forman parte de sus paradas.
- 35 de 35 candidatos declaran ambiente y sensibilidad climática.
- 32 de 35 poseen disponibilidad suficiente para ser recomendados.
- 3 de 35 están visibles, pero fuera de la recomendación automática: las tres
  fiestas de horario o ubicación variable.

## Activados con política explícita

| Grupo | Política aplicada |
| --- | --- |
| Cava | Interior; puede aparecer con lluvia si está dentro de horario. |
| Galileo Taberna | Interior; puede aparecer con lluvia si está dentro de horario. |
| Azotea 18 | Interior en el último piso; puede aparecer con lluvia si está dentro de horario. |
| La Serranita | Interior; abre todos los días de 09:00 a 21:00. Puerta y horario confirmados por el Fundador. |
| Polares | Interior; abre todos los días de 11:00 a 18:30 y cierra feriados. Puerta y horario confirmados por el Fundador. |
| Taj Mahal | Interior; abre de martes a domingo de 20:00 a 03:00. Puerta confirmada personalmente por el Fundador. |
| Insomnio House Music | Interior; abre de jueves a sábado de 21:00 a 05:00. Datos recientes confirmados por amistades del Fundador. |
| Mr. Juerga Discoteca | Interior; abre todos los días de 18:00 a 04:00. Datos recientes confirmados por amistades del Fundador. |
| Restaurantes y cafés con horario | Interiores o mixtos según su ficha; se filtran por horario. |
| Casa del Artesano y Casa del Barro Wanka | Interiores; se filtran por horario. |
| Museo Salesiano | Interior; se filtra por horario. |
| Wariwillka | Mixto y sensible a humedad por su zona arqueológica. |
| Expediciones | Exteriores; se filtran por clima, luz y transporte. |
| Ruta del lechón | Exterior; se filtra por lluvia, fin de semana y existencias. |

## Visibles, pero no recomendables todavía

| Experiencia | Duda pendiente | Acción de campo |
| --- | --- | --- |
| El Santiago | Temporada anual estructurada; cada familia cambia hora y lugar. | Mantener informativo hasta conocer una celebración concreta. |
| Fiesta de la Santísima Trinidad | Fechas anuales estructuradas; cada barrio cambia hora y lugar. | Mantener informativo hasta conocer una celebración concreta. |
| Carnavales | Temporada y recorrido principal registrados; no se cancela con lluvia, pero las fiestas posteriores son variables. | Mantener informativo hasta conocer una ocurrencia concreta. |

## Horarios heredados que necesitan refresco

Estos locales poseen una franja diaria legible, pero todavía no declaran los días
de la semana. El motor puede usar la franja, aunque la visita de campo debe
confirmar cierres semanales y feriados:

- París, Detrás de la Catedral, Lalo's, El Caramba, El Leopardo, Huancahuasi y
  El Olímpico.
- Bicho, La Petite Bakery y T'ika Café Lounge.
- Cava, Galileo Taberna y Azotea 18.
- Museo Salesiano y Wariwillka.
- Casa del Artesano y Casa del Barro Wanka.

Las cuatro expediciones también necesitan reglas de acceso verificadas. Hasta
entonces, Hospes aplica límites por clima, luz, duración y transporte, pero no
afirma que exista un horario oficial.

## Discotecas incorporadas al catálogo

El archivo `nightclubs.ts` queda correctamente nombrado. Por decisión del
Fundador, sus tres registros están activos y visibles:

- Taj Mahal.
- Insomnio House Music.
- Mr. Juerga Discoteca.

Los tres ya poseen horario semanal, ambiente, puerta, duración, presupuesto,
formas de pago y confirmación de que cobran entrada. Hospes puede considerarlos
automáticamente, siempre después de validar intención, horario, clima y tiempo
disponible.

`El San` fue retirado del dataset por decisión editorial y una prueba automática
impide que reaparezca accidentalmente en el catálogo.

## Regla permanente de Hospes

El orden de decisión es:

1. intención explícita;
2. datos y horario utilizables;
3. clima y seguridad;
4. preferencia del usuario;
5. cercanía al punto conocido;
6. explicación del resultado.

Una puntuación nunca puede recuperar un lugar que falló categoría, seguridad u
horario.
