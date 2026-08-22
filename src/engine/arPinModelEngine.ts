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

export const AR_PIN_HEIGHT_METERS = 7;

export const AR_MISSION_BEACON_HEIGHT_METERS =
  160;

const AR_MISSION_BEACON_APPROACH_DISTANCE_METERS =
  20;

const AR_PIN_SCALE =
  AR_PIN_HEIGHT_METERS / 3;

function scaled(
  value: number
): number {
  return value * AR_PIN_SCALE;
}

export type ArPinModel = {
  group: THREE.Group;
  pinGroup: THREE.Group;
  pulseRings: THREE.Mesh<
    THREE.RingGeometry,
    THREE.MeshBasicMaterial
  >[];
  missionBeacon: {
    beam: THREE.Mesh<
      THREE.CylinderGeometry,
      THREE.MeshBasicMaterial
    >;
    core: THREE.Mesh<
      THREE.CylinderGeometry,
      THREE.MeshBasicMaterial
    >;
    risingRings: THREE.Mesh<
      THREE.RingGeometry,
      THREE.MeshBasicMaterial
    >[];
  } | null;
  state: PlaceMarkerState;
};

function createMissionBeacon(
  color: string,
  haloColor: string
) {
  const beamMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.34,
      0.46,
      AR_MISSION_BEACON_HEIGHT_METERS,
      16,
      1,
      true
    ),
    beamMaterial
  );

  beam.position.y =
    AR_MISSION_BEACON_HEIGHT_METERS /
    2;
  beam.renderOrder = 2;

  const coreMaterial =
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.46,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.065,
      0.11,
      AR_MISSION_BEACON_HEIGHT_METERS,
      12
    ),
    coreMaterial
  );

  core.position.y =
    AR_MISSION_BEACON_HEIGHT_METERS /
    2;
  core.renderOrder = 3;

  const risingRings = [
    0,
    0.34,
    0.68,
  ].map((phase) => {
    const material =
      new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: 0.72,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(
        0.82,
        1.02,
        48
      ),
      material
    );

    ring.rotation.x = -Math.PI / 2;
    ring.userData.phase = phase;
    ring.renderOrder = 4;

    return ring;
  });

  return {
    beam,
    core,
    risingRings,
  };
}

function createPinShape(): THREE.Shape {
  const shape = new THREE.Shape();

  shape.moveTo(0, 0);
  shape.bezierCurveTo(
    scaled(-0.16),
    scaled(0.42),
    scaled(-0.72),
    scaled(1.12),
    scaled(-0.8),
    scaled(2.03)
  );
  shape.bezierCurveTo(
    scaled(-0.86),
    scaled(2.58),
    scaled(-0.5),
    AR_PIN_HEIGHT_METERS,
    0,
    AR_PIN_HEIGHT_METERS
  );
  shape.bezierCurveTo(
    scaled(0.5),
    AR_PIN_HEIGHT_METERS,
    scaled(0.86),
    scaled(2.58),
    scaled(0.8),
    scaled(2.03)
  );
  shape.bezierCurveTo(
    scaled(0.72),
    scaled(1.12),
    scaled(0.16),
    scaled(0.42),
    0,
    0
  );

  const centerHole = new THREE.Path();
  centerHole.absellipse(
    0,
    scaled(2.22),
    scaled(0.39),
    scaled(0.39),
    0,
    Math.PI * 2,
    true
  );

  shape.holes.push(centerHole);

  return shape;
}

