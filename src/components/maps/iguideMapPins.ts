import L from "leaflet";

export type IguidePinKind =
  | "catalog"
  | "visited"
  | "mission"
  | "start"
  | "memory"
  | "finish"
  | "home"
  | "abort";

const MAGENTA = "#FF00FF";
const CYAN = "#00E6FF";
const ORANGE = "#FF8A00";

const pinCache =
  new Map<string, L.DivIcon>();

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createIguidePin(
  kind: IguidePinKind,
  title: string
): L.DivIcon {
  const cacheKey =
    `${kind}:${title}`;

  const cached =
    pinCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const isAbort =
    kind === "abort";
  const isMemory =
    kind === "memory";
  const isMission =
    kind === "mission";
  const isVisited =
    kind === "visited";
  const isStart =
    kind === "start";
  const isFinish =
    kind === "finish";
  const isHome =
    kind === "home";

  const size =
    isStart || isFinish
      ? 52
      : isMission
        ? 46
        : isHome
          ? 44
        : isAbort
          ? 44
          : isMemory
            ? 32
            : 40;

  const color =
    isAbort
      ? ORANGE
      : isMemory
        ? CYAN
      : isHome
        ? CYAN
      : MAGENTA;

  const symbolColor =
    isVisited
      ? CYAN
      : color;

  const safeTitle =
    escapeHtml(title);

  const isTimelinePoint =
    isStart || isMemory || isFinish;

  const symbol = isTimelinePoint
    ? `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="currentColor"
          stroke="#FFFFFF"
          stroke-width="2.4"
        />
      </svg>
    `
    : isHome
      ? `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="currentColor"
            stroke="#FFFFFF"
            stroke-width="2"
          />
          <path
            d="M9 15.5 16 9l7 6.5V24h-5v-6h-4v6H9v-8.5Z"
            fill="#071014"
            stroke="#FFFFFF"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
      `
    : isAbort
        ? `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle
              cx="16"
              cy="16"
              r="10"
              fill="currentColor"
              stroke="#FFFFFF"
              stroke-width="2.2"
            />
            <path
              d="M10 10 22 22M22 10 10 22"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        `
        : `
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                class="iguide-neon-pin__star"
                d="
                  M16 29
                  C16 29 25 21.2 25 12.5
                  C25 7.25 20.97 3 16 3
                  C11.03 3 7 7.25 7 12.5
                  C7 21.2 16 29 16 29Z
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linejoin="round"
              />
              <circle
                cx="16"
                cy="12.5"
                r="5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="
                  M16 8.7
                  L17.2 11
                  L19.8 11.4
                  L17.9 13.2
                  L18.4 15.8
                  L16 14.6
                  L13.6 15.8
                  L14.1 13.2
                  L12.2 11.4
                  L14.8 11
                  Z
                "
                fill="var(--pin-symbol-color)"
              />
            </svg>
          `;

  const html = `
    <div
      class="iguide-neon-pin iguide-neon-pin--${kind}"
      title="${safeTitle}"
      style="--pin-color: ${color}; --pin-symbol-color: ${symbolColor}; --pin-size: ${size}px;"
    >
      <span class="iguide-neon-pin__halo"></span>
      <span class="iguide-neon-pin__icon">
        ${symbol}
      </span>
      ${
        isStart ||
        isFinish ||
        isMission
          ? `<span class="iguide-neon-pin__pulse"></span>`
          : ""
      }
    </div>
  `;

  const icon =
    L.divIcon({
      html,
      className:
        "iguide-leaflet-div-icon",
      iconSize: [size, size],
      iconAnchor: [
        size / 2,
        size / 2,
      ],
      popupAnchor: [
        0,
        -(size / 2) - 8,
      ],
    });

  pinCache.set(
    cacheKey,
    icon
  );

  return icon;
}
