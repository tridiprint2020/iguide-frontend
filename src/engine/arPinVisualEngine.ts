export const AR_PIN_HEIGHT_METERS = 7;

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
