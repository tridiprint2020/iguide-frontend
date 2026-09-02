import {
  useEffect,
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
  ItineraryPlanActions,
} from "../components/itinerary/ItineraryPlanActions";
import {
  ItineraryPlanResult,
} from "../components/itinerary/ItineraryPlanResult";
import {
  SavedItineraryPlans,
} from "../components/itinerary/SavedItineraryPlans";
import {
  WeeklyForecast,
} from "../components/itinerary/WeeklyForecast";

import {
  loadUserProfile,
} from "../data/user";

import {
  buildItineraryPlan,
} from "../engine/itineraryEngine";

import {
  createItinerarySnapshot,
  deleteSavedItinerary,
  hydrateItinerarySnapshotWithReport,
  loadSavedItineraries,
  saveItineraryPlan,
} from "../engine/itineraryPersistenceEngine";

import {
  downloadItineraryCalendar,
  readSharedItinerary,
  shareItinerary,
} from "../engine/itineraryShareEngine";

import {
  fetchSevenDayForecast,
} from "../engine/weatherService";

import type {
  WeatherForecast,
  WeatherForecastDay,
} from "../engine/weatherEngine";
import {
  getWeatherPeriodDefinition,
  readWeatherItineraryHandoff,
} from "../engine/weatherPeriodEngine";

import type {
  ItineraryAnswers,
  ItineraryPlan,
  SavedItineraryPlan,
} from "../types/itinerary";

import logoIG from "../assets/branding/logo-dark-bg.png";

import {
  Theme,
} from "../styles/theme";
import { getAppLanguage, tx } from "../i18n";

