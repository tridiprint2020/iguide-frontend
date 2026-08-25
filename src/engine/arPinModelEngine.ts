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
  energyCore: THREE.Mesh;
  outerShell: THREE.Mesh;
  symbolOrbit: THREE.Group;
  orbitalBands: THREE.Mesh[];
  pulseRings: RingMesh[];
  missionBeacon: {
    beam: CylinderMesh;
    core: CylinderMesh;
    impact: THREE.Mesh<
      THREE.CircleGeometry,
      THREE.MeshBasicMaterial
    >;
    risingRings: RingMesh[];
  } | null;
  state: PlaceMarkerState;
};

function createBeamTexture(): THREE.CanvasTexture {
  const canvas =
    document.createElement("canvas");

  canvas.width = 8;
  canvas.height = 256;

  const context =
    canvas.getContext("2d");

  if (context) {
    const gradient =
      context.createLinearGradient(
        0,
        canvas.height,
        0,
        0
      );

    gradient.addColorStop(
      0,
      "rgba(255,255,255,0.96)"
    );
    gradient.addColorStop(
      0.12,
      "rgba(255,255,255,0.72)"
    );
    gradient.addColorStop(
      0.64,
      "rgba(255,255,255,0.20)"
    );
    gradient.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    context.fillStyle = gradient;
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.minFilter =
    THREE.LinearFilter;
  texture.magFilter =
    THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function createMissionBeacon(
  color: string,
  haloColor: string
) {
  const beamMaterial =
    new THREE.MeshBasicMaterial({
      color,
      map: createBeamTexture(),
      transparent: true,
      opacity: 0.34,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const beam: CylinderMesh =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.32,
        0.62,
        AR_MISSION_BEACON_HEIGHT_METERS,
        20,
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
      opacity: 0.68,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

  const core: CylinderMesh =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.07,
        0.16,
        AR_MISSION_BEACON_HEIGHT_METERS,
        12
      ),
      coreMaterial
    );

  core.position.y =
    AR_MISSION_BEACON_HEIGHT_METERS /
    2;
  core.renderOrder = 3;

  const impactMaterial =
    new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: 0.62,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

  const impact = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 64),
    impactMaterial
  );

  impact.rotation.x = -Math.PI / 2;
  impact.position.y = 0.025;
  impact.renderOrder = 4;

  const risingRings = [
    0,
    0.28,
    0.56,
    0.84,
  ].map((phase) => {
    const material =
      new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: 0.78,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

    const ring: RingMesh =
      new THREE.Mesh(
        new THREE.RingGeometry(
          2.05,
          2.38,
          64
        ),
        material
      );

    ring.rotation.x = -Math.PI / 2;
    ring.userData.phase = phase;
    ring.renderOrder = 5;

    return ring;
  });

  return {
    beam,
    core,
    impact,
    risingRings,
  };
}

function createStandardMaterial(
  color: string,
  options: {
    opacity?: number;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    wireframe?: boolean;
  } = {}
): THREE.MeshStandardMaterial {
  const opacity = options.opacity ?? 1;

  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity:
      options.emissiveIntensity ?? 0.36,
    metalness:
      options.metalness ?? 0.34,
    roughness:
      options.roughness ?? 0.28,
    transparent: opacity < 1,
    opacity,
    wireframe:
      options.wireframe ?? false,
    depthWrite: opacity >= 0.7,
  });
}

function createLetterH(
  color: string
): THREE.Group {
  const group = new THREE.Group();
  const material =
    createStandardMaterial(color, {
      emissiveIntensity: 0.54,
      metalness: 0.46,
      roughness: 0.2,
    });

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
        0.18
      ),
      material
    );

    bar.position.set(x, y, 0);
    group.add(bar);
  };

  addBar(0.15, 0.78, -0.25, 0);
  addBar(0.15, 0.78, 0.25, 0);
  addBar(0.56, 0.14, 0, 0);

  return group;
}

