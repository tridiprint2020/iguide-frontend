import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Calendar,
  Clock,
  Route,
  Sparkles,
} from "lucide-react";

import {
  loadUserProfile,
} from "../data/user";

import {
  buildItinerary,
} from "../engine/itineraryEngine";

import type {
  Experience,
} from "../types/experience";

import type {
  ItineraryAnswers,
} from "../types/itinerary";

import logoIG from "../assets/optimized/logoig.webp";

import {
  Theme,
} from "../styles/theme";

const WANT_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "gastronomy", label: "Comer local" },
  { value: "adventure", label: "Aventura" },
  {
    value: "photography",
    label: "Rincones y miradores",
  },
  { value: "nightlife", label: "Vida nocturna" },
  { value: "surprise", label: "Sorpréndeme" },
];

const TRANSPORT_OPTIONS: {
  value: "walking" | "transport" | "taxi";
  label: string;
}[] = [
  { value: "walking", label: "Caminando" },
  { value: "transport", label: "Transporte" },
  { value: "taxi", label: "Taxi" },
];

const HOUR_OPTIONS = Array.from(
  { length: 14 },
  (_, index) => index + 7
); // 7:00 a 20:00

const WEEKDAY_LABELS = [
  "L",
  "M",
  "X",
  "J",
  "V",
  "S",
  "D",
];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "pm" : "am";
  const displayHour =
    hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

