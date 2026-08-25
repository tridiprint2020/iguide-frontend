import assert from "node:assert/strict";

import {
  getArQuaternionAngleDegrees,
  getRelativeArViewQuaternion,
} from "../src/engine/arPoseEngine.ts";

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

console.log(
  "AR field coherence: 3/3 pruebas en verde"
);
