import {
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Car,
  Clock3,
  Compass,
  Footprints,
  MapPin,
  Route,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  catalog,
} from "../data/catalog";

import ExpeditionMap from "../components/ExpeditionMap";
import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal";

import {
  Theme,
} from "../styles/theme";

import {
  useJourney,
} from "../context/JourneyContext";

import {
  loadTrack,
} from "../engine/trackingEngine";

import {
  getHospesMessage,
} from "../engine/hospesContextEngine";
import {
  getVerifiedHuariqueProfile,
} from "../engine/huariqueEngine";
import {
  getExperienceScheduleLabel,
} from "../engine/experienceScheduleEngine";

import type {
  Experience,
} from "../types/experience";

import type {
  TimelineItem,
} from "../types/tracking/tracking";

import type {
  MemoryCardData,
} from "../types/memoryCard";

import logoIG from "../assets/branding/logo-dark-bg.png";
import { tx } from "../i18n";

const CYAN = "#39E7FF";
const MAGENTA = "#FF00FF";

type InfoItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function readTextField(
  experience: Experience,
  key: string
): string | null {
  const record =
    experience as unknown as Record<
      string,
      unknown
    >;

  const value =
    record[key];

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const clean =
    value.trim();

  return clean.length > 0
    ? clean
    : null;
}

function getTypeLabel(
  type: Experience["type"]
): string {
  switch (type) {
    case "restaurant":
      return tx("Restaurante");
    case "cafe":
      return tx("Café");
    case "bar":
      return "Bar";
    case "nightclub":
      return tx("Vida nocturna");
    case "hotel":
      return "Hotel";
    case "museum":
      return tx("Museo");
    case "festival":
      return tx("Festividad");
    case "craft":
      return tx("Artesanía");
    case "event":
      return tx("Evento");
    case "expedition":
    default:
      return tx("Misión local");
  }
}

