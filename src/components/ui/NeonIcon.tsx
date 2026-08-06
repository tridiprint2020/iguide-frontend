import type {
  CSSProperties,
} from "react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  NeonTheme,
} from "../../styles/neonTheme";

import type {
  NeonTone,
} from "../../styles/neonTheme";

type Props = {
  icon: LucideIcon;

  tone?: NeonTone;

  size?: number;

  strokeWidth?: number;

  active?: boolean;

  framed?: boolean;

  label?: string;

  style?: CSSProperties;
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

export default function NeonIcon({
  icon: Icon,
  tone = "magenta",
  size = 24,
  strokeWidth = 1.65,
  active = true,
  framed = false,
  label,
  style,
}: Props) {
  const color =
    getToneColor(tone);

  const glow =
    getToneGlow(tone);

  return (
    <span
      aria-label={label}
      aria-hidden={
        label
          ? undefined
          : true
      }
      style={{
        width: framed
          ? `${size + 22}px`
          : `${size}px`,

        height: framed
          ? `${size + 22}px`
          : `${size}px`,

        flexShrink: 0,

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        boxSizing: "border-box",

        borderRadius: framed
          ? "14px"
          : undefined,

        border: framed
          ? `1px solid ${color}55`
          : undefined,

        background: framed
          ? `linear-gradient(
              145deg,
              ${color}1F,
              rgba(10,11,22,0.76)
            )`
          : undefined,

        color,

        opacity: active
          ? 1
          : 0.48,

        filter: active
          ? glow
          : "none",

        transition:
          "filter 0.18s ease, opacity 0.18s ease, transform 0.18s ease, background-color 0.18s ease",

        ...style,
      }}
    >
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </span>
  );
}