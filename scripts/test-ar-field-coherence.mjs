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
  getArPinVisualScale,
} from "../src/engine/arPinVisualEngine.ts";

import {
  calculateArDistanceMeters,
  calculateArViewerWorldPosition,
  projectArDistanceToWorld,
  projectArPlacementToWorld,
} from "../src/engine/arGeoEngine.ts";

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

assert.deepEqual(
  [
    getArPinVisualScale(14, false),
    getArPinVisualScale(40, false),
    getArPinVisualScale(95, false),
    getArPinVisualScale(150, false),
    getArPinVisualScale(500, true),
  ],
  [1, 1, 1.25, 1.5, 1.5],
  "el pin debe crecer de 7 a 10.5 m sin superar el máximo"
);

const anchoredPin =
  projectArPlacementToWorld({
    distanceMeters: 72,
    spatialDistanceMeters: 556,
    relativeBearingDegrees: 90,
  });

assert.ok(
  Math.abs(anchoredPin.x - 556) <
    0.000001 &&
    Math.abs(anchoredPin.z) < 0.000001,
  "la misión lejana debe permanecer en su distancia geográfica, sin compresión visual"
);

const referenceCoordinates = {
  latitude: -12.0689,
  longitude: -75.2103,
};
const movedCoordinates = {
  latitude: -12.06845,
  longitude: -75.2098,
};
const expectedMovement =
  calculateArDistanceMeters(
    referenceCoordinates,
    movedCoordinates
  );
const viewerPosition =
  calculateArViewerWorldPosition(
    referenceCoordinates,
    movedCoordinates,
    0
  );

assert.ok(
  Math.abs(
    Math.hypot(
      viewerPosition.x,
      viewerPosition.z
    ) - expectedMovement
  ) < 0.000001,
  "la cámara virtual debe recorrer la misma distancia que el GPS filtrado"
);

const samePointAtTwoScales =
  projectArDistanceToWorld(120, 37);

assert.deepEqual(
  samePointAtTwoScales,
  projectArDistanceToWorld(120, 37),
  "cambiar el tamaño visual nunca debe mover el centro GPS del pin"
);

console.log(
  "AR field coherence: 11/11 pruebas en verde"
);