function createStarGlyph(
  color: string
): THREE.Group {
  const shape = new THREE.Shape();
  const outerRadius = 0.42;
  const innerRadius = 0.18;

  for (let index = 0; index < 8; index += 1) {
    const angle =
      Math.PI / 2 + index * Math.PI / 4;
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
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.035,
      bevelThickness: 0.035,
    });

  geometry.translate(0, 0, -0.09);
  geometry.computeVertexNormals();

  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      geometry,
      createStandardMaterial(color, {
        emissiveIntensity: 0.54,
        metalness: 0.42,
        roughness: 0.2,
      })
    )
  );

  return group;
}

function createSymbolOrbit(
  symbol: string,
  color: string
): THREE.Group {
  const orbit = new THREE.Group();
  const radius = 1.34;

  for (let index = 0; index < 4; index += 1) {
    const angle =
      index * Math.PI / 2;
    const glyph =
      symbol === "H"
        ? createLetterH(color)
        : createStarGlyph(color);

    glyph.position.set(
      Math.sin(angle) * radius,
      0,
      Math.cos(angle) * radius
    );
    glyph.rotation.y = angle;
    orbit.add(glyph);
  }

  orbit.position.y = 5.05;

  return orbit;
}

function createGroundRing(
  color: string,
  innerRadius: number,
  outerRadius: number,
  opacity: number
): RingMesh {
  const ring: RingMesh =
    new THREE.Mesh(
      new THREE.RingGeometry(
        innerRadius,
        outerRadius,
        64
      ),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );

  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;

  return ring;
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
    `iguide-ar-totem:${experience.experienceId}`;
  group.add(pinGroup);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.18,
      1.42,
      0.2,
      48
    ),
    createStandardMaterial(
      visual.color,
      {
        emissiveIntensity: 0.22,
        metalness: 0.62,
        roughness: 0.32,
      }
    )
  );
  pedestal.position.y = 0.1;
  pinGroup.add(pedestal);

  const stemShell = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.34,
      0.62,
      4.35,
      24,
      1,
      true
    ),
    createStandardMaterial(
      visual.color,
      {
        opacity: 0.34,
        emissiveIntensity: 0.44,
        metalness: 0.2,
        roughness: 0.18,
      }
    )
  );
  stemShell.position.y = 2.38;
  pinGroup.add(stemShell);

  const stemCore = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.11,
      0.24,
      4.55,
      16
    ),
    createStandardMaterial(
      visual.haloColor,
      {
        opacity: 0.88,
        emissiveIntensity: 0.86,
        metalness: 0.14,
        roughness: 0.16,
      }
    )
  );
  stemCore.position.y = 2.48;
  pinGroup.add(stemCore);

  const energyCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(
      0.66,
      1
    ),
    createStandardMaterial(
      visual.haloColor,
      {
        opacity: 0.92,
        emissiveIntensity: 0.92,
        metalness: 0.32,
        roughness: 0.12,
      }
    )
  );
  energyCore.position.y = 5.05;
  pinGroup.add(energyCore);

  const outerShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(
      0.92,
      2
    ),
    createStandardMaterial(
      visual.color,
      {
        opacity: 0.34,
        emissiveIntensity: 0.5,
        metalness: 0.18,
        roughness: 0.2,
        wireframe: true,
      }
    )
  );
  outerShell.position.y = 5.05;
  outerShell.renderOrder = 2;
  pinGroup.add(outerShell);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(
      0.48,
      1.72,
      24
    ),
    createStandardMaterial(
      visual.color,
      {
        emissiveIntensity: 0.46,
        metalness: 0.54,
        roughness: 0.22,
      }
    )
  );
  spire.position.y = 6.14;
  pinGroup.add(spire);

  const symbolOrbit =
    createSymbolOrbit(
      getExperienceMarkerSymbol(
        experience
      ),
      visual.symbolColor
    );
  pinGroup.add(symbolOrbit);

  const orbitalBands = [
    {
      radius: 1.04,
      tube: 0.045,
      rotationX: Math.PI / 2,
      rotationZ: 0,
    },
    {
      radius: 1.14,
      tube: 0.035,
      rotationX: Math.PI / 2.8,
      rotationZ: Math.PI / 4,
    },
  ].map((definition) => {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(
        definition.radius,
        definition.tube,
        10,
        72
      ),
      createStandardMaterial(
        visual.haloColor,
        {
          opacity: 0.78,
          emissiveIntensity: 0.72,
          metalness: 0.28,
          roughness: 0.14,
        }
      )
    );

    band.position.y = 5.05;
    band.rotation.x =
      definition.rotationX;
    band.rotation.z =
      definition.rotationZ;
    pinGroup.add(band);

    return band;
  });

  const contactRing = createGroundRing(
    visual.haloColor,
    1.34,
    1.48,
    0.66
  );
  contactRing.renderOrder = 1;
  group.add(contactRing);

  const pulseRings = visual.pulses
    ? [0, 0.34, 0.68].map(
        (phase, index) => {
          const ring = createGroundRing(
            visual.haloColor,
            1.52,
            1.7,
            0.82
          );

          ring.position.y =
            0.045 + index * 0.006;
          ring.userData.phase = phase;
          ring.renderOrder = 3;
          group.add(ring);

          return ring;
        }
      )
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
      missionBeacon.impact,
      ...missionBeacon.risingRings
    );
  }

  group.userData.experienceId =
    experience.experienceId;

  return {
    group,
    pinGroup,
    energyCore,
    outerShell,
    symbolOrbit,
    orbitalBands,
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
            Math.PI * 1.65
          )
        ) ** 5 * 0.12
      : 1;

  model.pinGroup.scale.setScalar(
    selectedScale * heartbeat
  );

  if (reducedMotion) {
    model.symbolOrbit.rotation.y =
      Math.PI / 7;
    model.energyCore.rotation.y =
      Math.PI / 5;
  } else {
    const orbitSpeed =
      model.state === "mission"
        ? 0.72
        : 0.42;

    model.symbolOrbit.rotation.y =
      elapsedSeconds * orbitSpeed;
    model.energyCore.rotation.y =
      -elapsedSeconds * 0.64;
    model.energyCore.rotation.x =
      elapsedSeconds * 0.18;
    model.outerShell.rotation.y =
      elapsedSeconds * 0.24;

    model.orbitalBands.forEach(
      (band, index) => {
        band.rotation.y =
          elapsedSeconds *
          (index === 0
            ? 0.22
            : -0.18);
      }
    );
  }

  model.pulseRings.forEach((ring) => {
    const phase =
      Number(ring.userData.phase) || 0;

    const progress = reducedMotion
      ? 0.16 + phase * 0.12
      : (
          elapsedSeconds * 0.46 +
          phase
        ) % 1;

    ring.scale.setScalar(
      0.82 + progress * 2.35
    );
    ring.material.opacity =
      reducedMotion
        ? 0.28
        : 0.86 * (1 - progress);
  });

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
          elapsedSeconds * 2.45
        ) + 1
      ) / 2;

  model.missionBeacon.beam.scale.y =
    heightFactor;
  model.missionBeacon.beam.position.y =
    beaconHeight / 2;
  model.missionBeacon.beam.material.opacity =
    0.27 + beaconWave * 0.18;

  model.missionBeacon.core.scale.y =
    heightFactor;
  model.missionBeacon.core.position.y =
    beaconHeight / 2;
  model.missionBeacon.core.material.opacity =
    0.54 + beaconWave * 0.26;

  model.missionBeacon.impact.scale.setScalar(
    0.92 + beaconWave * 0.34
  );
  model.missionBeacon.impact.material.opacity =
    0.46 + beaconWave * 0.3;

  const riseSpeed =
    distanceMeters <
    AR_MISSION_BEACON_APPROACH_DISTANCE_METERS
      ? 0.72
      : 0.34;

  model.missionBeacon.risingRings.forEach(
    (ring) => {
      const phase =
        Number(ring.userData.phase) || 0;

      const progress = reducedMotion
        ? phase * 0.22
        : (
            elapsedSeconds *
              riseSpeed +
            phase
          ) % 1;

      ring.position.y = Math.max(
        0.18,
        beaconHeight * progress
      );
      ring.scale.setScalar(
        0.88 + progress * 2.2
      );
      ring.material.opacity =
        reducedMotion
          ? 0.32
          : 0.82 * (1 - progress);
    }
  );
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
    if (!(object instanceof THREE.Mesh)) {
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
