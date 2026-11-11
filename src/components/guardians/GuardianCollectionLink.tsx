import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useCollectibleCollection } from "../../hooks/useCollectibleCollection";
import { tx } from "../../i18n";
import "./Guardians.css";

export default function GuardianCollectionLink({ experienceId }: { experienceId?: string }) {
  const { guardians: collection, stickers } = useCollectibleCollection();
  const guardian = collection.find((item) => item.experienceId === experienceId);
  const collected = [...collection, ...stickers].filter((item) => item.collected).length;

  if (experienceId && (!guardian || !guardian.collected)) return null;

  return (
    <Link to="/guardianes" className="guardian-entry">
      <span className="guardian-entry__icon" aria-hidden="true"><Sparkles size={24} /></span>
      <span className="guardian-entry__copy">
        <strong>{guardian
          ? tx("{{name}} en tu colección", { name: tx(guardian.name) })
          : tx("Mis coleccionables")}</strong>
        <span>{tx("{{count}} coleccionables obtenidos", { count: collected })}</span>
      </span>
      <ArrowRight size={20} aria-hidden="true" />
    </Link>
  );
}
