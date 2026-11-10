import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useGuardianCollection } from "../../hooks/useGuardianCollection";
import { tx } from "../../i18n";
import "./Guardians.css";

export default function GuardianCollectionLink({ experienceId }: { experienceId?: string }) {
  const collection = useGuardianCollection();
  const guardian = collection.find((item) => item.experienceId === experienceId);
  const collected = collection.filter((item) => item.collected).length;

  if (experienceId && (!guardian || !guardian.collected)) return null;

  return (
    <Link to="/guardianes" className="guardian-entry">
      <span className="guardian-entry__icon" aria-hidden="true"><Sparkles size={24} /></span>
      <span className="guardian-entry__copy">
        <strong>{guardian
          ? tx("{{name}} en tu colección", { name: tx(guardian.name) })
          : tx("Guardianes de Huancayo")}</strong>
        <span>{tx("{{count}} de {{total}} guardianes coleccionados", { count: collected, total: collection.length })}</span>
      </span>
      <ArrowRight size={20} aria-hidden="true" />
    </Link>
  );
}
