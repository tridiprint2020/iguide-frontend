import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Compass, LockKeyhole, Maximize2, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import GuardianEmblem from "../components/guardians/GuardianEmblem";
import StickerPreview from "../components/guardians/StickerPreview";
import PageHeader from "../components/ui/PageHeader";
import { useCollectibleCollection } from "../hooks/useCollectibleCollection";
import { collectibleCollections, type CollectibleSticker } from "../data/collectibles";
import { getExperienceById } from "../repository/catalogRepository";
import { tx } from "../i18n";
import "../components/guardians/Guardians.css";

export default function Guardians() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCollection = collectibleCollections.find((item) => item.id === searchParams.get("coleccion")) ?? collectibleCollections[0];
  const { guardians: collection, stickers } = useCollectibleCollection(selectedCollection.id);
  const collected = collection.filter((guardian) => guardian.collected).length;
  const [selectedSticker, setSelectedSticker] = useState<CollectibleSticker | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="guardians-page">
      <div className="guardians-content">
        <PageHeader />
        <header className="guardians-intro">
          <p className="guardians-eyebrow"><Compass size={14} aria-hidden="true" /> I.GUIDE · {tx("Tu colección")}</p>
          <h1>{tx(selectedCollection.title)}</h1>
          <p>{tx("Lugares que descubres. Recuerdos que coleccionas.")}</p>
          <nav className="collectible-regions" aria-label={tx("Elige tu colección")}>
            {collectibleCollections.map((item) => (
              <button key={item.id} type="button" aria-pressed={item.id === selectedCollection.id}
                onClick={() => setSearchParams((params) => {
                  params.set("coleccion", item.id);
                  return params;
                })}>
                <MapPin size={14} aria-hidden="true" /> {tx(item.place)}
              </button>
            ))}
          </nav>
          {collection.length > 0 && <div className="guardians-progress">
            <label htmlFor="guardian-progress">{tx("{{count}} de {{total}} guardianes coleccionados", { count: collected, total: collection.length })}</label>
            <progress id="guardian-progress" value={collected} max={collection.length} />
          </div>}
        </header>

        {collection.length > 0 && <section aria-labelledby="guardian-section-title" className="collectibles-section">
        <h2 id="guardian-section-title" className="collectibles-section-title">{tx("Guardianes")}</h2>
        <ol className="guardians-grid">
          {collection.map((guardian, index) => {
            const experience = getExperienceById(guardian.experienceId);
            const available = experience && experience.isActive !== false;
            return (
              <li key={guardian.id} className={`guardian-card guardian-card--${guardian.id}${guardian.collected ? " guardian-card--collected" : ""}`}>
                <div className="guardian-card__top">
                  <span className="guardian-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="guardian-status">
                    {guardian.collected ? <Check size={14} aria-hidden="true" /> : <LockKeyhole size={13} aria-hidden="true" />}
                    {tx(guardian.collected ? "Coleccionado" : "Por descubrir")}
                  </span>
                </div>
                <div className="guardian-art"><GuardianEmblem id={guardian.id} /></div>
                <h3>{tx(guardian.name)}</h3>
                <p className="guardian-place">{experience ? tx(experience.title) : tx("Misión en preparación")}</p>
                {available ? (
                  <Link className="guardian-mission" to={`/expedition/${experience.slug}`}>
                    {tx(guardian.collected ? "Volver al lugar" : "Conocer su misión")} <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ) : <p className="guardian-unavailable">{tx("Misión temporalmente no disponible")}</p>}
              </li>
            );
          })}
        </ol>
        </section>}

        {stickers.length > 0 && <section aria-labelledby="sticker-section-title" className="collectibles-section">
          <h2 id="sticker-section-title" className="collectibles-section-title">{tx("Stickers")}</h2>
          <p className="collectibles-section-copy">{tx("Pequeños recuerdos de los oficios del lugar. Toca un sticker para verlo en grande.")}</p>
          <ol className="guardians-grid">
            {stickers.map((sticker) => {
              const experience = sticker.experienceId ? getExperienceById(sticker.experienceId) : undefined;
              return (
                <li key={sticker.id} className="sticker-card">
                  <span className="guardian-status">{tx(sticker.collected ? "Coleccionado" : experience ? "Por descubrir" : "En preparación")}</span>
                  <button type="button" className="sticker-art" onClick={() => setSelectedSticker(sticker)}
                    aria-label={tx("Ampliar sticker {{name}}", { name: tx(sticker.name) })}>
                    <img src={sticker.image} alt={tx(sticker.name)} width="640" height="640" loading="lazy" />
                    <Maximize2 size={17} aria-hidden="true" />
                  </button>
                  <h3>{tx(sticker.name)}</h3>
                  <p className="sticker-venue">{sticker.venue}</p>
                  <p className="guardian-place">{sticker.place}</p>
                  {experience && experience.isActive !== false && (
                    <Link className="guardian-mission" to={`/expedition/${experience.slug}`}>
                      {tx("Conocer su misión")} <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>}

        {collection.length === 0 && stickers.length === 0 && <section className="guardians-how">
          <h2>{tx("Una nueva colección está por llegar")}</h2>
          <p>{tx("Estamos preparando los lugares y coleccionables de {{place}}.", { place: tx(selectedCollection.place) })}</p>
        </section>}

        {collection.length > 0 && <section className="guardians-how">
          <h2>{tx("Cada aventura deja un guardián")}</h2>
          <p>{tx("Abre la ficha de un lugar, inicia su misión y completa la llegada validada por la app. Su guardián se sumará a tu colección.")}</p>
          <p>{tx("Las misiones que ya completaste también cuentan. Tu colección se guarda en este navegador y dispositivo.")}</p>
          <Link to="/perfil">{tx("Ver mi progreso")} <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>}
        {selectedSticker && <StickerPreview sticker={selectedSticker} onClose={() => setSelectedSticker(null)} />}
      </div>
    </main>
  );
}