const WANT_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "gastronomy", label: "Comer local" },
  {
    value: "culture",
    label: "Historia y cultura",
  },
  { value: "adventure", label: "Aventura" },
  {
    value: "photography",
    label: "Rincones y miradores",
  },
  { value: "crafts", label: "Artesanía" },
  {
    value: "festivals",
    label: "Fiestas locales",
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

const END_HOUR_OPTIONS = Array.from(
  { length: 14 },
  (_, index) => index + 8
); // 8:00 a 21:00

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
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatHour(hour: number): string {
  return new Date(
    2026,
    0,
    1,
    hour,
    0
  ).toLocaleTimeString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatHandoffDate(
  date: string
): string {
  const [year, month, day] =
    date.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  ).toLocaleDateString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );
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

function getOmittedStopsNotice(
  omittedStopCount: number
): string | null {
  if (omittedStopCount === 1) {
    return tx(
      "Se omitió 1 parada que ya no está disponible."
    );
  }

  if (omittedStopCount > 1) {
    return tx(
      "Se omitieron {{count}} paradas que ya no están disponibles.",
      {
        count: omittedStopCount,
      }
    );
  }

  return null;
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
  const weekdayLabels =
    getAppLanguage() === "en"
      ? ["M", "T", "W", "T", "F", "S", "S"]
      : WEEKDAY_LABELS;

  const initialShared = useMemo(() => {
    const result =
      readSharedItinerary();

    if (result.status !== "ready") {
      return {
        status: result.status,
        plan: null,
        snapshot: null,
        omittedStopCount: 0,
      } as const;
    }

    const hydration =
      hydrateItinerarySnapshotWithReport(
        result.snapshot
      );

    return {
      status: "ready",
      plan: hydration.plan,
      snapshot: result.snapshot,
      omittedStopCount:
        hydration.omittedStopCount,
    } as const;
  }, []);

  const initialWeatherHandoff = useMemo(
    () =>
      readWeatherItineraryHandoff(
        window.location.search
      ),
    []
  );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(
      initialShared.plan?.selectedDate ??
        initialWeatherHandoff?.date ??
        null
    );

  const [selectedHour, setSelectedHour] =
    useState<number | null>(
      initialShared.plan?.selectedHour ??
        initialWeatherHandoff
          ?.selectedHour ??
        null
    );

  const [selectedEndMinutes, setSelectedEndMinutes] =
    useState<number | null>(
      initialShared.plan?.endMinutes ??
        initialWeatherHandoff?.endMinutes ??
        null
    );

  const [wants, setWants] =
    useState<string[]>(
      initialShared.snapshot
        ?.preferences.priorities ?? []
    );

  const [showFullMonth, setShowFullMonth] =
    useState(false);

  const [transport, setTransport] =
    useState<
      "walking" | "transport" | "taxi" | null
    >(
      initialShared.snapshot
        ?.preferences.transport ?? null
    );

  const [forecast, setForecast] =
    useState<WeatherForecast | null>(null);

  const [forecastLoading, setForecastLoading] =
    useState(true);

  const [forecastError, setForecastError] =
    useState(false);

  const [plan, setPlan] =
    useState<ItineraryPlan | null>(
      initialShared.plan
    );

  const [savedPlans, setSavedPlans] =
    useState<SavedItineraryPlan[]>(
      () => loadSavedItineraries()
    );

  const [planActionBusy, setPlanActionBusy] =
    useState(false);

  const [saveFeedback, setSaveFeedback] =
    useState<{
      status: "saved" | "error";
      message: string;
    } | null>(null);

  const [planNotice, setPlanNotice] =
    useState<string | null>(() => {
      if (
        initialShared.status === "invalid" ||
        (initialShared.status === "ready" &&
          !initialShared.plan)
      ) {
        return tx(
          "El enlace compartido no es válido o sus lugares ya no están disponibles."
        );
      }

      if (initialShared.status !== "ready") {
        if (!initialWeatherHandoff) {
          return null;
        }

        const definition =
          getWeatherPeriodDefinition(
            initialWeatherHandoff.period
          );

        return tx(
          "Clima seleccionado: {{date}} · {{period}} · {{start}}–{{end}}. Elige qué quieres vivir y Hospes organizará esa franja.",
          {
            date: formatHandoffDate(
              initialWeatherHandoff.date
            ),
            period: tx(definition.label),
            start: formatHour(
              initialWeatherHandoff.selectedHour
            ),
            end: formatHour(
              initialWeatherHandoff.endMinutes /
                60
            ),
          }
        );
      }

      const baseNotice = tx(
        "Plan compartido abierto con el pronóstico guardado por su creador."
      );
      const omittedNotice =
        getOmittedStopsNotice(
          initialShared.omittedStopCount
        );

      return omittedNotice
        ? `${baseNotice} ${omittedNotice}`
        : baseNotice;
    });

  useEffect(() => {
    let active = true;

    void fetchSevenDayForecast()
      .then((nextForecast) => {
        if (!active) return;
        setForecast(nextForecast);
        setForecastError(false);
      })
      .catch(() => {
        if (!active) return;
        setForecastError(true);
      })
      .finally(() => {
        if (!active) return;
        setForecastLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedForecast = useMemo(
    () =>
      forecast?.days.find(
        (day) =>
          day.date === selectedDate
      ) ?? null,
    [forecast, selectedDate]
  );

  const canBuildPlan =
    selectedDate !== null &&
    selectedHour !== null &&
    selectedEndMinutes !== null &&
    selectedEndMinutes > selectedHour * 60 &&
    wants.length > 0;

  function getCurrentSnapshot() {
    if (!plan || wants.length === 0) {
      return null;
    }

    return createItinerarySnapshot(
      plan,
      {
        priorities: wants,
        transport:
          transport ?? "walking",
      }
    );
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(toIsoDate(date));
    setSelectedHour(null);
    setSelectedEndMinutes(null);
    setPlan(null);
    setPlanNotice(null);
  }

  function handleSelectForecastDate(
    day: WeatherForecastDay
  ) {
    setSelectedDate(day.date);
    setSelectedHour(null);
    setSelectedEndMinutes(null);
    setPlan(null);
    setPlanNotice(null);
  }

  async function handleRetryForecast() {
    setForecastLoading(true);
    setForecastError(false);

    try {
      const nextForecast =
        await fetchSevenDayForecast({
          forceRefresh: true,
        });
      setForecast(nextForecast);
    } catch {
      setForecastError(true);
    } finally {
      setForecastLoading(false);
    }
  }

  function handleBuildPlan() {
    if (
      !selectedDate ||
      selectedHour === null ||
      selectedEndMinutes === null ||
      wants.length === 0
    ) {
      return;
    }

    const answers: ItineraryAnswers = {
      selectedDate,
      selectedHour,
      endMinutes: selectedEndMinutes,
      priorities: wants,
      transport: transport ?? "walking",
    };

    const itinerary =
      buildItineraryPlan(
        {
          profile,
          answers,
        },
        {
          forecast: selectedForecast,
        }
      );

    setPlan(itinerary);
    setSaveFeedback(null);
    setPlanNotice(null);
  }

  function handleSavePlan() {
    const snapshot =
      getCurrentSnapshot();

    if (!plan || wants.length === 0 || !snapshot) {
      return;
    }

    try {
      const savedPlan = saveItineraryPlan(
        plan,
        snapshot.preferences
      );
      const reloadedPlans =
        loadSavedItineraries();

      if (
        !reloadedPlans.some(
          (item) => item.id === savedPlan.id
        )
      ) {
        throw new Error(
          "Saved itinerary was not found after reload."
        );
      }

      setSavedPlans(reloadedPlans);
      setSaveFeedback({
        status: "saved",
        message: tx(
          "Guardado y verificado en este celular."
        ),
      });
    } catch (error) {
      console.error(
        "No se pudo guardar el itinerario:",
        error
      );
      setSaveFeedback({
        status: "error",
        message: tx(
          "El navegador no confirmó el guardado. Revisa que el almacenamiento de I.GUIDE esté permitido."
        ),
      });
    }
  }

  async function handleSharePlan() {
    const snapshot =
      getCurrentSnapshot();

    if (!snapshot) return;

    setPlanActionBusy(true);

    try {
      const result = await shareItinerary(
        snapshot
      );

      if (result === "shared") {
        setPlanNotice(
          tx("Plan compartido.")
        );
      } else if (result === "copied") {
        setPlanNotice(
          tx(
            "Enlace copiado. Ya puedes pegarlo en WhatsApp o Messenger."
          )
        );
      }
    } catch (error) {
      console.error(
        "No se pudo compartir el itinerario:",
        error
      );
      setPlanNotice(
        tx(
          "No se pudo compartir el plan. Inténtalo nuevamente."
        )
      );
    } finally {
      setPlanActionBusy(false);
    }
  }

  function handleAddToCalendar() {
    const snapshot =
      getCurrentSnapshot();

    if (!snapshot) return;

    try {
      downloadItineraryCalendar(
        snapshot
      );
      setPlanNotice(
        tx(
          "Calendario descargado con una alarma 30 minutos antes."
        )
      );
    } catch (error) {
      console.error(
        "No se pudo crear el calendario:",
        error
      );
      setPlanNotice(
        tx(
          "No se pudo preparar el calendario. Inténtalo nuevamente."
        )
      );
    }
  }

  function handleOpenSavedPlan(
    savedPlan: SavedItineraryPlan
  ) {
    const hydration =
      hydrateItinerarySnapshotWithReport(
        savedPlan.snapshot
      );

    if (!hydration.plan) {
      setPlanNotice(
        tx(
          "No se pudo abrir el plan porque sus lugares ya no están disponibles."
        )
      );
      return;
    }

    setSelectedDate(
      savedPlan.snapshot.selectedDate
    );
    setSelectedHour(
      savedPlan.snapshot.selectedHour
    );
    setSelectedEndMinutes(
      savedPlan.snapshot.endMinutes
    );
    setWants(
      savedPlan.snapshot.preferences
        .priorities
    );
    setTransport(
      savedPlan.snapshot.preferences
        .transport
    );
    setPlan(hydration.plan);
    setSaveFeedback(null);

    const baseNotice = tx(
      "Plan guardado abierto con su pronóstico original."
    );
    const omittedNotice =
      getOmittedStopsNotice(
        hydration.omittedStopCount
      );

    setPlanNotice(
      omittedNotice
        ? `${baseNotice} ${omittedNotice}`
        : baseNotice
    );
  }

  function handleDeleteSavedPlan(
    savedPlan: SavedItineraryPlan
  ) {
    const confirmed = window.confirm(
      tx(
        "¿Eliminar este plan guardado de este celular?"
      )
    );

    if (!confirmed) return;

    setSavedPlans(
      deleteSavedItinerary(
        savedPlan.id
      )
    );
    setSaveFeedback(null);
    setPlanNotice(
      tx("Plan eliminado.")
    );
  }

  function handleReplace(index: number) {
    if (
      !plan ||
      !selectedDate ||
      selectedHour === null ||
      selectedEndMinutes === null ||
      wants.length === 0
    ) {
      return;
    }

    const usedIds = new Set(
      plan.stops.map(
        (stop) =>
          stop.experience.experienceId
      )
    );

    const answers: ItineraryAnswers = {
      selectedDate,
      selectedHour,
      endMinutes: selectedEndMinutes,
      priorities: wants,
      transport: transport ?? "walking",
    };

    const replacementPlan =
      buildItineraryPlan(
        {
          profile,
          answers,
        },
        {
          forecast: plan.forecast,
          excludedExperienceIds:
            Array.from(usedIds),
          action: "replaced",
        }
      );

    const replacement =
      replacementPlan?.stops[0];

    if (!replacement) return;

    const nextExperiences =
      plan.stops.map((stop, stopIndex) =>
        stopIndex === index
          ? replacement.experience
          : stop.experience
      );

    const rebuiltPlan =
      buildItineraryPlan(
        {
          profile,
          answers,
        },
        {
          forecast: plan.forecast,
          experiences: nextExperiences,
        }
      );

    if (
      !rebuiltPlan ||
      !rebuiltPlan.stops.some(
        (stop) =>
          stop.experience.experienceId ===
          replacement.experience.experienceId
      )
    ) {
      return;
    }

    const mergedExclusions = new Map(
      [
        ...plan.exclusions,
        ...rebuiltPlan.exclusions,
      ].map((item) => [
        item.experienceId,
        item,
      ])
    );

    setPlan({
      ...rebuiltPlan,
      exclusions: Array.from(
        mergedExclusions.values()
      ),
      stops: rebuiltPlan.stops.map(
        (stop) =>
          stop.experience.experienceId ===
          replacement.experience.experienceId
            ? {
                ...stop,
                explanation: {
                  ...stop.explanation,
                  action: "replaced",
                },
              }
            : stop
      ),
    });
    setSaveFeedback(null);
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
            ← {tx("Inicio")}
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
            {tx("Arma tu plan")}
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
            {tx("Itinerario")}
          </h1>
        </div>

        <WeeklyForecast
          forecast={forecast}
          loading={forecastLoading}
          hasError={forecastError}
          selectedDate={selectedDate}
          onSelect={handleSelectForecastDate}
          onRetry={handleRetryForecast}
        />

        {planNotice && (
          <p
            role="status"
            style={{
              margin: "-4px 0 14px",
              padding: "10px 12px",
              borderRadius: "13px",
              background:
                "rgba(57,231,255,0.07)",
              border:
                "1px solid rgba(57,231,255,0.16)",
              color:
                "rgba(255,255,255,0.78)",
              fontSize: "11px",
              lineHeight: 1.45,
            }}
          >
            {planNotice}
          </p>
        )}

        {!plan && (
          <SavedItineraryPlans
            plans={savedPlans}
            onOpen={handleOpenSavedPlan}
            onDelete={handleDeleteSavedPlan}
          />
        )}

        <button
          type="button"
          aria-expanded={showFullMonth}
          onClick={() =>
            setShowFullMonth((current) => !current)
          }
          style={{
            width: "100%",
            minHeight: "40px",
            marginBottom: "12px",
            borderRadius: "13px",
            border:
              "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.78)",
            fontSize: "12px",
            fontWeight: 750,
            cursor: "pointer",
          }}
        >
          <Calendar
            size={15}
            aria-hidden="true"
            style={{
              marginRight: "7px",
              verticalAlign: "-3px",
            }}
          />
          {showFullMonth
            ? tx("Ocultar calendario mensual")
            : tx("Ver todo el mes")}
        </button>

        {/* CALENDARIO MENSUAL OPCIONAL */}
        {showFullMonth && (
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
                getAppLanguage() === "en" ? "en-US" : "es-PE",
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
            {weekdayLabels.map((label, index) => (
              <span
                key={`${label}-${index}`}
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
        )}

        {selectedDate &&
          !forecastLoading &&
          !selectedForecast && (
            <p
              role="status"
              style={{
                margin:
                  "-6px 2px 16px",
                color:
                  "rgba(255,255,255,0.62)",
                fontSize: "11px",
                lineHeight: 1.45,
              }}
            >
              {tx(
                "Esa fecha está fuera del pronóstico disponible. Hospes aplicará el filtro conservador y no asumirá buen clima."
              )}
            </p>
          )}

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
                {tx("¿A qué hora empiezas?")}
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
                    setSelectedEndMinutes(null);
                    setPlan(null);
                    setPlanNotice(null);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* HORA FINAL */}
        {selectedHour !== null && (
          <section
            style={{ marginBottom: "16px" }}
          >
            <strong
              style={{
                display: "block",
                color: "#FFFFFF",
                fontSize: "13px",
                marginBottom: "10px",
              }}
            >
              {tx("¿Hasta qué hora tienes tiempo?")}
            </strong>

            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {END_HOUR_OPTIONS.filter(
                (hour) => hour > selectedHour
              ).map((hour) => (
                <Chip
                  key={hour}
                  label={formatHour(hour)}
                  selected={
                    selectedEndMinutes ===
                    hour * 60
                  }
                  onClick={() => {
                    setSelectedEndMinutes(
                      hour * 60
                    );
                    setPlan(null);
                    setPlanNotice(null);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* PREGUNTAS RÁPIDAS */}
        {selectedEndMinutes !== null && (
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
                {tx("¿Qué quieres vivir?")}
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
                    label={tx(option.label)}
                    selected={
                      wants.includes(option.value)
                    }
                    onClick={() => {
                      setWants((current) => {
                        if (option.value === "surprise") {
                          return current.includes("surprise")
                            ? []
                            : ["surprise"];
                        }

                        const withoutSurprise =
                          current.filter(
                            (value) =>
                              value !== "surprise"
                          );

                        return withoutSurprise.includes(
                          option.value
                        )
                          ? withoutSurprise.filter(
                              (value) =>
                                value !== option.value
                            )
                          : [
                              ...withoutSurprise,
                              option.value,
                            ];
                      });
                      setPlan(null);
                      setPlanNotice(null);
                    }}
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
                {tx("¿Cómo te moverás?")}
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
                      label={tx(option.label)}
                      selected={
                        transport ===
                        option.value
                      }
                      onClick={() => {
                        setTransport(
                          option.value
                        );
                        setPlan(null);
                        setPlanNotice(null);
                      }}
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
          {tx("Hospes, arma mi plan")}
        </button>

        {/* RESULTADO EXPLICABLE */}
        {plan && (
          <>
            <ItineraryPlanResult
              plan={plan}
              onStart={(slug) =>
                navigate(`/expedition/${slug}`)
              }
              onReplace={handleReplace}
            />

            {plan.stops.length > 0 && (
              <ItineraryPlanActions
                busy={planActionBusy}
                saveFeedback={saveFeedback}
                onSave={handleSavePlan}
                onShare={handleSharePlan}
                onAddToCalendar={
                  handleAddToCalendar
                }
              />
            )}

            <SavedItineraryPlans
              plans={savedPlans}
              onOpen={handleOpenSavedPlan}
              onDelete={handleDeleteSavedPlan}
            />
          </>
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
            {tx("¿Necesitas algo más específico?")}
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
            {tx("Preguntar a Hospes")} →
          </button>
        </section>
      </div>
    </main>
  );
}

export default ItineraryPage;
