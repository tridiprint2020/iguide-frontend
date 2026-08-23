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
        opacity: active ? 1 : 0.55,
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
        <path
          d="M7.5 23.5C8.1 14.9 15.3 8 24 8c5.1 0 9.7 2.3 12.7 5.9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="m34 8.8 3.2 5.8-6.4.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M40.5 24.5C39.9 33.1 32.7 40 24 40c-5.1 0-9.7-2.3-12.7-5.9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="m14 39.2-3.2-5.8 6.4-.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text
          x="24"
          y="19"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          AR
        </text>

        <text
          x="24"
          y="30.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="13"
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
