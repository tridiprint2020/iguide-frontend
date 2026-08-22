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

const AR_PIN_SCALE =
  AR_PIN_HEIGHT_METERS / 3;

function scaled(
  value: number
): number {
  return value * AR_PIN_SCALE;
}

export type ArPinModel = {
  group: THREE.Group;
  pulseRings: THREE.Mesh<
    THREE.RingGeometry,
    THREE.MeshBasicMaterial
  >[];
  state: PlaceMarkerState;
};

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
  group.add(body);

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
  group.add(symbol);

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
        group.add(ring);

        return ring;
      })
    : [];

  group.userData.experienceId =
    experience.experienceId;

  return {
    group,
    pulseRings,
    state,
  };
}

export function updateArPinModel(
  model: ArPinModel,
  elapsedSeconds: number,
  reducedMotion: boolean,
  selected: boolean
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

  model.group.position.y = jump;

  const selectedScale =
    selected ? 1.08 : 1;

  model.group.scale.setScalar(
    selectedScale
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
