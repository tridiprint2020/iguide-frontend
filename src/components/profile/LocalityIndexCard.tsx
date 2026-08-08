import {
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  getAllLocalityTiers,
  getLocalityProgress,
} from "../../engine/localityIndexEngine";

import type {
  UserProfile,
} from "../../types/user/user";
import { tx } from "../../i18n";

type Props = {
  profile: UserProfile;
};

export default function LocalityIndexCard({
  profile,
}: Props) {
  const progress =
    getLocalityProgress(
      profile
    );

  const tiers =
    getAllLocalityTiers();

  const finalMessage =
    progress.nextTier
      ? progress.remainingMissions === 1
        ? tx("Te falta 1 misión para convertirte en {{tier}}.", { tier: tx(progress.nextTier.label) })
        : tx("Te faltan {{count}} misiones para convertirte en {{tier}}.", { count: progress.remainingMissions, tier: tx(progress.nextTier.label) })
      : tx("Ya alcanzaste el máximo Índice de Localidad de Huancayo.");

  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",

        padding: "18px",

        borderRadius: "22px",

        background:
          "linear-gradient(145deg, rgba(224,242,254,0.98) 0%, rgba(191,219,254,0.96) 48%, rgba(147,197,253,0.96) 100%)",

        border:
          "1px solid rgba(255,255,255,0.72)",

        boxShadow:
          "0 16px 38px rgba(37,99,235,0.18)",

        color: "#0F172A",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              marginBottom: "3px",

              color: "#2563EB",

              fontSize: "10px",
              fontWeight: 850,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}
          >
            {tx("Tu transformación")}
          </span>

          <h2
            style={{
              margin: 0,

              color: "#0F172A",

              fontSize: "18px",
              lineHeight: 1.15,
            }}
          >
            {tx("Índice de Localidad")}
          </h2>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "42px",
            height: "42px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "14px",

            background:
              "rgba(255,255,255,0.58)",

            border:
              "1px solid rgba(255,255,255,0.78)",

            color: "#2563EB",
          }}
        >
          <MapPin
            size={21}
            strokeWidth={2.3}
          />
        </div>
      </header>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {tx("Nivel de pertenencia")}
        </span>

        <strong
          style={{
            color: "#1D4ED8",
            fontSize: "13px",
          }}
        >
          {
            tx(progress.currentTier.label)
          }
        </strong>
      </div>

      {/* BARRA AZUL: NO MAGENTA */}
      <div
        style={{
          width: "100%",
          height: "9px",

          overflow: "hidden",

          borderRadius: "999px",

          background:
            "rgba(255,255,255,0.62)",

          boxShadow:
            "inset 0 1px 2px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            width:
              `${progress.globalProgressPercent}%`,

            height: "100%",

            borderRadius: "999px",

            background:
              "linear-gradient(90deg, #38BDF8 0%, #2563EB 100%)",

            transition:
              "width 0.35s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",

          marginTop: "6px",

          color: "#475569",

          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        <span>{tx("Visitante")}</span>
        <span>{tx("Wanka Honorario")}</span>
      </div>

      {/* TIERS */}
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",

          gap: "5px",

          marginTop: "14px",
        }}
      >
        {tiers.map((tier) => {
          const isCurrent =
            tier.id ===
            progress.currentTier.id;

          const isReached =
            profile.experience >=
            tier.minimumXp;

          return (
            <div
              key={tier.id}
              title={tx(tier.label)}
              style={{
                minHeight: "48px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                boxSizing: "border-box",

                padding: "6px 3px",

                borderRadius: "10px",

                textAlign: "center",

                background:
                  isCurrent
                    ? "#2563EB"
                    : isReached
                      ? "rgba(255,255,255,0.70)"
                      : "rgba(255,255,255,0.32)",

                border:
                  isCurrent
                    ? "1px solid #2563EB"
                    : "1px solid rgba(255,255,255,0.66)",

                color:
                  isCurrent
                    ? "#FFFFFF"
                    : isReached
                      ? "#1E3A8A"
                      : "#64748B",

                fontSize: "8px",

                fontWeight:
                  isCurrent
                    ? 850
                    : 700,

                lineHeight: 1.15,

                boxShadow:
                  isCurrent
                    ? "0 7px 18px rgba(37,99,235,0.28)"
                    : "none",
              }}
            >
              {tx(tier.label)}
            </div>
          );
        })}
      </div>

      {/* LLAMADA A LA ACCIÓN */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "9px",

          marginTop: "15px",

          padding: "11px 12px",

          borderRadius: "13px",

          background:
            "rgba(255,255,255,0.58)",

          border:
            "1px solid rgba(255,255,255,0.74)",
        }}
      >
        <Sparkles
          size={17}
          strokeWidth={2.3}
          color="#2563EB"
          style={{
            flexShrink: 0,
            marginTop: "1px",
          }}
        />

        <div>
          <p
            style={{
              margin: 0,

              color: "#0F172A",

              fontSize: "11px",
              fontWeight: 800,
              lineHeight: 1.4,
            }}
          >
            {finalMessage}
          </p>

          <p
            style={{
              margin: "4px 0 0",

              color: "#475569",

              fontSize: "9px",
              lineHeight: 1.4,
            }}
          >
            {progress.currentXp} {tx("XP acumulados")}
            {progress.nextTier
              ? ` · ${progress.remainingXp} ${tx("XP restantes")}`
              : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