function Expedition() {
  const {
    slug,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    journey,
    startWalking,
  } = useJourney();

  const expedition =
    catalog.find(
      (experience) =>
        experience.slug === slug
    ) ?? null;

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const [
    activeMemory,
    setActiveMemory,
  ] =
    useState<MemoryCardData | null>(
      null
    );

  if (!expedition) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "grid",
          placeItems:
            "center",
          padding:
            Theme.Space.xl,
          background:
            "#090A12",
          color:
            "#FFFFFF",
        }}
      >
        <div
          style={{
            textAlign:
              "center",
          }}
        >
          <h1>
            {tx("Misión no encontrada")}
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/explorer"
              )
            }
          >
            {tx("Volver a explorar")}
          </button>
        </div>
      </div>
    );
  }

  const isSameExperience =
    journey.experience
      ?.experienceId ===
    expedition.experienceId;

  const persistedTrack =
    isSameExperience
      ? loadTrack(
          expedition.experienceId
        )
      : null;

  const currentTrack =
    isSameExperience
      ? {
          experienceId:
            expedition.experienceId,
          sessionId:
            persistedTrack
              ?.sessionId ??
            String(
              journey.startedAt ??
                Date.now()
            ),
          startedAt:
            journey.startedAt ??
            Date.now(),
          timeline:
            journey.timeline,
          ...(journey.state ===
          "COMPLETED"
            ? {
                completedAt:
                  persistedTrack
                    ?.completedAt ??
                  Date.now(),
              }
            : {}),
        }
      : null;

  const isTrackingActive =
    isSameExperience &&
    journey.state !== "IDLE" &&
    journey.state !==
      "COMPLETED";

  const hospesMessage =
    getHospesMessage({
      screen:
        "expedition",
      experience:
        expedition,
      timeline:
        currentTrack
          ?.timeline ?? [],
    });

  const huarique =
    getVerifiedHuariqueProfile(
      expedition
    );

  const distance =
    readTextField(
      expedition,
      "distance"
    );

  const driveTime =
    readTextField(
      expedition,
      "driveTime"
    );

  const walkTime =
    readTextField(
      expedition,
      "walkTime"
    );

  const duration =
    readTextField(
      expedition,
      "duration"
    );

  const averagePricePen =
    "averagePricePen" in expedition &&
    typeof expedition.averagePricePen === "number"
      ? expedition.averagePricePen
      : null;

  const price =
    readTextField(expedition, "price") ??
    (averagePricePen !== null
      ? tx("S/ {{price}} aprox.", {
          price: averagePricePen,
        })
      : null);

  const difficulty =
    readTextField(
      expedition,
      "difficulty"
    );

  const openingHours =
    getExperienceScheduleLabel(expedition);

  const localTip =
    huarique?.hospesTip ??
    readTextField(
      expedition,
      "hospes"
    ) ??
    readTextField(
      expedition,
      "description"
    );

  const information:
    InfoItem[] = [
    {
      label: tx("Zona"),
      value:
        expedition.city,
      icon: MapPin,
    },
    ...(expedition.address
      ? [
          {
            label: tx("Dirección"),
            value: expedition.address,
            icon: MapPin,
          } satisfies InfoItem,
        ]
      : []),
    {
      label: tx("Tipo"),
      value:
        getTypeLabel(
          expedition.type
        ),
      icon: Compass,
    },
    ...(openingHours
      ? [
          {
            label:
              tx("Horario"),
            value:
              openingHours,
            icon:
              Clock3,
          } satisfies InfoItem,
        ]
      : []),
    ...(distance
      ? [
          {
            label:
              tx("Distancia"),
            value:
              distance,
            icon:
              Route,
          } satisfies InfoItem,
        ]
      : []),
    ...(walkTime
      ? [
          {
            label:
              tx("Caminando"),
            value:
              walkTime,
            icon:
              Footprints,
          } satisfies InfoItem,
        ]
      : []),
    ...(driveTime
      ? [
          {
            label:
              tx("Vehículo"),
            value:
              driveTime,
            icon:
              Car,
          } satisfies InfoItem,
        ]
      : []),
    ...(duration
      ? [
          {
            label:
              tx("Duración"),
            value:
              duration,
            icon:
              Clock3,
          } satisfies InfoItem,
        ]
      : []),
    ...(price
      ? [
          {
            label:
              tx("Presupuesto"),
            value:
              price,
            icon:
              Wallet,
          } satisfies InfoItem,
        ]
      : []),
    ...(difficulty
      ? [
          {
            label:
              tx("Intensidad"),
            value:
              difficulty,
            icon:
              Star,
          } satisfies InfoItem,
        ]
      : []),
  ];

  function handleStart() {
  if (!expedition) {
    return;
  }

  if (!navigator.geolocation) {
    alert(
      tx("Tu dispositivo no permite usar la ubicación.")
    );
    return;
  }

  const confirmedExpedition: Experience =
    expedition;

  const missionStarted =
    startWalking(
      confirmedExpedition
    );

  if (missionStarted) {
    navigate("/journey");
  }
}

  return (
    <div
      style={{
        minHeight:
          "100vh",
        padding:
          "14px 12px 36px",
        boxSizing:
          "border-box",
        background:
          "radial-gradient(circle at 85% 5%, rgba(57,231,255,0.07), transparent 25%), radial-gradient(circle at 15% 22%, rgba(255,0,255,0.07), transparent 28%), #090A12",
        color:
          "#FFFFFF",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth:
            "680px",
          margin:
            "0 auto",
        }}
      >
        <header
          style={{
            minHeight:
              "48px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: "10px",
            marginBottom:
              "10px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              minHeight:
                "38px",
              padding:
                "8px 12px",
              borderRadius:
                "12px",
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(255,255,255,0.045)",
              color:
                "#FFFFFF",
              fontSize:
                "11px",
              fontWeight:
                750,
              cursor:
                "pointer",
            }}
          >
            ← {tx("Inicio")}
          </button>

          <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: "58px",
              maxHeight:
                "38px",
              objectFit:
                "contain",
            }}
          />

          <button
            type="button"
            onClick={() =>
              navigate(
                "/explorer"
              )
            }
            style={{
              minHeight:
                "38px",
              padding:
                "8px 12px",
              borderRadius:
                "12px",
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(255,255,255,0.045)",
              color:
                "rgba(255,255,255,0.72)",
              fontSize:
                "11px",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            {tx("Explorar")}
          </button>
        </header>

        {/* BLOQUE PRINCIPAL COMPACTO: lugar + Hospes + acción */}
        <section
          style={{
            marginBottom:
              "10px",
            padding:
              "14px 15px",
            borderRadius:
              "20px",
            border:
              "1px solid rgba(255,0,255,0.16)",
            background:
              "linear-gradient(145deg, rgba(24,18,32,0.96), rgba(8,16,29,0.96))",
            boxShadow:
              "0 14px 38px rgba(0,0,0,0.26)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "10px",
              marginBottom:
                "5px",
            }}
          >
            <span
              style={{
                color:
                  MAGENTA,
                fontSize:
                  "9px",
                fontWeight:
                  900,
                letterSpacing:
                  "0.13em",
                textTransform:
                  "uppercase",
              }}
            >
              {getTypeLabel(
                expedition.type
              )}
            </span>

            {isTrackingActive && (
              <span
                style={{
                  padding:
                    "5px 8px",
                  borderRadius:
                    "999px",
                  border:
                    "1px solid rgba(255,0,255,0.36)",
                  background:
                    "rgba(255,0,255,0.10)",
                  color:
                    "#FF74FF",
                  fontSize:
                    "9px",
                  fontWeight:
                    850,
                }}
              >
                ● {tx("Activa")}
              </span>
            )}
          </div>

          <h1
            style={{
              margin: 0,
              color:
                "#FFFFFF",
              fontFamily:
                Theme.Typography.title,
              fontSize:
                "clamp(1.8rem, 7vw, 2.35rem)",
              lineHeight:
                1.05,
            }}
          >
            {expedition.title}
          </h1>

          {expedition.description && (
            <p
              style={{
                margin:
                  "7px 0 10px",
                color:
                  "rgba(255,255,255,0.64)",
                fontSize:
                  "12px",
                lineHeight:
                  1.45,
              }}
            >
              {expedition.description}
            </p>
          )}

          {huarique && (
            <aside
              style={{
                margin: "9px 0 10px",
                padding: "10px",
                borderRadius: "13px",
                border: "1px solid rgba(255,61,232,0.24)",
                background: "linear-gradient(145deg, rgba(255,61,232,0.10), rgba(57,231,255,0.06))",
              }}
            >
              <strong
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#FF74FF",
                  fontSize: "10px",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={13} />
                {tx("Huarique verificado")}
              </strong>
              <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.76)", fontSize: "11px", lineHeight: 1.42 }}>
                <b>{tx("Por qué es un huarique")}:</b>{" "}
                {huarique.reason}
              </p>
              {huarique.signatureDish && (
                <p style={{ margin: "5px 0 0", color: CYAN, fontSize: "10px", fontWeight: 750 }}>
                  {tx("Plato recomendado")}: {huarique.signatureDish}
                </p>
              )}
              {huarique.hospesTip && (
                <p style={{ margin: "5px 0 0", color: "#FFB8F2", fontSize: "10px", fontWeight: 750 }}>
                  {tx("Consejo de Hospes")}: {huarique.hospesTip}
                </p>
              )}
            </aside>
          )}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "34px minmax(0,1fr)",
              gap: "9px",
              alignItems:
                "start",
              paddingTop:
                "9px",
              borderTop:
                "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: "34px",
                height:
                  "34px",
                display:
                  "grid",
                placeItems:
                  "center",
                borderRadius:
                  "11px",
                border:
                  "1px solid rgba(255,0,255,0.26)",
                background:
                  "rgba(255,0,255,0.08)",
                color:
                  MAGENTA,
              }}
            >
              <Sparkles
                size={17}
                strokeWidth={2}
              />
            </div>

            <div>
              <strong
                style={{
                  display:
                    "block",
                  color:
                    MAGENTA,
                  fontSize:
                    "11px",
                  marginBottom:
                    "3px",
                }}
              >
                {hospesMessage.title}
              </strong>

              <p
                style={{
                  margin: 0,
                  color:
                    "rgba(255,255,255,0.74)",
                  fontSize:
                    "11px",
                  lineHeight:
                    1.4,
                }}
              >
                {hospesMessage.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              isTrackingActive
                ? () =>
                    navigate(
                      "/journey"
                    )
                : handleStart
            }
            style={{
              width: "100%",
              minHeight:
                "48px",
              marginTop:
                "11px",
              border: "none",
              borderRadius:
                "14px",
              background:
                `linear-gradient(135deg, ${MAGENTA}, #D5009D)`,
              color:
                "#FFFFFF",
              fontSize:
                "13px",
              fontWeight:
                900,
              cursor:
                "pointer",
              boxShadow:
                "0 10px 26px rgba(255,0,255,0.22)",
            }}
          >
            {isTrackingActive
              ? `${tx("Misión activa · Ver recorrido")} →`
              : `${tx("Comenzar misión")} →`}
          </button>
        </section>

        {/* EL MAPA ES EL PROTAGONISTA */}
        <ExpeditionMap
          expedition={
            expedition
          }
          track={
            currentTrack
          }
          onSelectShare={(
            data
          ) => {
            setActiveMemory(
              data
            );
            setShareOpen(
              true
            );
          }}
        />

        {/* DATOS ÚTILES COMPACTOS, DESPUÉS DEL MAPA */}
        <section
          style={{
            marginTop:
              "10px",
            padding:
              "11px 12px",
            borderRadius:
              "17px",
            border:
              "1px solid rgba(57,231,255,0.20)",
            background:
              "linear-gradient(145deg, rgba(57,231,255,0.085), rgba(13,22,36,0.96))",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.22)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "7px",
              marginBottom:
                "8px",
            }}
          >
            <Sparkles
              size={15}
              color={CYAN}
            />

            <strong
              style={{
                color: CYAN,
                fontSize:
                  "10px",
                letterSpacing:
                  "0.10em",
                textTransform:
                  "uppercase",
              }}
            >
              {tx("Lo esencial")}
            </strong>
          </div>

          <div
            style={{
              display:
                "flex",
              flexWrap:
                "wrap",
              gap: "6px",
            }}
          >
            {information.map(
              ({
                label,
                value,
                icon: Icon,
              }) => (
                <div
                  key={`${label}-${value}`}
                  style={{
                    minHeight:
                      "36px",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    padding:
                      "6px 8px",
                    boxSizing:
                      "border-box",
                    borderRadius:
                      "11px",
                    border:
                      "1px solid rgba(255,255,255,0.055)",
                    background:
                      "rgba(255,255,255,0.032)",
                  }}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.9}
                    color={CYAN}
                  />

                  <div>
                    <span
                      style={{
                        display:
                          "block",
                        color:
                          "rgba(255,255,255,0.42)",
                        fontSize:
                          "7px",
                        fontWeight:
                          700,
                        lineHeight:
                          1,
                      }}
                    >
                      {label}
                    </span>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "2px",
                        color:
                          CYAN,
                        fontSize:
                          "9px",
                        lineHeight:
                          1.1,
                      }}
                    >
                      {value}
                    </strong>
                  </div>
                </div>
              )
            )}
          </div>

          {localTip && (
            <p
              style={{
                margin:
                  "8px 1px 0",
                color:
                  "rgba(255,255,255,0.62)",
                fontSize:
                  "9px",
                lineHeight:
                  1.35,
              }}
            >
              <span
                style={{
                  color:
                    MAGENTA,
                  fontWeight:
                    900,
                }}
              >
                {tx("Dato local")} ·{" "}
              </span>
              {localTip}
            </p>
          )}
        </section>

        {shareOpen &&
          activeMemory && (
            <MemoryPreviewModal
              isOpen={
                shareOpen
              }
              onClose={() =>
                setShareOpen(
                  false
                )
              }
              memoryData={
                activeMemory
              }
              experienceContext={
                expedition
              }
              mapContext={{
                center: [
                  expedition.latitude,
                  expedition.longitude,
                ],
                path:
                  currentTrack
                    ? currentTrack.timeline
                        .filter(
                          (
                            item: TimelineItem
                          ) =>
                            item.type !==
                            "memory"
                        )
                        .map(
                          (
                            item: TimelineItem
                          ) =>
                            [
                              item.lat,
                              item.lng,
                            ] as [
                              number,
                              number,
                            ]
                        )
                    : [],
                memories:
                  currentTrack
                    ? currentTrack.timeline.filter(
                        (
                          item: TimelineItem
                        ) =>
                          item.type ===
                          "memory"
                      )
                    : [],
              }}
            />
          )}
      </main>
    </div>
  );
}

export default Expedition;