function createSymbolTexture(
  symbol: string
): THREE.CanvasTexture {
  const canvas =
    document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 256;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(
      canvas
    );
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.shadowColor =
    "rgba(255,255,255,0.95)";
  context.shadowBlur = 18;
  context.fillStyle = "#FFFFFF";
  context.font =
    symbol === "H"
      ? "900 150px system-ui"
      : "900 170px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(symbol, 128, 133);

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
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
    `iguide-ar-pin-visual:${experience.experienceId}`;
  group.add(pinGroup);

  const geometry =
    new THREE.ExtrudeGeometry(
      createPinShape(),
      {
        depth: scaled(0.24),
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: scaled(0.07),
        bevelThickness: scaled(0.07),
        curveSegments: 42,
      }
    );

  geometry.translate(
    0,
    0,
    scaled(-0.12)
  );
  geometry.computeVertexNormals();

  const material =
    new THREE.MeshStandardMaterial({
      color: visual.color,
      emissive: visual.color,
      emissiveIntensity: 0.68,
      metalness: 0.28,
      roughness: 0.2,
      transparent: true,
      opacity: 0.94,
    });

  const body =
    new THREE.Mesh(
      geometry,
      material
    );

  body.castShadow = false;
  body.receiveShadow = false;
  pinGroup.add(body);

  const symbolTexture =
    createSymbolTexture(
      getExperienceMarkerSymbol(
        experience
      )
    );

  const symbolMaterial =
    new THREE.SpriteMaterial({
      map: symbolTexture,
      color: visual.symbolColor,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

  const symbol =
    new THREE.Sprite(symbolMaterial);

  symbol.position.set(
    0,
    scaled(2.22),
    scaled(0.16)
  );
  symbol.scale.set(
    scaled(0.52),
    scaled(0.52),
    1
  );
  symbol.renderOrder = 4;
  pinGroup.add(symbol);

  const pulseRings = visual.pulses
    ? [0, 0.52].map((phase, index) => {
        const ringMaterial =
          new THREE.MeshBasicMaterial({
            color: visual.haloColor,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            side: THREE.DoubleSide,
          });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(
            scaled(0.82),
            scaled(0.88),
            64
          ),
          ringMaterial
        );

        ring.position.set(
          0,
          scaled(2.15),
          scaled(
            -0.16 - index * 0.01
          )
        );
        ring.userData.phase = phase;
        ring.renderOrder = 1;
        pinGroup.add(ring);

        return ring;
      })
    : [];

  const missionBeacon =
    state === "mission"
      ? createMissionBeacon(
          visual.color,
          visual.haloColor
        )
      : null;

  if (missionBeacon) {
    group.add(
      missionBeacon.beam,
      missionBeacon.core,
      ...missionBeacon.risingRings
    );
  }

  group.userData.experienceId =
    experience.experienceId;

  return {
    group,
    pinGroup,
    pulseRings,
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
  const visual =
    getPlaceMarkerVisual(model.state);

  const jump =
    visual.bounces && !reducedMotion
      ? Math.max(
          0,
          Math.sin(
            elapsedSeconds *
            Math.PI * 1.3
          )
        ) * scaled(0.24)
      : 0;

  model.pinGroup.position.y = jump;

  const selectedScale =
    selected ? 1.08 : 1;

  const heartbeat =
    model.state === "mission" &&
    !reducedMotion
      ? 1 +
        Math.max(
          0,
          Math.sin(
            elapsedSeconds *
            Math.PI * 2.2
          )
        ) ** 6 *
          0.075
      : 1;

  model.pinGroup.scale.setScalar(
    selectedScale * heartbeat
  );

  model.pulseRings.forEach(
    (ring) => {
      const phase =
        Number(ring.userData.phase) ||
        0;

      const progress =
        reducedMotion
          ? 0.15
          : (
              elapsedSeconds * 0.58 +
              phase
            ) % 1;

      const scale =
        0.82 + progress * 0.72;

      ring.scale.setScalar(scale);
      ring.material.opacity =
        0.72 * (1 - progress);
    }
  );

  if (!model.missionBeacon) {
    return;
  }

  const heightFactor =
    distanceMeters <
    AR_MISSION_BEACON_APPROACH_DISTANCE_METERS
      ? Math.max(
          0.18,
          distanceMeters /
            AR_MISSION_BEACON_APPROACH_DISTANCE_METERS
        )
      : 1;

  const beaconHeight =
    AR_MISSION_BEACON_HEIGHT_METERS *
    heightFactor;

  const beaconWave = reducedMotion
    ? 0.5
    : (
        Math.sin(
          elapsedSeconds * 2.7
        ) + 1
      ) / 2;

  model.missionBeacon.beam.scale.y =
    heightFactor;
  model.missionBeacon.beam.position.y =
    beaconHeight / 2;
  model.missionBeacon.beam.material.opacity =
    0.12 + beaconWave * 0.1;

  model.missionBeacon.core.scale.y =
    heightFactor;
  model.missionBeacon.core.position.y =
    beaconHeight / 2;
  model.missionBeacon.core.material.opacity =
    0.34 + beaconWave * 0.2;

  const riseSpeed =
    distanceMeters <
    AR_MISSION_BEACON_APPROACH_DISTANCE_METERS
      ? 0.86
      : 0.44;

  model.missionBeacon.risingRings.forEach(
    (ring) => {
      const phase =
        Number(ring.userData.phase) ||
        0;

      const progress = reducedMotion
        ? phase
        : (
            elapsedSeconds *
              riseSpeed +
            phase
          ) % 1;

      ring.position.y =
        Math.max(
          0.24,
          beaconHeight * progress
        );
      ring.scale.setScalar(
        0.82 + progress * 1.4
      );
      ring.material.opacity =
        reducedMotion
          ? 0.28
          : 0.74 * (1 - progress);
    }
  );
}

export function disposeArPinModel(
  model: ArPinModel
) {
  model.group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) &&
        !(object instanceof THREE.Sprite)) {
      return;
    }

    const renderable = object as
      | THREE.Mesh
      | THREE.Sprite;

    if (
      "geometry" in renderable &&
      renderable.geometry
    ) {
      renderable.geometry.dispose();
    }

    const materials = Array.isArray(
      renderable.material
    )
      ? renderable.material
      : [renderable.material];

    materials.forEach((material) => {
      if (
        material instanceof
        THREE.SpriteMaterial
      ) {
        material.map?.dispose();
      }

      material.dispose();
    });
  });
}
