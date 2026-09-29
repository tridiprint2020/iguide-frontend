import { Link } from "react-router-dom";
import { ArrowLeft, House } from "lucide-react";
import { useAppBack } from "../../hooks/useAppBack";
import { tx } from "../../i18n";
import logo from "../../assets/branding/logo-dark-bg.png";
import "./PageHeader.css";
export default function PageHeader({ contextual = false, mapHref }: { contextual?: boolean; mapHref?: string }) {
  const { goHome, goBack } = useAppBack();
  return <nav className="page-header" aria-label={tx("Navegación de página")}>
    <button type="button" onClick={contextual ? goBack : goHome}>
      {contextual ? <ArrowLeft size={16} /> : <House size={16} />}{tx(contextual ? "Volver" : "Inicio")}
    </button>
    <div className="page-header__right">
      {mapHref && <Link to={mapHref}>{tx("Ver en mapa")}</Link>}
      {contextual && <button type="button" onClick={goHome}>{tx("Inicio")}</button>}
      <img src={logo} alt="I.GUIDE" />
    </div>
  </nav>;
}
