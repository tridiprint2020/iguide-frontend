import {
  NeonTheme,
  type NeonTone,
} from "../../styles/neonTheme";

type Props = {
  size?: number;
  tone?: NeonTone;
  active?: boolean;
};

function getToneColor(
  tone: NeonTone
): string {
  switch (tone) {
    case "cyan":
      return NeonTheme.Colors.cyan;

    case "white":
      return NeonTheme.Colors.white;

    case "magenta":
    default:
      return NeonTheme.Colors.magenta;
  }
}

function getToneGlow(
  tone: NeonTone
): string {
  switch (tone) {
    case "cyan":
      return NeonTheme.Glow.cyan;

    case "white":
      return NeonTheme.Glow.white;

    case "magenta":
    default:
      return NeonTheme.Glow.magenta;
  }
}

export function Ar360Icon({
  size = 38,
  tone = "magenta",
  active = true,
}: Props) {
  const color =
    getToneColor(tone);

  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: "inline-flex",
        color,
        opacity: active ? 1 : 0.48,
        filter: active
          ? getToneGlow(tone)
          : "none",
        transition:
          "filter 0.18s ease, opacity 0.18s ease, transform 0.18s ease",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke="currentColor"
          strokeWidth="2"
        />

        <ellipse
          cx="24"
          cy="24"
          rx="8.5"
          ry="19"
          stroke="currentColor"
          strokeWidth="1.7"
          opacity="0.48"
        />

        <path
          d="M5 24C10.5 16.8 37.5 16.8 43 24"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.58"
        />

        <path
          d="M43 24C37.5 31.2 10.5 31.2 5 24"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinecap="round"
        />

        <path
          d="m21.5 28.2 7.5 3.3-7.5 3.5Z"
          fill="currentColor"
        />

        <text
          x="24"
          y="27.3"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12.5"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          letterSpacing="-0.5"
        >
          360°
        </text>
      </svg>
    </span>
  );
}
