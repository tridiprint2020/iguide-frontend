import {
  useEffect,
  useRef,
} from "react";

import * as THREE from "three";

import {
  createArPinModel,
  disposeArPinModel,
  AR_PIN_HEIGHT_METERS,
  updateArPinModel,
} from "../../engine/arPinModelEngine";

import {
  formatArDistance,
} from "../../engine/arGeoEngine";

import type {
  ArPinModel,
} from "../../engine/arPinModelEngine";

import type {
  ArGeoPlacement,
} from "../../types/ar";

import type {
  PlaceMarkerState,
} from "../../engine/placeMarkerVisualEngine";

type ArPinSceneProps = {
  placements: ArGeoPlacement[];
  markerStates: ReadonlyMap<
    string,
    PlaceMarkerState
  >;
  selectedExperienceId: string | null;
  onSelect: (
    placement: ArGeoPlacement
  ) => void;
};

type SceneModel = ArPinModel & {
  placement: ArGeoPlacement;
  targetPosition: THREE.Vector3;
  targetRotationY: number;
};

const POSITION_DAMPING = 0.08;
const MISSION_BEACON_RENDER_DISTANCE_METERS =
  72;

function getWorldCoordinates(
  placement: ArGeoPlacement,
  state: PlaceMarkerState
) {
  const angle =
    placement.relativeBearingDegrees *
    Math.PI / 180;

  const distance =
    state === "mission"
      ? Math.max(
          2.5,
          Math.min(
            placement.distanceMeters,
            MISSION_BEACON_RENDER_DISTANCE_METERS
          )
        )
      : Math.max(
          2.5,
          placement.distanceMeters
        );

  return {
    x: Math.sin(angle) * distance,
    z: -Math.cos(angle) * distance,
  };
}

