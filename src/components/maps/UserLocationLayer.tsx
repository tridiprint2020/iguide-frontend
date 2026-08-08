import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Circle,
  Marker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { tx } from "../../i18n";

type UserPosition = {
  lat: number;
  lng: number;
  accuracy: number;
};

type Props = {
  /**
   * Se mantiene por compatibilidad con llamadas antiguas.
   * El encuadre real se controla con radiusMeters.
   */
  initialZoom?: number;

  /**
   * Radio visible alrededor del usuario al abrir o recentrar.
   * 200 = aproximadamente 200 metros alrededor del punto GPS.
   */
  radiusMeters?: number;
};

const STYLE_ID =
  "iguide-user-location-style";

function installUserLocationStyles(): void {
  if (
    typeof document === "undefined" ||
    document.getElementById(STYLE_ID)
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id = STYLE_ID;

  style.textContent = `
    .iguide-user-location-icon {
      background: transparent !important;
      border: none !important;
    }

    .iguide-user-location {
      position: relative;
      width: 42px;
      height: 42px;
      display: block;
      pointer-events: none;
    }

    .iguide-user-location__pulse {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: rgba(255, 0, 255, 0.25);
      border: 1px solid rgba(255, 61, 232, 0.78);
      box-shadow: 0 0 22px rgba(255, 0, 255, 0.78);
      animation: iguide-user-location-pulse 1.55s ease-out infinite;
    }

    .iguide-user-location__dot {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 17px;
      height: 17px;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      box-sizing: border-box;
      background: #FF00FF;
      border: 3px solid #FFFFFF;
      box-shadow:
        0 0 0 3px rgba(255, 0, 255, 0.24),
        0 0 18px rgba(255, 0, 255, 1);
    }

    .iguide-locate-control {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 0, 255, 0.35);
      border-radius: 13px;
      background: rgba(12, 12, 20, 0.92);
      color: #FFFFFF;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.34),
        0 0 18px rgba(255, 0, 255, 0.18);
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }

    .iguide-locate-control:hover,
    .iguide-locate-control:focus-visible {
      border-color: #FF00FF;
      outline: none;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.34),
        0 0 22px rgba(255, 0, 255, 0.40);
    }

    @keyframes iguide-user-location-pulse {
      0% {
        transform: scale(0.40);
        opacity: 0.96;
      }

      72% {
        transform: scale(1.16);
        opacity: 0.12;
      }

      100% {
        transform: scale(1.22);
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .iguide-user-location__pulse {
        animation: none;
        opacity: 0.38;
      }
    }
  `;

  document.head.appendChild(style);
}

function distanceBetweenMeters(
  first: UserPosition,
  second: UserPosition
): number {
  const earthRadius = 6371000;
  const toRadians =
    (value: number) =>
      (value * Math.PI) / 180;

  const deltaLat = toRadians(
    second.lat - first.lat
  );

  const deltaLng = toRadians(
    second.lng - first.lng
  );

  const firstLat = toRadians(
    first.lat
  );

  const secondLat = toRadians(
    second.lat
  );

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

export default function UserLocationLayer({
  initialZoom = 18,
  radiusMeters = 200,
}: Props) {
  const map = useMap();
  const userLocationLabel = tx("Tu ubicación");
  const locateTitle = tx("Dónde estoy");
  const centerLocationLabel = tx("Centrar mapa en mi ubicación");

  const [position, setPosition] =
    useState<UserPosition | null>(null);

  const lastPositionRef =
    useRef<UserPosition | null>(null);

  const quickCenteredRef =
    useRef(false);

  const precisionCenteredRef =
    useRef(false);

  const safeRadiusMeters =
    Math.max(80, radiusMeters);

  const maxZoom =
    Math.max(18, initialZoom);

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className:
          "iguide-user-location-icon",
        html: `
          <span
            class="iguide-user-location"
            aria-label="${userLocationLabel}"
          >
            <span class="iguide-user-location__pulse"></span>
            <span class="iguide-user-location__dot"></span>
          </span>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    [userLocationLabel]
  );

  function centerOnUser(
    nextPosition: UserPosition,
    animate: boolean
  ) {
    const bounds = L.latLng(
      nextPosition.lat,
      nextPosition.lng
    ).toBounds(
      safeRadiusMeters * 2
    );

    map.fitBounds(bounds, {
      padding: [16, 16],
      maxZoom,
      animate,
    });

    window.requestAnimationFrame(
      () => map.invalidateSize()
    );
  }

  useEffect(() => {
    installUserLocationStyles();
  }, []);

  useEffect(() => {
    const LocateControl = L.Control.extend({
      options: {
        position: "bottomright",
      },

      onAdd() {
        const button =
          L.DomUtil.create(
            "button",
            "iguide-locate-control"
          ) as HTMLButtonElement;

        button.type = "button";
        button.title = locateTitle;
        button.setAttribute(
          "aria-label",
          centerLocationLabel
        );
        button.textContent = "◎";

        L.DomEvent.disableClickPropagation(
          button
        );

        L.DomEvent.on(
          button,
          "click",
          () => {
            const current =
              lastPositionRef.current;

            if (current) {
              centerOnUser(
                current,
                true
              );
            }
          }
        );

        return button;
      },
    });

    const control =
      new LocateControl();

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, maxZoom, safeRadiusMeters, locateTitle, centerLocationLabel]);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.info(
        "Este dispositivo no ofrece geolocalización."
      );

      return;
    }

    let watchId: number | null = null;
    let disposed = false;

    function applyPosition(
      result: GeolocationPosition,
      source: "quick" | "precise"
    ) {
      if (disposed) {
        return;
      }

      const {
        latitude,
        longitude,
        accuracy,
      } = result.coords;

      const nextPosition: UserPosition = {
        lat: latitude,
        lng: longitude,
        accuracy:
          Number.isFinite(accuracy) &&
          accuracy > 0
            ? accuracy
            : 35,
      };

      const previous =
        lastPositionRef.current;

      const movedEnough =
        !previous ||
        distanceBetweenMeters(
          previous,
          nextPosition
        ) >= 4;

      const accuracyImproved =
        !previous ||
        nextPosition.accuracy <=
          previous.accuracy - 8;

      if (
        movedEnough ||
        accuracyImproved
      ) {
        lastPositionRef.current =
          nextPosition;

        setPosition(nextPosition);
      }

      if (
        source === "quick" &&
        !quickCenteredRef.current
      ) {
        quickCenteredRef.current = true;

        centerOnUser(
          nextPosition,
          false
        );

        return;
      }

      const shouldCorrectCenter =
        source === "precise" &&
        !precisionCenteredRef.current &&
        (
          !previous ||
          nextPosition.accuracy <= 100 ||
          nextPosition.accuracy <=
            previous.accuracy - 25
        );

      if (shouldCorrectCenter) {
        precisionCenteredRef.current =
          true;

        centerOnUser(
          nextPosition,
          false
        );
      }
    }

    navigator.geolocation.getCurrentPosition(
      (result) =>
        applyPosition(
          result,
          "quick"
        ),
      () => {
        /* La lectura precisa intentará resolverlo. */
      },
      {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 3500,
      }
    );

    watchId =
      navigator.geolocation.watchPosition(
        (result) =>
          applyPosition(
            result,
            "precise"
          ),
        (error) => {
          console.info(
            "No se pudo mostrar la ubicación en el mapa:",
            error.message
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 4000,
          timeout: 15000,
        }
      );

    return () => {
      disposed = true;

      if (watchId !== null) {
        navigator.geolocation.clearWatch(
          watchId
        );
      }
    };
  }, [map, maxZoom, safeRadiusMeters]);

  if (!position) {
    return null;
  }

  return (
    <>
      <Circle
        center={[
          position.lat,
          position.lng,
        ]}
        radius={Math.min(
          Math.max(
            position.accuracy,
            10
          ),
          200
        )}
        interactive={false}
        pathOptions={{
          color: "#FF00FF",
          weight: 1,
          opacity: 0.34,
          fillColor: "#FF00FF",
          fillOpacity: 0.06,
        }}
      />

      <Marker
        position={[
          position.lat,
          position.lng,
        ]}
        icon={userIcon}
        interactive={false}
        keyboard={false}
        zIndexOffset={3000}
      />
    </>
  );
}
