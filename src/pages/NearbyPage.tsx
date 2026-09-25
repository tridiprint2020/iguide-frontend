import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { catalog } from "../data/catalog";
import { loadUserProfile } from "../data/user";
import { loadReturnPoint } from "../engine/returnPointEngine";
import { getRecommendations } from "../engine/recommendationEngine";
import { withinNearbyRadius } from "../engine/nearbyEngine";
import { useWeather } from "../context/WeatherContext";
import { useJourney } from "../context/JourneyContext";
import type { Experience } from "../types/experience";
import { tx } from "../i18n";
import "./NearbyPage.css";

type Origin = { latitude: number; longitude: number; source: "gps" | "return" };
const groups = [
  { label: "Comer o tomar algo", types: ["restaurant", "cafe", "food_route"] },
  { label: "Una visita cerca", types: ["expedition", "museum", "craft", "festival", "event"] },
  { label: "Bares y vida nocturna", types: ["bar", "nightclub"] },
];
export default function NearbyPage() {
  const navigate = useNavigate();
  const { startWalking } = useJourney();
  const { weather, isLoading, error } = useWeather();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [radius, setRadius] = useState(1);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const saved = loadReturnPoint();
  function locate() {
    setLocationError(false);
    if (!navigator.geolocation) { setLocationError(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setOrigin({ latitude: coords.latitude, longitude: coords.longitude, source: "gps" });
      setLocating(false);
    }, () => { setLocationError(true); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }
  const ready = getRecommendations({ profile: loadUserProfile() }, { weather: isLoading || error ? null : weather, currentDate: now });
  const readyIds = new Set(ready.map(item => item.experienceId));
  const nearby = origin ? withinNearbyRadius(catalog.filter(item => item.isActive !== false && item.type !== "hotel"), origin, radius) : [];
  const available = nearby.filter(item => readyIds.has(item.experience.experienceId));
  const later = nearby.filter(item => !readyIds.has(item.experience.experienceId));
  function begin(experience: Experience) {
    if (startWalking(experience)) navigate("/journey");
  }
  function cards(items: typeof nearby, immediate: boolean) {
    return <div className="nearby-grid">{items.map(({ experience, distance }) => <article key={experience.experienceId}>
      <p className="nearby-distance">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} · {tx("Distancia en línea recta")}</p>
      <p>{tx(immediate ? "Disponible según horario y condiciones" : "Consulta horarios y condiciones antes de salir")}</p>
      <NearbyPlaceCard experience={experience} primaryActionLabel={tx(immediate ? "Iniciar misión" : "Ver detalles")}
        onPrimaryAction={() => immediate ? begin(experience) : navigate(`/expedition/${experience.slug}`)}
        onViewDetails={() => navigate(`/expedition/${experience.slug}`)} />
    </article>)}</div>;
  }
  return <main className="nearby-page">
    <nav><Link to="/">← {tx("Inicio")}</Link><Link to="/mapa">{tx("Explorar el mapa")} →</Link></nav>
    <header><h1>{tx("Cerca de ti")}</h1><p>{tx("Elige qué hacer ahora alrededor de tu ubicación")}</p></header>
    <section className="nearby-controls" aria-label={tx("Ubicación y distancia")}>
      <button onClick={locate} disabled={locating}>{tx(locating ? "Buscando tu ubicación…" : "Usar mi ubicación")}</button>
      {saved && <button disabled={locating} onClick={() => { setLocationError(false); setOrigin({ latitude: saved.lat, longitude: saved.lng, source: "return" }); }}>{tx("Usar mi punto de regreso")}</button>}
      {locationError && <p role="alert">{tx("No pudimos obtener tu ubicación. Revisa el permiso o usa tu punto de regreso.")}</p>}
      {!origin && <p>{tx("Elige un punto de partida para encontrar lugares cercanos.")}</p>}
      {origin && <><p>{tx(origin.source === "gps" ? "Desde tu ubicación" : "Desde tu punto de regreso")}</p>
        <div className="nearby-radii">{[1,3,5].map(km => <button key={km} aria-pressed={radius === km} onClick={() => setRadius(km)}>{km} km</button>)}</div></>}
    </section>
    {origin && <>
      {!available.length && <p role="status">{tx("No hay opciones para iniciar ahora en este radio. Amplía la distancia o consulta opciones para otra ocasión.")}</p>}
      {groups.map(group => {
        const items = available.filter(item => group.types.includes(item.experience.type));
        return items.length ? <section key={group.label}><h2>{tx(group.label)}</h2>{cards(items.slice(0, 3), true)}
          {items.length > 3 && <details><summary>{tx("Más opciones alrededor")}</summary>{cards(items.slice(3), true)}</details>}
        </section> : null;
      })}
      {later.length > 0 && <details><summary>{tx("Para otra ocasión")} ({later.length})</summary>{cards(later, false)}</details>}
    </>}
  </main>;
}

function NearbyPlaceCard({ experience, primaryActionLabel, onPrimaryAction, onViewDetails }: {
  experience: Experience; primaryActionLabel: string; onPrimaryAction: () => void; onViewDetails: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const photo = [experience.image, experience.coverImage].find(value => value && !/logo|placeholder/i.test(value));
  return <div className="nearby-place">
    {photo && !failed ? <img src={photo} alt={experience.title} loading="lazy" onError={() => setFailed(true)} />
      : <div className="nearby-photo-placeholder">{tx("Foto del lugar pendiente")}</div>}
    <div className="nearby-place-body"><h3>{experience.title}</h3><p>{experience.description}</p>
      <button className="nearby-start" onClick={onPrimaryAction}>{primaryActionLabel} →</button>
      {primaryActionLabel !== tx("Ver detalles") && <button className="nearby-details" onClick={onViewDetails}>{tx("Ver detalles")}</button>}
    </div>
  </div>;
}