export function ArPinScene({
  placements,
  markerStates,
  selectedExperienceId,
  onSelect,
}: ArPinSceneProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(
      null
    );

  const sceneRef =
    useRef<THREE.Scene | null>(null);

  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(
      null
    );

  const modelsRef =
    useRef<Map<string, SceneModel>>(
      new Map()
    );

  const labelRefs =
    useRef<Map<string, HTMLButtonElement>>(
      new Map()
    );

  const selectedIdRef =
    useRef<string | null>(
      selectedExperienceId
    );

  useEffect(() => {
    selectedIdRef.current =
      selectedExperienceId;
  }, [selectedExperienceId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container =
      containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const renderer =
      new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference:
          "high-performance",
      });

    const models =
      modelsRef.current;

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );
    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const camera =
      new THREE.PerspectiveCamera(
        62,
        1,
        0.1,
        1000
      );

    camera.position.set(0, 1.65, 0);
    camera.lookAt(0, 1.65, -1);

    scene.add(
      new THREE.HemisphereLight(
        0xffffff,
        0x101020,
        2.2
      )
    );

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2.4
      );

    directionalLight.position.set(
      -2,
      5,
      4
    );
    scene.add(directionalLight);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    const resize = () => {
      const width =
        container.clientWidth;
      const height =
        container.clientHeight;

      if (width <= 0 || height <= 0) {
        return;
      }

      renderer.setSize(
        width,
        height,
        false
      );
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(container);

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const clock = new THREE.Clock();
    const labelAnchor =
      new THREE.Vector3();

    let animationFrame = 0;

    const render = () => {
      const elapsed =
        clock.getElapsedTime();

      models.forEach(
        (model, experienceId) => {
          model.group.position.x +=
            (model.targetPosition.x -
              model.group.position.x) *
            POSITION_DAMPING;
          model.group.position.z +=
            (model.targetPosition.z -
              model.group.position.z) *
            POSITION_DAMPING;

          const rotationDifference =
            Math.atan2(
              Math.sin(
                model.targetRotationY -
                  model.group.rotation.y
              ),
              Math.cos(
                model.targetRotationY -
                  model.group.rotation.y
              )
            );

          model.group.rotation.y +=
            rotationDifference *
            POSITION_DAMPING;

          updateArPinModel(
            model,
            elapsed,
            reducedMotion,
            selectedIdRef.current ===
              experienceId,
            model.placement
              .distanceMeters
          );

          const label =
            labelRefs.current.get(
              experienceId
            );

          if (!label) return;

          labelAnchor.set(
            model.group.position.x,
            model.group.position.y +
              AR_PIN_HEIGHT_METERS +
              0.34,
            model.group.position.z
          );
          labelAnchor.project(camera);

          const visible =
            labelAnchor.z >= -1 &&
            labelAnchor.z <= 1 &&
            Math.abs(labelAnchor.x) <= 1.08 &&
            Math.abs(labelAnchor.y) <= 1.08 &&
            model.group.position.z < 0;

          if (!visible) {
            label.style.opacity = "0";
            label.style.pointerEvents =
              "none";
            return;
          }

          const x =
            (labelAnchor.x * 0.5 + 0.5) *
            container.clientWidth;
          const y =
            (-labelAnchor.y * 0.5 + 0.5) *
            container.clientHeight;

          label.style.opacity = "1";
          label.style.pointerEvents =
            "auto";
          label.style.transform =
            `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        }
      );

      renderer.render(scene, camera);
      animationFrame =
        requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
      resizeObserver.disconnect();

      models.forEach(
        (model) =>
          disposeArPinModel(model)
      );
      models.clear();

      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) return;

    const currentIds = new Set(
      placements.map(
        (placement) =>
          placement.experience
            .experienceId
      )
    );

    modelsRef.current.forEach(
      (model, experienceId) => {
        if (currentIds.has(experienceId)) {
          return;
        }

        scene.remove(model.group);
        disposeArPinModel(model);
        modelsRef.current.delete(
          experienceId
        );
      }
    );

    placements.forEach((placement) => {
      const experienceId =
        placement.experience
          .experienceId;

      const state =
        markerStates.get(
          experienceId
        ) ?? "catalog";

      const previous =
        modelsRef.current.get(
          experienceId
        );

      let model: SceneModel;
      let modelWasCreated = false;

      if (
        previous &&
        previous.state === state
      ) {
        model = previous;
        model.placement = placement;
      } else {
        if (previous) {
          scene.remove(previous.group);
          disposeArPinModel(previous);
        }

        model = {
          ...createArPinModel(
            placement.experience,
            state
          ),
          placement,
          targetPosition:
            new THREE.Vector3(),
          targetRotationY: 0,
        };
        modelWasCreated = true;
        scene.add(model.group);
        modelsRef.current.set(
          experienceId,
          model
        );
      }

      const world =
        getWorldCoordinates(
          placement,
          state
        );

      model.targetPosition.set(
        world.x,
        0,
        world.z
      );

      model.targetRotationY =
        Math.atan2(
          -world.x,
          -world.z
        );

      if (modelWasCreated) {
        model.group.position.set(
          world.x,
          0,
          world.z
        );
        model.group.rotation.y =
          model.targetRotationY;
      }

    });
  }, [markerStates, placements]);

  return (
    <div
      ref={containerRef}
      aria-label="Pines tridimensionales I.GUIDE"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {placements.map((placement) => (
        <button
          key={
            placement.experience
              .experienceId
          }
          ref={(element) => {
            const experienceId =
              placement.experience
                .experienceId;

            if (element) {
              labelRefs.current.set(
                experienceId,
                element
              );
            } else {
              labelRefs.current.delete(
                experienceId
              );
            }
          }}
          type="button"
          onClick={() =>
            onSelect(placement)
          }
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 7,
            maxWidth: "180px",
            padding: "7px 9px",
            borderRadius: "11px",
            border:
              selectedExperienceId ===
              placement.experience
                .experienceId
                ? "1px solid rgba(255,255,255,0.72)"
                : "1px solid rgba(57,231,255,0.32)",
            background:
              "rgba(7,8,17,0.82)",
            boxShadow:
              "0 0 17px rgba(0,230,255,0.16)",
            color: "#FFFFFF",
            cursor: "pointer",
            opacity: 0,
            transition:
              "opacity 100ms linear, border-color 160ms ease",
          }}
        >
          <strong
            style={{
              display: "block",
              overflow: "hidden",
              fontSize: "11px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {placement.experience.title}
          </strong>
          <span
            style={{
              display: "block",
              marginTop: "2px",
              color: "#39E7FF",
              fontSize: "10px",
              fontWeight: 800,
            }}
          >
            {formatArDistance(
              placement.distanceMeters
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