function buildMonthGrid(
  reference: Date
): (Date | null)[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  // Lunes = 0 ... Domingo = 6
  const firstWeekday =
    (firstDay.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: "999px",
        border: selected
          ? "1px solid rgba(255,0,200,0.55)"
          : "1px solid rgba(255,255,255,0.12)",
        background: selected
          ? "linear-gradient(135deg, #FF00C8, #B500FF)"
          : "rgba(255,255,255,0.05)",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 750,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ItineraryPage() {
  const navigate = useNavigate();
  const profile = useMemo(
    () => loadUserProfile(),
    []
  );

  const today = useMemo(
    () => new Date(),
    []
  );

  const monthCells = useMemo(
    () => buildMonthGrid(today),
    [today]
  );

  const todayIso = toIsoDate(today);

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [selectedHour, setSelectedHour] =
    useState<number | null>(null);

  const [want, setWant] =
    useState<string | null>(null);

  const [transport, setTransport] =
    useState<
      "walking" | "transport" | "taxi" | null
    >(null);

  const [results, setResults] =
    useState<Experience[] | null>(null);

  const canBuildPlan =
    selectedDate !== null &&
    selectedHour !== null &&
    want !== null;

  function handleSelectDate(date: Date) {
    setSelectedDate(toIsoDate(date));
    setSelectedHour(null);
    setResults(null);
  }

  function handleBuildPlan() {
    if (
      !selectedDate ||
      selectedHour === null ||
      !want
    ) {
      return;
    }

    const answers: ItineraryAnswers = {
      selectedDate,
      selectedHour,
      priority: want,
      transport: transport ?? "walking",
    };

    const itinerary = buildItinerary({
      profile,
      answers,
    });

    setResults(itinerary);
  }

  function handleReplace(index: number) {
    if (
      !results ||
      !selectedDate ||
      selectedHour === null ||
      !want
    ) {
      return;
    }

    const usedIds = new Set(
      results.map((e) => e.experienceId)
    );

    const answers: ItineraryAnswers = {
      selectedDate,
      selectedHour,
      priority: want,
      transport: transport ?? "walking",
    };

    const replacement = buildItinerary({
      profile: {
        ...profile,
        visitedExperiences: [
          ...profile.visitedExperiences,
          ...Array.from(usedIds),
        ],
      },
      answers,
    })[0];

    if (!replacement) return;

    setResults((current) => {
      if (!current) return current;
      const next = [...current];
      next[index] = replacement;
      return next;
    });
  }

  function scheduleTimeFor(index: number): string {
    if (selectedHour === null) return "";
    const hour =
      selectedHour + Math.round(index * 1.5);
    return formatHour(
      hour > 23 ? hour - 24 : hour
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        backgroundColor:
          Theme.Colors.background,
        padding: "16px 12px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {/* ENCABEZADO */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            marginBottom: "15px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              minHeight: "40px",
              padding: "8px 14px",
              borderRadius: "12px",
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(255,255,255,0.06)",
              color: Theme.Colors.text,
              fontSize: "12px",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            ← Inicio
          </button>

          <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: "72px",
              maxHeight: "48px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </header>

        {/* TÍTULO */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginBottom: "18px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#FF00C8",
            }}
          >
            Arma tu plan
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              lineHeight: 1,
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            Itinerario
          </h1>
        </div>

        {/* CALENDARIO */}
        <section
          style={{
            borderRadius: "24px",
            padding: "18px",
            background:
              "linear-gradient(180deg, rgba(20,20,34,0.96), rgba(16,16,28,0.96))",
            border:
              "1px solid rgba(255,255,255,0.06)",
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.24)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Calendar
              size={16}
              strokeWidth={2.2}
              color="#FF00C8"
            />
            <strong
              style={{
                color: "#FFFFFF",
                fontSize: "13px",
              }}
            >
              {today.toLocaleDateString(
                "es-PE",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, 1fr)",
              gap: "4px",
              marginBottom: "6px",
            }}
          >
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  color:
                    "rgba(255,255,255,0.45)",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, 1fr)",
              gap: "4px",
            }}
          >
            {monthCells.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} />;
              }

              const iso = toIsoDate(date);
              const isPast = iso < todayIso;
              const isSelected =
                iso === selectedDate;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() =>
                    handleSelectDate(date)
                  }
                  style={{
                    aspectRatio: "1",
                    borderRadius: "10px",
                    border: isSelected
                      ? "1px solid rgba(255,0,200,0.6)"
                      : "1px solid transparent",
                    background: isSelected
                      ? "linear-gradient(135deg, #FF00C8, #B500FF)"
                      : "rgba(255,255,255,0.03)",
                    color: isPast
                      ? "rgba(255,255,255,0.20)"
                      : "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: isSelected
                      ? 800
                      : 600,
                    cursor: isPast
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </section>

        {/* HORA */}
        {selectedDate && (
          <section
            style={{
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <Clock
                size={16}
                strokeWidth={2.2}
                color="#39E7FF"
              />
              <strong
                style={{
                  color: "#FFFFFF",
                  fontSize: "13px",
                }}
              >
                ¿A qué hora empiezas?
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {HOUR_OPTIONS.map((hour) => (
                <Chip
                  key={hour}
                  label={formatHour(hour)}
                  selected={
                    selectedHour === hour
                  }
                  onClick={() => {
                    setSelectedHour(hour);
                    setResults(null);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* PREGUNTAS RÁPIDAS */}
        {selectedHour !== null && (
          <>
            <section
              style={{ marginBottom: "14px" }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                ¿Qué quieres vivir?
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {WANT_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={
                      want === option.value
                    }
                    onClick={() =>
                      setWant(option.value)
                    }
                  />
                ))}
              </div>
            </section>

            <section
              style={{ marginBottom: "18px" }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                ¿Cómo te moverás?
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {TRANSPORT_OPTIONS.map(
                  (option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={
                        transport ===
                        option.value
                      }
                      onClick={() =>
                        setTransport(
                          option.value
                        )
                      }
                    />
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* BOTÓN PRINCIPAL */}
        <button
          type="button"
          disabled={!canBuildPlan}
          onClick={handleBuildPlan}
          style={{
            width: "100%",
            minHeight: "54px",
            border: "none",
            borderRadius: "18px",
            background: canBuildPlan
              ? "linear-gradient(135deg, #FF00C8, #D100FF)"
              : "rgba(255,255,255,0.08)",
            color: canBuildPlan
              ? "#FFFFFF"
              : "rgba(255,255,255,0.35)",
            fontSize: "16px",
            fontWeight: 800,
            cursor: canBuildPlan
              ? "pointer"
              : "not-allowed",
            boxShadow: canBuildPlan
              ? "0 12px 32px rgba(255,0,200,0.30)"
              : "none",
            marginBottom: "18px",
          }}
        >
          <Sparkles
            size={16}
            strokeWidth={2.4}
            style={{
              marginRight: "8px",
              verticalAlign: "-3px",
            }}
          />
          Hospes, arma mi plan
        </button>

        {/* RESULTADO */}
        {results && results.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {results.map((experience, index) => (
              <article
                key={experience.experienceId}
                style={{
                  borderRadius: "18px",
                  padding: "14px",
                  background:
                    "rgba(255,255,255,0.03)",
                  border:
                    "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 3px",
                      color: "#39E7FF",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    {scheduleTimeFor(index)}
                  </p>
                  <strong
                    style={{
                      display: "block",
                      color: "#FFFFFF",
                      fontSize: "14px",
                    }}
                  >
                    {experience.title}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/expedition/${experience.slug}`
                      )
                    }
                    style={{
                      minHeight: "36px",
                      padding: "0 12px",
                      border: "none",
                      borderRadius: "10px",
                      background:
                        "linear-gradient(135deg, #FF00C8, #B500FF)",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Iniciar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleReplace(index)
                    }
                    style={{
                      minHeight: "36px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(255,255,255,0.12)",
                      background:
                        "rgba(255,255,255,0.05)",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Reemplazar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* CTA HOSPES */}
        <section
          style={{
            padding: "16px",
            borderRadius: "16px",
            background:
              "rgba(255,0,200,0.06)",
            border:
              "1px solid rgba(255,0,200,0.18)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.7)",
              fontSize: "12px",
            }}
          >
            <Route size={14} strokeWidth={2.2} />
            ¿Necesitas algo más específico?
          </div>

          <button
            type="button"
            onClick={() => navigate("/hospes")}
            style={{
              width: "100%",
              minHeight: "42px",
              border: "none",
              borderRadius: "12px",
              backgroundColor:
                Theme.Colors.primary,
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Preguntar a Hospes →
          </button>
        </section>
      </div>
    </main>
  );
}

export default ItineraryPage;
