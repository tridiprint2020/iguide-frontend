import * as THREE from "three";

import {
  getExperienceMarkerSymbol,
  getPlaceMarkerVisual,
} from "./placeMarkerVisualEngine";

import type {
  PlaceMarkerState,
} from "./placeMarkerVisualEngine";

import type {
  Experience,
} from "../types/experience";

import {
  AR_MISSION_BEACON_CENTER_Y_METERS,
  AR_MISSION_BEACON_HEIGHT_METERS,
  AR_PIN_HEIGHT_METERS,
  getArPinRotationState,
} from "./arPinVisualEngine";

const AR_PIN_HOLE_CENTER_Y_METERS = 4.82;

export {
  AR_PIN_HEIGHT_METERS,
} from "./arPinVisualEngine";

type RingMesh = THREE.Mesh<
  THREE.RingGeometry,
  THREE.MeshBasicMaterial
>;

type CylinderMesh = THREE.Mesh<
  THREE.CylinderGeometry,
  THREE.MeshBasicMaterial
>;

export type ArPinModel = {
  group: THREE.Group;
  pinGroup: THREE.Group;
  pinBody: THREE.Group;
  symbol: THREE.Group;
  groundPulse: RingMesh;
  pulseEnabled: boolean;
  missionBeacon: {
    beam: CylinderMesh;
    core: CylinderMesh;
  } | null;
  state: PlaceMarkerState;
};

function createPinShape(): THREE.Shape {
  const shape = new THREE.Shape();

  // Silueta de gota deliberadamente redondeada: hombros anchos,
  // transición continua y una punta suave que toca el punto real.
  shape.moveTo(0, 0);
  shape.bezierCurveTo(
    -0.36,
    0.76,
    -1.62,
    2.48,
    -2.2,
    3.62
  );
  shape.bezierCurveTo(
    -2.92,
    5.02,
    -2.4,
    6.27,
    -1.42,
    6.86
  );
  shape.bezierCurveTo(
    -0.62,
    7.34,
    0.62,
    7.34,
    1.42,
    6.86
  );
  shape.bezierCurveTo(
    2.4,
    6.27,
    2.92,
    5.02,
    2.2,
    3.62
  );
  shape.bezierCurveTo(
    1.62,
    2.48,
    0.36,
    0.76,
    0,
    0
  );
  shape.closePath();

  const hole = new THREE.Path();
  hole.absellipse(
    0,
    AR_PIN_HOLE_CENTER_Y_METERS,
    1.08,
    1.08,
    0,
    Math.PI * 2,
    false
  );
  shape.holes.push(hole);

  return shape;
}

function normalizePinGeometry(
  geometry: THREE.ExtrudeGeometry
): number {
  geometry.computeBoundingBox();

  const bounds = geometry.boundingBox;

  if (!bounds) {
    return AR_PIN_HOLE_CENTER_Y_METERS;
  }

  const sourceHeight =
    bounds.max.y - bounds.min.y;
  const scale =
    AR_PIN_HEIGHT_METERS /
    sourceHeight;

  geometry.translate(
    0,
    -bounds.min.y,
    -0.38
  );
  geometry.scale(scale, scale, scale);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  return (
    AR_PIN_HOLE_CENTER_Y_METERS -
    bounds.min.y
  ) * scale;
}

function createPinBody(
  color: string,
  haloColor: string
): {
  group: THREE.Group;
  holeCenterY: number;
} {
  const group = new THREE.Group();
  group.name = "rounded-map-pin";

  const geometry =
    new THREE.ExtrudeGeometry(
      createPinShape(),
      {
        depth: 0.76,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: 0.16,
        bevelThickness: 0.16,
        curveSegments: 40,
      }
    );

  const holeCenterY =
    normalizePinGeometry(geometry);

  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
    })
  );
  body.name = "rounded-map-pin-body";
  body.castShadow = false;
  body.receiveShadow = false;
  group.add(body);

  // Un aro fino sigue la misma rotación que la gota y revela su grosor
  // cuando la silueta se pone de perfil.
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(
      1.07,
      0.075,
      12,
      64
    ),
    new THREE.MeshStandardMaterial({
      color: haloColor,
      emissive: haloColor,
      emissiveIntensity: 0.56,
      metalness: 0.24,
      roughness: 0.22,
    })
  );
  rim.name = "pin-hole-rim";
  rim.position.set(
    0,
    holeCenterY,
    0
  );
  group.add(rim);

  return {
    group,
    holeCenterY,
  };
}

function createSolidMaterial(
  color: string
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.66,
    metalness: 0.34,
    roughness: 0.18,
    clearcoat: 0.78,
    clearcoatRoughness: 0.16,
  });
}

function createLetterH(
  color: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = "pin-symbol-H";
  const material =
    createSolidMaterial(color);

  const addBar = (
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        0.46,
        2,
        4,
        2
      ),
      material
    );

    bar.position.set(x, y, 0);
    group.add(bar);
  };

  addBar(0.28, 1.66, -0.48, 0);
  addBar(0.28, 1.66, 0.48, 0);
  addBar(1.18, 0.27, 0, 0);

  return group;
}

function createStarGlyph(
  color: string
): THREE.Group {
  const shape = new THREE.Shape();
  const outerRadius = 0.82;
  const innerRadius = 0.34;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    const angle =
      Math.PI / 2 +
      index * Math.PI / 4;
    const radius =
      index % 2 === 0
        ? outerRadius
        : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();

  const geometry =
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.42,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    });
  geometry.translate(0, 0, -0.21);
  geometry.computeVertexNormals();

  const group = new THREE.Group();
  group.name = "pin-symbol-star";
  group.add(
    new THREE.Mesh(
      geometry,
      createSolidMaterial(color)
    )
  );

  return group;
}

