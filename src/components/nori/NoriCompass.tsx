import "./NoriCompass.css";

export type NoriMotionState =
  | "idle"
  | "locating"
  | "mission-start"
  | "memory-saved"
  | "arrival"
  | "error";

type Props = {
  state?: NoriMotionState;
  size?: number;
  label?: string;
};

export default function NoriCompass({
  state = "idle",
  size = 54,
  label,
}: Props) {
  return (
    <span
      className={`nori-compass nori-compass--${state}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
    >
      <span
        className="nori-compass__pulse"
        aria-hidden="true"
      />

      <svg
        className="nori-compass__svg"
        viewBox="0 0 64 64"
        focusable="false"
        aria-hidden="true"
      >
        <circle
          className="nori-compass__ring"
          cx="32"
          cy="32"
          r="27"
          fill="rgba(8, 10, 22, 0.82)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray="39 5"
        />

        <g className="nori-compass__needle">
          <path
            d="M32 7.5 37.2 29.2 32 33.2 26.8 29.2Z"
            fill="#FF3DE8"
          />
          <path
            d="M32 56.5 26.8 34.8 32 30.8 37.2 34.8Z"
            fill="#F8FCFF"
          />
          <path
            d="M7.5 32 29.2 26.8 33.2 32 29.2 37.2Z"
            fill="#06162D"
            stroke="#42E8F5"
            strokeWidth="0.8"
          />
          <path
            d="M56.5 32 34.8 26.8 30.8 32 34.8 37.2Z"
            fill="#F8FCFF"
          />
          <circle
            cx="32"
            cy="32"
            r="3.1"
            fill="#091328"
            stroke="#42E8F5"
            strokeWidth="1"
          />
        </g>

        <circle
          className="nori-compass__north"
          cx="32"
          cy="2.8"
          r="2.25"
          fill="#42E8F5"
        />
      </svg>
    </span>
  );
}
