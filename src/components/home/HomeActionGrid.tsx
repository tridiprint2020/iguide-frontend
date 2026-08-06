import {
  Camera,
  MapPin,
  PartyPopper,
  Utensils,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import pachamancaImage from "../../assets/optimized/pachamanca.webp";
import cerritoImage from "../../assets/optimized/cerrito-libertad.webp";
import santiagoImage from "../../assets/optimized/fiesta-santiago.webp";

import NeonIcon from "../ui/NeonIcon";

import {
  NeonTheme,
} from "../../styles/neonTheme";

type ActionCard = {
  id:
    | "food"
    | "hidden"
    | "surprise"
    | "nearby";

  title: string;
  description: string;
  image?: string;
  icon:
    | typeof Utensils
    | typeof Camera
    | typeof PartyPopper
    | typeof MapPin;

  tone:
    | "magenta"
    | "cyan";

  target: string;
};

const ACTION_CARDS:
  ActionCard[] = [
  {
    id: "food",

    title:
      "Comer increíble",

    description:
      "Sabores que los locales recomiendan",

    image:
      pachamancaImage,

    icon:
      Utensils,

    tone:
      "magenta",

    target:
      "/explorer?category=restaurants",
  },

  {
    id: "hidden",

    title:
      "Descubrir rincones",

    description:
      "Miradores, historias y lugares ocultos",

    image:
      cerritoImage,

    icon:
      Camera,

    tone:
      "cyan",

    target:
      "/explorer?mood=hidden",
  },

  {
    id: "surprise",

    title:
      "Sorpresa local",

    description:
      "Algo que la ciudad está viviendo hoy",

    image:
      santiagoImage,

    icon:
      PartyPopper,

    tone:
      "magenta",

    target:
      "/explorer?mood=surprise",
  },

  {
    id: "nearby",

    title:
      "Cerca de ti",

    description:
      "Abre el mapa y descubre qué tienes alrededor",

    icon:
      MapPin,

    tone:
      "cyan",

    target:
      "/mapa",
  },
];

export default function HomeActionGrid() {
  const navigate =
    useNavigate();

  return (
    <section
      aria-label="Accesos de exploración"
      style={{
        display: "grid",

        gridTemplateColumns:
          "repeat(2, minmax(0, 1fr))",

        gap: "10px",

        width: "100%",
      }}
    >
      {ACTION_CARDS.map(
        (card) => (
          <ActionCardItem
            key={card.id}
            card={card}
            onOpen={() =>
              navigate(
                card.target
              )
            }
          />
        )
      )}
    </section>
  );
}

type ActionCardItemProps = {
  card: ActionCard;
  onOpen: () => void;
};

function ActionCardItem({
  card,
  onOpen,
}: ActionCardItemProps) {
  const isCyan =
    card.tone === "cyan";

  const glowColor =
    isCyan
      ? "rgba(0,230,255,0.30)"
      : "rgba(255,61,232,0.30)";

  const borderColor =
    isCyan
      ? "rgba(0,230,255,0.28)"
      : "rgba(255,61,232,0.28)";

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        position: "relative",

        minWidth: 0,
        minHeight: "158px",

        overflow: "hidden",

        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent:
          "space-between",

        boxSizing:
          "border-box",

        padding: "13px",

        borderRadius: "20px",

        border:
          `1px solid ${borderColor}`,

        background:
          card.image
            ? `linear-gradient(
                180deg,
                rgba(5,6,14,0.12) 0%,
                rgba(5,6,14,0.48) 45%,
                rgba(5,6,14,0.96) 100%
              ),
              url(${card.image})`
            : `radial-gradient(
                circle at 75% 25%,
                ${glowColor},
                transparent 34%
              ),
              linear-gradient(
                145deg,
                #17182D,
                #0B0C16
              )`,

        backgroundSize:
          "cover",

        backgroundPosition:
          "center",

        color: "#FFFFFF",

        textAlign: "left",

        cursor: "pointer",

        boxShadow:
          `0 12px 30px rgba(0,0,0,0.28),
           0 0 18px ${glowColor}`,

        transition:
          "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      <NeonIcon
        icon={card.icon}
        tone={card.tone}
        size={22}
        strokeWidth={1.55}
        framed
      />

      {!card.image &&
        card.id ===
          "nearby" && (
          <>
            <div
              aria-hidden="true"
              style={{
                position:
                  "absolute",

                right: "19px",
                top: "28px",

                width: "44px",
                height: "44px",

                borderRadius:
                  "50%",

                border:
                  `1px solid ${
                    NeonTheme
                      .Colors
                      .cyan
                  }66`,

                boxShadow:
                  NeonTheme
                    .Shadows
                    .cyan,
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position:
                  "absolute",

                right: "36px",
                top: "45px",

                width: "10px",
                height: "10px",

                borderRadius:
                  "50%",

                backgroundColor:
                  NeonTheme
                    .Colors
                    .cyan,

                boxShadow:
                  "0 0 13px rgba(0,230,255,0.95)",
              }}
            />
          </>
        )}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 5px",

            color: "#FFFFFF",

            fontSize:
              "clamp(1rem, 4.2vw, 1.25rem)",

            lineHeight: 1.02,

            fontWeight: 850,

            textShadow:
              "0 2px 9px rgba(0,0,0,0.85)",
          }}
        >
          {card.title}
        </h2>

        <p
          style={{
            margin: 0,

            color:
              "rgba(255,255,255,0.82)",

            fontSize: "10px",

            lineHeight: 1.35,

            textShadow:
              "0 2px 7px rgba(0,0,0,0.92)",
          }}
        >
          {card.description}
        </p>
      </div>
    </button>
  );
}