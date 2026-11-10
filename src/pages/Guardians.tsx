import { useEffect } from "react";
import { ArrowUpRight, Check, Compass, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import GuardianEmblem from "../components/guardians/GuardianEmblem";
import PageHeader from "../components/ui/PageHeader";
import { useGuardianCollection } from "../hooks/useGuardianCollection";
import { getExperienceById } from "../repository/catalogRepository";
import { tx } from "../i18n";
import "../components/guardians/Guardians.css";

export default function Guardians() {
  const collection = useGuardianCollection();
  const collected = collection.filter((guardian) => guardian.collected).length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="guardians-page">
      <div className="guardians-content">
        <PageHeader />
        <header className="guardians-intro">
          <p className="guardians-eyebrow"><Compass size={14} aria-hidden="true" /> I.GUIDE · {tx("Tu colección")}</p>
          <h1>{tx("Guardianes de Huancayo")}</h1>
          <p>{tx("Cuatro lugares. Cuatro guardianes. Una colección que crece con tus aventuras.")}</p>
          <div className="guardians-progress">
            <label htmlFor="guardian-progress">{tx("{{count}} de {{total}} guardianes coleccionados", { count: collected, total: collection.length })}</label>
            <progress id="guardian-progress" value={collected} max={collection.length} />
          </div>
        </header>

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
                <h2>{tx(guardian.name)}</h2>
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

        <section className="guardians-how">
          <h2>{tx("Cada aventura deja un guardián")}</h2>
          <p>{tx("Abre la ficha de un lugar, inicia su misión y completa la llegada validada por la app. Su guardián se sumará a tu colección.")}</p>
          <p>{tx("Las misiones que ya completaste también cuentan. Tu colección se guarda en este navegador y dispositivo.")}</p>
          <Link to="/perfil">{tx("Ver mi progreso")} <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
    </main>
  );
}
