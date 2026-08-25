import {
  forwardRef,
  useEffect,
  useImperativeHandle,
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
  projectArPlacementToWorld,
} from "../../engine/arGeoEngine";

import type {
  ArWorldCoordinates,
} from "../../engine/arGeoEngine";

import type {
  ArPinModel,
} from "../../engine/arPinModelEngine";

import type {
  ArGeoPlacement,
  ArQuaternion,
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
  viewQuaternion: ArQuaternion | null;
  calibrationRevision: number;
  viewerPosition: ArWorldCoordinates;
  onSelect: (
    placement: ArGeoPlacement
  ) => void;
};

export type ArCaptureLabel = {
  title: string;
  distanceText: string;
  xRatio: number;
  yRatio: number;
  mission: boolean;
};

export type ArPinSceneHandle = {
  getCanvas: () => HTMLCanvasElement | null;
  getCaptureLabels: () => ArCaptureLabel[];
  renderFrame: () => void;
};

type SceneModel = ArPinModel & {
  placement: ArGeoPlacement;
  targetPosition: THREE.Vector3;
};

const POSITION_DAMPING = 0.07;
const CAMERA_ROTATION_DAMPING = 0.2;
const CAMERA_POSITION_DAMPING = 0.08;
const AR_CAMERA_FAR_METERS = 20_000;
const MAX_CATALOG_LABELS = 3;

