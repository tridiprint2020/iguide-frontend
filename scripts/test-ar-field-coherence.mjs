import assert from "node:assert/strict";

import {
  getArQuaternionAngleDegrees,
  getRelativeArViewQuaternion,
} from "../src/engine/arPoseEngine.ts";

import {
  getCoverCropRect,
} from "../src/engine/arCaptureEngine.ts";

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

console.log(
  "AR field coherence: 4/4 pruebas en verde"
);
