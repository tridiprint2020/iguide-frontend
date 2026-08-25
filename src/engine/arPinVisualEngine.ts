export const AR_PIN_HEIGHT_METERS = 7;

export const AR_PIN_MAX_HEIGHT_METERS =
  10.5;

const AR_PIN_SCALE_START_DISTANCE_METERS =
  40;
const AR_PIN_SCALE_END_DISTANCE_METERS =
  150;
const AR_PIN_SELECTED_SCALE_BOOST =
  0.06;

export const AR_MISSION_BEACON_BELOW_GROUND_METERS =
  -40;

export const AR_MISSION_BEACON_ABOVE_GROUND_METERS =
  180;

export const AR_MISSION_BEACON_HEIGHT_METERS =
  AR_MISSION_BEACON_ABOVE_GROUND_METERS -
  AR_MISSION_BEACON_BELOW_GROUND_METERS;

export const AR_MISSION_BEACON_CENTER_Y_METERS =
  (
    AR_MISSION_BEACON_ABOVE_GROUND_METERS +
    AR_MISSION_BEACON_BELOW_GROUND_METERS
  ) / 2;

const AR_PIN_BODY_ROTATION_RADIANS_PER_SECOND =
  -0.32;
const AR_PIN_SYMBOL_ROTATION_RADIANS_PER_SECOND =
  0.5;

export type ArPinRotationState = {
  bodyRotationY: number;
  symbolRotationY: number;
};

/**
 * Conserva siete metros cerca y aumenta únicamente el volumen visual
 * a distancia. La escala ocurre alrededor de la punta: nunca cambia
 * las coordenadas X/Z que representan la latitud y longitud.
 */
export function getArPinVisualScale(
  distanceMeters: number,
  selected: boolean
): number {
  const maximumScale =
    AR_PIN_MAX_HEIGHT_METERS /
    AR_PIN_HEIGHT_METERS;
  const progress = Math.max(
    0,
    Math.min(
      1,
      (
        distanceMeters -
        AR_PIN_SCALE_START_DISTANCE_METERS
      ) /
        (
          AR_PIN_SCALE_END_DISTANCE_METERS -
          AR_PIN_SCALE_START_DISTANCE_METERS
        )
    )
  );
  const distanceScale =
    1 +
    progress * (maximumScale - 1);

  return Math.min(
    maximumScale,
    distanceScale +
      (selected
        ? AR_PIN_SELECTED_SCALE_BOOST
        : 0)
  );
}

/**
 * El pin gira en sentido horario visto desde arriba y el símbolo lo
 * contradice. Esa contra-rotación hace legible su volumen sin mover
 * la etiqueta DOM ni la posición geográfica del conjunto.
 */
export function getArPinRotationState(
  elapsedSeconds: number,
  reducedMotion: boolean
): ArPinRotationState {
  if (reducedMotion) {
    return {
      bodyRotationY: -Math.PI / 9,
      symbolRotationY: Math.PI / 7,
    };
  }

  return {
    bodyRotationY:
      elapsedSeconds *
      AR_PIN_BODY_ROTATION_RADIANS_PER_SECOND,
    symbolRotationY:
      elapsedSeconds *
      AR_PIN_SYMBOL_ROTATION_RADIANS_PER_SECOND,
  };
}