function createCenteredSymbol(
  symbol: string,
  color: string,
  holeCenterY: number
): THREE.Group {
  const group =
    symbol === "H"
      ? createLetterH(color)
      : createStarGlyph(color);

  group.position.set(
    0,
    holeCenterY,
    0
  );

  return group;
}

function createGroundPulse(
  color: string
): RingMesh {
  const ring: RingMesh = new THREE.Mesh(
    new THREE.RingGeometry(
      0.72,
      0.94,
      64
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );

  ring.name = "single-ground-pulse";
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  ring.renderOrder = 3;

  return ring;
}

function createMissionBeacon(
  color: string
) {
  const beamMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const beam: CylinderMesh =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.16,
        0.16,
        AR_MISSION_BEACON_HEIGHT_METERS,
        20,
        1,
        true
      ),
      beamMaterial
    );
  beam.name = "mission-beacon-halo";
  beam.position.set(
    0,
    AR_MISSION_BEACON_CENTER_Y_METERS,
    0
  );
  beam.renderOrder = 1;

  const coreMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.82,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

  const core: CylinderMesh =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.045,
        0.045,
        AR_MISSION_BEACON_HEIGHT_METERS,
        10
      ),
      coreMaterial
    );
  core.name = "mission-beacon-core";
  core.position.copy(beam.position);
  core.renderOrder = 2;

  return {
    beam,
    core,
  };
}

export function createArPinModel(
  experience: Experience,
  state: PlaceMarkerState
): ArPinModel {
  const visual =
    getPlaceMarkerVisual(state);

  const group = new THREE.Group();
  group.name =
    `iguide-ar-pin:${experience.experienceId}`;

  const pinGroup = new THREE.Group();
  pinGroup.name =
    `iguide-ar-map-pin:${experience.experienceId}`;

  const pinBodyResult = createPinBody(
    visual.color,
    visual.haloColor
  );
  const pinBody = pinBodyResult.group;
  const symbol = createCenteredSymbol(
    getExperienceMarkerSymbol(
      experience
    ),
    visual.haloColor,
    pinBodyResult.holeCenterY
  );

  pinGroup.add(pinBody, symbol);

  const groundPulse =
    createGroundPulse(
      visual.haloColor
    );

  const missionBeacon =
    state === "mission"
      ? createMissionBeacon(
          visual.color
        )
      : null;

  // Faro primero: el pin opaco escribe profundidad y lo interrumpe en
  // el cuerpo, mientras el rayo continúa visible por el hueco central.
  if (missionBeacon) {
    group.add(
      missionBeacon.beam,
      missionBeacon.core
    );
  }

  group.add(groundPulse, pinGroup);
  group.userData.experienceId =
    experience.experienceId;

  return {
    group,
    pinGroup,
    pinBody,
    symbol,
    groundPulse,
    pulseEnabled: visual.pulses,
    missionBeacon,
    state,
  };
}

export function updateArPinModel(
  model: ArPinModel,
  elapsedSeconds: number,
  reducedMotion: boolean,
  selected: boolean,
  distanceMeters: number
) {
  const selectedScale =
    selected ? 1.08 : 1;

  model.pinGroup.scale.setScalar(
    selectedScale
  );

  const rotation =
    getArPinRotationState(
      elapsedSeconds,
      reducedMotion
    );

  model.pinBody.rotation.y =
    rotation.bodyRotationY;
  model.symbol.rotation.y =
    rotation.symbolRotationY;

  if (model.pulseEnabled) {
    const progress = reducedMotion
      ? 0.2
      : (elapsedSeconds * 0.52) % 1;

    model.groundPulse.scale.setScalar(
      0.9 + progress * 1.85
    );
    model.groundPulse.material.opacity =
      reducedMotion
        ? 0.5
        : 0.82 * (1 - progress);
  } else {
    model.groundPulse.scale.setScalar(1);
    model.groundPulse.material.opacity =
      0.28;
  }

  if (!model.missionBeacon) return;

  const distanceEmphasis =
    THREE.MathUtils.clamp(
      distanceMeters / 20,
      0.68,
      1
    );
  const beaconWave = reducedMotion
    ? 0.5
    : (
        Math.sin(
          elapsedSeconds * 2.25
        ) + 1
      ) / 2;

  model.missionBeacon.beam.material.opacity =
    distanceEmphasis *
    (0.18 + beaconWave * 0.12);
  model.missionBeacon.core.material.opacity =
    distanceEmphasis *
    (0.68 + beaconWave * 0.22);
}

export function disposeArPinModel(
  model: ArPinModel
) {
  const disposedTextures =
    new Set<THREE.Texture>();
  const disposedMaterials =
    new Set<THREE.Material>();
  const disposedGeometries =
    new Set<THREE.BufferGeometry>();

  model.group.traverse((object) => {
    if (
      !(object instanceof THREE.Mesh) &&
      !(object instanceof THREE.LineSegments)
    ) {
      return;
    }

    if (
      object.geometry &&
      !disposedGeometries.has(
        object.geometry
      )
    ) {
      object.geometry.dispose();
      disposedGeometries.add(
        object.geometry
      );
    }

    const materials = Array.isArray(
      object.material
    )
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      if (disposedMaterials.has(material)) {
        return;
      }

      if (
        "map" in material &&
        material.map instanceof
          THREE.Texture &&
        !disposedTextures.has(
          material.map
        )
      ) {
        material.map.dispose();
        disposedTextures.add(
          material.map
        );
      }

      material.dispose();
      disposedMaterials.add(material);
    });
  });
}
