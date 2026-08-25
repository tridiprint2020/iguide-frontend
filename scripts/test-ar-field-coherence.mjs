import assert from "node:assert/strict";

import {
  getArQuaternionAngleDegrees,
  getRelativeArViewQuaternion,
} from "../src/engine/arPoseEngine.ts";

import {
  getCoverCropRect,
} from "../src/engine/arCaptureEngine.ts";

import {
  AR_MISSION_BEACON_ABOVE_GROUND_METERS,
  AR_MISSION_BEACON_BELOW_GROUND_METERS,
  AR_MISSION_BEACON_CENTER_Y_METERS,
  AR_MISSION_BEACON_HEIGHT_METERS,
  getArPinRotationState,
} from "../src/engine/arPinVisualEngine.ts";

const reference = {
  alphaDegrees: 42,
  betaDegrees: 76,
  gammaDegrees: -4,
  screenOrientationDegrees: 0,
};

const identity =
  getRelativeArViewQuaternion(
    reference,
    reference
  );

assert.ok(
  getArQuaternionAngleDegrees(identity) <
    0.001,
  "la referencia debe producir una cámara local idéntica"
);

const yawed =
  getRelativeArViewQuaternion(
    reference,
    {
      ...reference,
      alphaDegrees:
        reference.alphaDegrees + 28,
    }
  );

assert.ok(
  getArQuaternionAngleDegrees(yawed) > 20,
  "un giro real debe mover la cámara local"
);

const tilted =
  getRelativeArViewQuaternion(
    reference,
    {
      ...reference,
      betaDegrees:
        reference.betaDegrees - 18,
    }
  );

assert.ok(
  getArQuaternionAngleDegrees(tilted) > 12,
  "la inclinación debe mover la escena, no quedarse como overlay 2D"
);

assert.deepEqual(
  getCoverCropRect(
    1920,
    1080,
    1080,
    1920
  ),
  {
    sourceX: 656.25,
    sourceY: 0,
    sourceWidth: 607.5,
    sourceHeight: 1080,
  },
  "la captura vertical debe replicar object-fit cover del video"
);

const rotation =
  getArPinRotationState(4, false);

assert.ok(
  rotation.bodyRotationY < 0 &&
    rotation.symbolRotationY > 0,
  "el pin y su símbolo deben girar en sentidos opuestos"
);

assert.deepEqual(
  getArPinRotationState(1, true),
  getArPinRotationState(90, true),
  "reduced motion debe inmovilizar el pin y su símbolo"
);

assert.deepEqual(
  {
    below:
      AR_MISSION_BEACON_BELOW_GROUND_METERS,
    above:
      AR_MISSION_BEACON_ABOVE_GROUND_METERS,
    height:
      AR_MISSION_BEACON_HEIGHT_METERS,
    center:
      AR_MISSION_BEACON_CENTER_Y_METERS,
  },
  {
    below: -40,
    above: 180,
    height: 220,
    center: 70,
  },
  "el faro debe atravesar el punto desde el subsuelo hasta el cielo"
);

console.log(
  "AR field coherence: 7/7 pruebas en verde"
);
