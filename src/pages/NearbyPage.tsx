import { useAppBack } from "../hooks/useAppBack";
import PageHeader from "../components/ui/PageHeader";
import { latLng } from "leaflet";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const { detailState } = useAppBack();
  const { startWalking } = useJourney();
  const { weather, isLoading, error } = useWeather();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [params, setParams] = useSearchParams();
  const radius = [1,3,5].includes(Number(params.get("radius"))) ? Number(params.get("radius")) : 1;
  const setRadius = (km:number) => { const next = new URLSearchParams(params); next.set("radius",String(km)); setParams(next,{replace:true}); };
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const saved = loadReturnPoint();
  const [locationRequest, setLocationRequest] = useState(0);
  function locate() {
    setLocationError(false);
    setLocating(true);
    setLocationRequest(value => value + 1);
  }
  useEffect(() => {
    let active = true;
    const fail = () => { if (active) { setLocationError(true); setLocating(false); } };
    if (!navigator.geolocation) {
      const timer = window.setTimeout(fail, 0);
      return () => { active = false; window.clearTimeout(timer); };
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (!active) return;
      setOrigin({ latitude: coords.latitude, longitude: coords.longitude, source: "gps" });
      setLocating(false);
    }, fail, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    return () => { active = false; };
  }, [locationRequest]);
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
        onPrimaryAction={() => immediate ? begin(experience) : navigate(`/expedition/${experience.slug}`, {state:detailState})}
        onViewDetails={() => navigate(`/expedition/${experience.slug}`, {state:detailState})} />
    </article>)}</div>;
  }
  return <main className="nearby-page">
    <PageHeader mapHref="/mapa" />
    <header><h1>{tx("Cerca de ti")}</h1><p>{tx("Elige qué hacer ahora alrededor de tu ubicación")}</p></header>
    <section className="nearby-controls" aria-label={tx("Ubicación y distancia")}>
      {locating ? <p role="status">{tx("Buscando tu ubicación…")}</p> : <button onClick={locate}>{tx("Actualizar mi ubicación")}</button>}
      {saved && !locating && (locationError || origin?.source === "return") && <button disabled={locating} onClick={() => { setLocationError(false); setOrigin({ latitude: saved.lat, longitude: saved.lng, source: "return" }); }}>{tx("Usar mi punto de regreso")}</button>}
      {locationError && <p role="alert">{tx("No pudimos obtener tu ubicación. Revisa el permiso o usa tu punto de regreso.")}</p>}
      {!origin && !locating && <p>{tx("Elige un punto de partida para encontrar lugares cercanos.")}</p>}
      {origin && <><p>{tx(origin.source === "gps" ? "Desde tu ubicación" : "Desde tu punto de regreso")}</p>
        <div className="nearby-radii">{[1,3,5].map(km => <button key={km} aria-pressed={radius === km} onClick={() => setRadius(km)}>{km} km</button>)}</div></>}
    </section>
    {origin && <section aria-label={tx("Mapa cercano · radio de 1 km")}>
      <h2>{tx("Mapa cercano · radio de 1 km")}</h2>
      <div className="nearby-map">
        <MapContainer key={`${origin.latitude}:${origin.longitude}:${origin.source}`}
          bounds={latLng(origin.latitude, origin.longitude).toBounds(2000)}
          boundsOptions={{ padding: [12, 12] }} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} maxZoom={20}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <Circle center={[origin.latitude, origin.longitude]} radius={1000}
            pathOptions={{ color: "#00bacd", weight: 1, fillOpacity: 0.04 }} interactive={false} />
          <CircleMarker center={[origin.latitude, origin.longitude]} radius={9}
            pathOptions={{ color: "#fff", fillColor: "#00cee5", fillOpacity: 1, weight: 3 }}>
            <Popup>{tx(origin.source === "gps" ? "Desde tu ubicación" : "Desde tu punto de regreso")}</Popup>
          </CircleMarker>
          {nearby.filter(item => item.distance <= 1).map(({ experience, distance }) =>
            <CircleMarker key={experience.experienceId} center={[experience.latitude, experience.longitude]} radius={7}
              pathOptions={{ color: "#fff", fillColor: readyIds.has(experience.experienceId) ? "#e600b8" : "#727681", fillOpacity: 1, weight: 2 }}>
              <Popup><strong>{experience.title}</strong><p>{Math.round(distance * 1000)} m · {tx("Distancia en línea recta")}</p>
                <p>{tx(readyIds.has(experience.experienceId) ? "Disponible según horario y condiciones" : "Consulta horarios y condiciones antes de salir")}</p>
                <Link to={`/expedition/${experience.slug}`} state={detailState}>{tx("Ver detalles")}</Link>
              </Popup>
            </CircleMarker>)}
        </MapContainer>
      </div>
    </section>}
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
