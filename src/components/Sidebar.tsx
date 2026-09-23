import {
  Binoculars,
  Heart,
  House,
  Map,
  CalendarDays,
  UserRound,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import "./Sidebar.css";
import NearbyIcon from "./ui/NearbyIcon";

import {
  tx,
} from "../i18n";

type NavigationItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  nearby?: boolean;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    to: "/",
    icon: House,
    label: "Inicio",
    end: true,
  },
  {
    to: "/explorer",
    icon: Binoculars,
    label: "Explorar",
  },
  {
    to: "/mapa",
    icon: Map,
    label: "Mapa",
  },
  {
    to: "/mapa?nearby=all",
    icon: Map,
    label: "Cerca de ti",
    nearby: true,
  },
  {
    to: "/favoritos",
    icon: Heart,
    label: "Favoritos",
  },
  {
    to: "/itinerario",
    icon: CalendarDays,
    label: "Itinerario",
  },
  {
    to: "/perfil",
    icon: UserRound,
    label: "Perfil",
  },
];

function Sidebar() {
  const location = useLocation();
  const nearby = new URLSearchParams(location.search).get("nearby") === "all";
  const activeFor = (item: NavigationItem, active: boolean) =>
    item.nearby ? active && nearby : item.to === "/mapa" ? active && !nearby : active;
  return (
    <aside
      aria-label={tx("Navegación principal")}
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: "64px",
        zIndex: 1000,
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "9px",
        padding: "102px 7px 18px",
        background: `linear-gradient(
          180deg,
          rgba(18,19,38,0.98),
          rgba(10,11,22,0.98)
        )`,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "8px 0 30px rgba(0,0,0,0.20)",
      }}
    >
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const translatedLabel =
          tx(item.label);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={translatedLabel}
            aria-label={translatedLabel}
            className={({ isActive }) => `sidebar-link sidebar-link--${["/", "/mapa", "/favoritos", "/perfil"].includes(item.to) ? "magenta" : "cyan"}${item.to === "/" ? " sidebar-link--home" : ""}${activeFor(item, isActive) ? " sidebar-link--active" : ""}`}
          >
            <span className="sidebar-link__icon" aria-hidden="true">
              {item.nearby ? <NearbyIcon /> : <Icon size={25} strokeWidth={1.55} />}
            </span>
          </NavLink>
        );
      })}
    </aside>
  );
}

export default Sidebar;