export const ArPinScene =
  forwardRef<
    ArPinSceneHandle,
    ArPinSceneProps
  >(function ArPinScene(
    {
      placements,
      markerStates,
      selectedExperienceId,
      viewQuaternion,
      calibrationRevision,
      viewerPosition,
      onSelect,
    },
    forwardedRef
  ) {
    const containerRef =
      useRef<HTMLDivElement | null>(null);

    const canvasRef =
      useRef<HTMLCanvasElement | null>(
        null
      );

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

    const targetCameraQuaternionRef =
      useRef(new THREE.Quaternion());

    const targetCameraPositionRef =
      useRef(
        new THREE.Vector3(
          viewerPosition.x,
          1.65,
          viewerPosition.z
        )
      );

    const calibrationRevisionRef =
      useRef(calibrationRevision);

    const modelsRef =
      useRef<Map<string, SceneModel>>(
        new Map()
      );

    const labelRefs =
      useRef<
        Map<string, HTMLButtonElement>
      >(new Map());

    const visibleLabelIdsRef =
      useRef<Set<string>>(new Set());

    const captureLabelsRef =
      useRef<Map<string, ArCaptureLabel>>(
        new Map()
      );

    const renderFrameRef =
      useRef<() => void>(() => undefined);

    const selectedIdRef =
      useRef<string | null>(
        selectedExperienceId
      );

    useImperativeHandle(
      forwardedRef,
      () => ({
        getCanvas: () => canvasRef.current,
        getCaptureLabels: () =>
          Array.from(
            captureLabelsRef.current.values()
          ),
        renderFrame: () =>
          renderFrameRef.current(),
      }),
      []
    );

    useEffect(() => {
      selectedIdRef.current =
        selectedExperienceId;
    }, [selectedExperienceId]);

    useEffect(() => {
      const visibleIds = new Set(
        placements
          .slice(0, MAX_CATALOG_LABELS)
          .map(
            (placement) =>
              placement.experience
                .experienceId
          )
      );

      placements.forEach((placement) => {
        const experienceId =
          placement.experience
            .experienceId;

        if (
          markerStates.get(experienceId) ===
            "mission" ||
          experienceId ===
            selectedExperienceId
        ) {
          visibleIds.add(experienceId);
        }
      });

      visibleLabelIdsRef.current =
        visibleIds;
    }, [
      markerStates,
      placements,
      selectedExperienceId,
    ]);

    useEffect(() => {
      targetCameraPositionRef.current.set(
        viewerPosition.x,
        1.65,
        viewerPosition.z
      );
    }, [
      viewerPosition.x,
      viewerPosition.z,
    ]);

    useEffect(() => {
      const target =
        targetCameraQuaternionRef.current;

      if (viewQuaternion) {
        target.set(
          viewQuaternion.x,
          viewQuaternion.y,
          viewQuaternion.z,
          viewQuaternion.w
        ).normalize();
      } else {
        target.identity();
      }

      if (
        calibrationRevisionRef.current !==
        calibrationRevision
      ) {
        cameraRef.current?.quaternion.copy(
          target
        );
        cameraRef.current?.position.copy(
          targetCameraPositionRef.current
        );
        calibrationRevisionRef.current =
          calibrationRevision;
      }
    }, [
      calibrationRevision,
      viewQuaternion,
    ]);

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
          preserveDrawingBuffer: true,
          powerPreference:
            "high-performance",
        });

      const models = modelsRef.current;
      const captureLabels =
        captureLabelsRef.current;

      renderer.setClearColor(
        0x000000,
        0
      );
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          2
        )
      );
      renderer.outputColorSpace =
        THREE.SRGBColorSpace;
      renderer.toneMapping =
        THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      const scene = new THREE.Scene();

      const camera =
        new THREE.PerspectiveCamera(
          62,
          1,
          0.1,
          AR_CAMERA_FAR_METERS
        );

      camera.position.copy(
        targetCameraPositionRef.current
      );
      camera.lookAt(
        camera.position.x,
        1.65,
        camera.position.z - 1
      );

      scene.add(
        new THREE.HemisphereLight(
          0xffffff,
          0x101020,
          1.72
        )
      );

      const directionalLight =
        new THREE.DirectionalLight(
          0xffffff,
          2.15
        );

      directionalLight.position.set(
        -3,
        7,
        4
      );
      scene.add(directionalLight);

      const rimLight =
        new THREE.DirectionalLight(
          0x39e7ff,
          1.3
        );

      rimLight.position.set(4, 2, -5);
      scene.add(rimLight);

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
      const cameraSpaceAnchor =
        new THREE.Vector3();

      let animationFrame = 0;

      const renderScene = () => {
        const elapsed =
          clock.getElapsedTime();

        camera.quaternion.slerp(
          targetCameraQuaternionRef.current,
          CAMERA_ROTATION_DAMPING
        );
        camera.position.lerp(
          targetCameraPositionRef.current,
          CAMERA_POSITION_DAMPING
        );
        camera.updateMatrixWorld();

        captureLabels.clear();

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

            if (
              !visibleLabelIdsRef.current.has(
                experienceId
              )
            ) {
              label.style.opacity = "0";
              label.style.pointerEvents =
                "none";
              return;
            }

            labelAnchor.set(
              model.group.position.x,
              model.group.position.y +
                AR_PIN_HEIGHT_METERS *
                  model.pinGroup.scale.y +
                0.45,
              model.group.position.z
            );

            cameraSpaceAnchor
              .copy(labelAnchor)
              .applyMatrix4(
                camera.matrixWorldInverse
              );
            labelAnchor.project(camera);

            const visible =
              cameraSpaceAnchor.z < 0 &&
              labelAnchor.z >= -1 &&
              labelAnchor.z <= 1 &&
              Math.abs(labelAnchor.x) <=
                1.08 &&
              Math.abs(labelAnchor.y) <=
                1.08;

            if (!visible) {
              label.style.opacity = "0";
              label.style.pointerEvents =
                "none";
              return;
            }

            const x =
              (labelAnchor.x * 0.5 +
                0.5) *
              container.clientWidth;
            const y =
              (-labelAnchor.y * 0.5 +
                0.5) *
              container.clientHeight;

            label.style.opacity = "1";
            label.style.pointerEvents =
              "auto";
            label.style.transform =
              `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;

            captureLabels.set(
              experienceId,
              {
                title:
                  model.placement
                    .experience.title,
                distanceText:
                  formatArDistance(
                    model.placement
                      .distanceMeters
                  ),
                xRatio:
                  x /
                  container.clientWidth,
                yRatio:
                  y /
                  container.clientHeight,
                mission:
                  model.state ===
                  "mission",
              }
            );
          }
        );

        renderer.render(scene, camera);
      };

      renderFrameRef.current = renderScene;

      const render = () => {
        renderScene();
        animationFrame =
          requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelAnimationFrame(
          animationFrame
        );
        resizeObserver.disconnect();

        models.forEach((model) =>
          disposeArPinModel(model)
        );
        models.clear();
        captureLabels.clear();

        renderer.dispose();
        renderFrameRef.current =
          () => undefined;
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
          if (
            currentIds.has(experienceId)
          ) {
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
          };
          modelWasCreated = true;
          scene.add(model.group);
          modelsRef.current.set(
            experienceId,
            model
          );
        }

        const world =
          projectArPlacementToWorld(
            placement
          );

        model.targetPosition.set(
          world.x,
          0,
          world.z
        );

        if (modelWasCreated) {
          model.group.position.set(
            world.x,
            0,
            world.z
          );
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
                textOverflow:
                  "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {
                placement.experience
                  .title
              }
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
  });
