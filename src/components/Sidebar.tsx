import {
  Compass,
  Heart,
  House,
  Map,
  Route as RouteIcon,
  UserRound,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import NeonIcon from "./ui/NeonIcon";

import {
  NeonTheme,
} from "../styles/neonTheme";

import type {
  NeonTone,
} from "../styles/neonTheme";

type NavigationItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  tone: NeonTone;
  end?: boolean;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    to: "/",
    icon: House,
    label: "Inicio",
    tone: "magenta",
    end: true,
  },
  {
    to: "/explorer",
    icon: Compass,
    label: "Explorar",
    tone: "cyan",
  },
  {
    to: "/mapa",
    icon: Map,
    label: "Mapa",
    tone: "magenta",
  },
  {
    to: "/itinerario",
    icon: RouteIcon,
    label: "Itinerario",
    tone: "cyan",
  },
  {
    to: "/favoritos",
    icon: Heart,
    label: "Favoritos",
    tone: "magenta",
  },
  {
    to: "/perfil",
    icon: UserRound,
    label: "Perfil",
    tone: "cyan",
  },
];

function Sidebar() {
  return (
    <aside
      aria-label="Navegación principal"
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

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            aria-label={item.label}
            style={({ isActive }) => ({
              marginTop:
                item.to === "/perfil"
                  ? "auto"
                  : undefined,
              width: "50px",
              height: "50px",
              flexShrink: 0,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              textDecoration: "none",
              background: isActive
                ? item.tone === "cyan"
                  ? "linear-gradient(145deg, rgba(0,230,255,0.19), rgba(15,18,37,0.95))"
                  : "linear-gradient(145deg, rgba(255,61,232,0.21), rgba(15,18,37,0.95))"
                : "transparent",
              border: isActive
                ? item.tone === "cyan"
                  ? "1px solid rgba(0,230,255,0.42)"
                  : "1px solid rgba(255,61,232,0.42)"
                : "1px solid transparent",
              boxShadow: isActive
                ? item.tone === "cyan"
                  ? NeonTheme.Shadows.cyan
                  : NeonTheme.Shadows.magenta
                : "none",
              transform: isActive
                ? "scale(1.04)"
                : "scale(1)",
              transition:
                "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
            })}
          >
            {({ isActive }) => (
              <NeonIcon
                icon={Icon}
                tone={item.tone}
                size={25}
                strokeWidth={1.55}
                active={isActive}
              />
            )}
          </NavLink>
        );
      })}
    </aside>
  );
}

export default Sidebar;
