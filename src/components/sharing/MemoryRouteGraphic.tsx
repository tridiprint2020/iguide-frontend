import {
  useMemo,
} from "react";

import {
  getTimelineRouteSegments,
} from "../../engine/trackingEngine";
import type {
  TimelineItem,
} from "../../types/tracking/tracking";

type Props = {
  path: [number, number][];
  memories: TimelineItem[];
  waypoints?: TimelineItem[];
  compact?: boolean;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

const WIDTH = 320;
const HEIGHT = 400;
const PADDING = 34;

function MemoryRouteGraphic({
  path,
  memories,
  waypoints = [],
  compact = false,
}: Props) {
  const model = useMemo(() => {
    const routeSegments =
      waypoints.length > 0
        ? getTimelineRouteSegments(waypoints)
        : [path];

    const routeCoordinates = routeSegments.flat();
    const allCoordinates = [
      ...routeCoordinates,
      ...memories.map(
        (memory) =>
          [memory.lat, memory.lng] as [number, number]
      ),
    ];

    if (allCoordinates.length === 0) {
      allCoordinates.push([0, 0]);
    }

    const latitudes = allCoordinates.map(([lat]) => lat);
    const longitudes = allCoordinates.map(([, lng]) => lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latSpan = Math.max(maxLat - minLat, 0.00025);
    const lngSpan = Math.max(maxLng - minLng, 0.00025);

    const project = ([lat, lng]: [number, number]): ProjectedPoint => ({
      x:
        PADDING +
        ((lng - minLng) / lngSpan) *
          (WIDTH - PADDING * 2),
      y:
        PADDING +
        ((maxLat - lat) / latSpan) *
          (HEIGHT - PADDING * 2),
    });

    const segments = routeSegments
      .filter((segment) => segment.length > 0)
      .map((segment) => segment.map(project));

    const start = routeCoordinates[0]
      ? project(routeCoordinates[0])
      : null;
    const end = routeCoordinates[routeCoordinates.length - 1]
      ? project(routeCoordinates[routeCoordinates.length - 1])
      : null;

    return {
      segments,
      start,
      end,
      memoryPoints: memories.map((memory) => ({
        ...project([memory.lat, memory.lng]),
        id: memory.id,
      })),
      abandoned: waypoints.some((point) => point.type === "abort") &&
        !waypoints.some((point) => point.type === "finish"),
    };
  }, [memories, path, waypoints]);

  const routeWidth = compact ? 4.5 : 6;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "linear-gradient(145deg, #F8FBFC 0%, #E7F1F3 52%, #F6F2F8 100%)",
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <defs>
          <pattern
            id="iguide-route-grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(18)"
          >
            <path
              d="M 0 0 L 0 42"
              stroke="#FFFFFF"
              strokeWidth="9"
              opacity="0.72"
            />
            <path
              d="M 16 0 L 16 42"
              stroke="#BFCFD3"
              strokeWidth="1"
              opacity="0.35"
            />
          </pattern>
          <filter id="iguide-route-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#iguide-route-grid)" />

        <path
          d="M -15 315 C 58 285 94 333 171 292 S 280 234 346 259"
          fill="none"
          stroke="#CBE6EC"
          strokeWidth="20"
          opacity="0.9"
        />
        <path
          d="M 12 72 C 94 118 119 83 185 116 S 268 169 338 133"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="12"
          opacity="0.88"
        />

        {model.segments.map((segment, index) => {
          const points = segment
            .map((point) => `${point.x},${point.y}`)
            .join(" ");

          return (
            <g key={`route-${index}`}>
              <polyline
                points={points}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={routeWidth + 5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.96"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#FF20CE"
                strokeWidth={routeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#iguide-route-glow)"
              />
            </g>
          );
        })}

        {model.start && (
          <g>
            <circle
              cx={model.start.x}
              cy={model.start.y}
              r={compact ? 8 : 12}
              fill="#FF20CE"
              stroke="#FFFFFF"
              strokeWidth="3"
            />
            <circle
              cx={model.start.x}
              cy={model.start.y}
              r={compact ? 13 : 18}
              fill="none"
              stroke="#FF20CE"
              strokeWidth="2"
              opacity="0.32"
            />
          </g>
        )}

        {model.memoryPoints.map((memory) => (
          <circle
            key={memory.id}
            cx={memory.x}
            cy={memory.y}
            r={compact ? 4 : 6}
            fill="#FF20CE"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {model.end && (
          <g>
            <circle
              cx={model.end.x}
              cy={model.end.y}
              r={compact ? 9 : 13}
              fill={model.abandoned ? "#FF8A00" : "#FF20CE"}
              stroke="#FFFFFF"
              strokeWidth="3"
            />
            <circle
              cx={model.end.x}
              cy={model.end.y}
              r={compact ? 14 : 20}
              fill="none"
              stroke={model.abandoned ? "#FF8A00" : "#FF20CE"}
              strokeWidth="2"
              opacity="0.34"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default MemoryRouteGraphic;
