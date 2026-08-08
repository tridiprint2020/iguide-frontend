function IguideMapPinStyles() {
  return (
    <style>
      {`
        .iguide-leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }

        .iguide-neon-pin {
          position: relative;
          width: var(--pin-size);
          height: var(--pin-size);
          display: grid;
          place-items: center;
          color: var(--pin-color);
          isolation: isolate;
          pointer-events: auto;
        }

        .iguide-neon-pin__halo {
          position: absolute;
          inset: 13%;
          z-index: 1;
          border-radius: 50%;
          background: color-mix(
            in srgb,
            var(--pin-color) 32%,
            transparent
          );
          filter: blur(5px);
          opacity: 0.62;
          transition:
            opacity 0.18s ease,
            transform 0.18s ease;
        }

        .iguide-neon-pin__icon {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: color-mix(
            in srgb,
            var(--pin-color) 78%,
            white
          );
          filter:
            drop-shadow(0 0 2px rgba(0,0,0,0.95))
            drop-shadow(0 0 3px rgba(255,255,255,0.95))
            drop-shadow(0 0 7px var(--pin-color))
            drop-shadow(
              0 0 16px
              color-mix(
                in srgb,
                var(--pin-color) 88%,
                transparent
              )
            )
            drop-shadow(
              0 0 16px
              color-mix(
                in srgb,
                var(--pin-color) 48%,
                transparent
              )
            );
          transition:
            transform 0.18s ease,
            filter 0.18s ease;
        }

        .iguide-neon-pin__icon svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .iguide-neon-pin:hover
        .iguide-neon-pin__icon {
          transform: translateY(-2px) scale(1.08);
          filter:
            drop-shadow(0 0 3px rgba(255,255,255,0.90))
            drop-shadow(0 0 7px var(--pin-color))
            drop-shadow(
              0 0 15px
              color-mix(
                in srgb,
                var(--pin-color) 82%,
                transparent
              )
            );
        }

        .iguide-neon-pin:hover
        .iguide-neon-pin__halo {
          opacity: 1;
          transform: scale(1.15);
        }

        .iguide-neon-pin__pulse {
          position: absolute;
          inset: 4%;
          z-index: 0;
          border: 1px solid color-mix(
            in srgb,
            var(--pin-color) 75%,
            transparent
          );
          border-radius: 50%;
          opacity: 0.7;
          animation:
            iguideNeonPinPulse
            2.2s ease-out infinite;
          pointer-events: none;
        }

        .iguide-neon-pin--memory
        .iguide-neon-pin__icon {
          width: 86%;
          height: 86%;
          filter:
            drop-shadow(0 0 3px rgba(255,255,255,0.90))
            drop-shadow(0 0 7px rgba(0,230,255,0.98))
            drop-shadow(0 0 13px rgba(0,230,255,0.66));
        }

        .iguide-neon-pin--catalog
        .iguide-neon-pin__halo {
          background: rgba(0,230,255,0.24);
        }

        .iguide-neon-pin--mission
        .iguide-neon-pin__halo {
          background: rgba(0,230,255,0.32);
        }

        .iguide-neon-pin--abort
        .iguide-neon-pin__halo {
          background: rgba(255,138,0,0.26);
        }

        .iguide-neon-pin--visited
        .iguide-neon-pin__icon,
        .iguide-neon-pin--finish
        .iguide-neon-pin__icon {
          filter:
            drop-shadow(0 0 3px rgba(255,255,255,0.90))
            drop-shadow(0 0 7px rgba(255,0,255,0.98))
            drop-shadow(0 0 13px rgba(255,0,255,0.70));
        }

        .iguide-route-line {
          filter:
            drop-shadow(0 0 3px rgba(255,0,255,0.92))
            drop-shadow(0 0 8px rgba(255,0,255,0.48));
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        @keyframes iguideNeonPinPulse {
          0% {
            transform: scale(0.72);
            opacity: 0.72;
          }
          75%,
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
      `}
    </style>
  );
}

export default IguideMapPinStyles;
