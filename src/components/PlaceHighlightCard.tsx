import { useState } from "react";
import { Link } from "react-router-dom";
// ✅ CORREGIDO: Importación de la unión genérica desde el archivo central unificado
import type { Experience } from "../types/experience/experience";
import { getPlaceHint } from "../engine/noriEngine";
import { Theme } from "../styles/theme";

type Props = {
  expedition: Experience;
};

function PlaceHighlightCard({ expedition }: Props) {
  const [showHint, setShowHint] = useState(false);

  return (
    <Link
      className="ig-hover"
      to={`/expedition/${expedition.slug}`}
      style={{
        textDecoration: "none",
        display: "block",
        borderRadius: Theme.Radius.medium,
        overflow: "hidden",
        position: "relative",
        height: "220px",
        backgroundImage: `url(${expedition.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: Theme.Shadows.card,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.05) 65%)" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: Theme.Space.md, color: "#fff" }}>
        <div
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
          style={{ position: "relative", display: "inline-block" }}
        >
          <h3 style={{ margin: "0 0 4px", fontFamily: Theme.Typography.title, fontSize: "20px" }}>
            {expedition.title}
          </h3>

          {showHint && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: "6px",
                backgroundColor: "#ffffff",
                color: "#1A202C",
                borderLeft: `3px solid ${Theme.Colors.secondary}`,
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                boxShadow: Theme.Shadows.card,
                zIndex: 20,
              }}
            >
              ✦ {getPlaceHint(expedition)}
            </div>
          )}
        </div>

        <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", lineHeight: 1.4 }}>
          {/* ✅ CORREGIDO: Acceso seguro con discriminación de tipo para evitar errores de compilación */}
          {expedition.type === "expedition" ? expedition.hospes : expedition.description}
        </p>
      </div>

      {expedition.link && (
        <a
          href={expedition.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: Theme.Colors.secondary,
            fontSize: "12px",
            padding: "4px 8px",
            borderRadius: Theme.Radius.pill,
            textDecoration: "none",
          }}
        >
          📍 Ver mapa
        </a>
      )}
    </Link>
  );
}

export default PlaceHighlightCard;
