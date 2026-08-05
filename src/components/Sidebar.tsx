import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Theme,
} from "../styles/theme";

import {
  useJourney,
} from "../context/JourneyContext";

const navItems = [
  {
    to: "/",
    icon: "🏠",
    label: "Inicio",
  },

  {
    to: "/explorer",
    icon: "🧭",
    label: "Explorar",
  },

  {
    to: "/favoritos",
    icon: "❤️",
    label: "Favoritos",
  },

  {
    to: "/mapa",
    icon: "🗺️",
    label: "Mapa",
  },

  {
    to: "/perfil",
    icon: "👤",
    label: "Perfil",
  },
];

function Sidebar() {
  const navigate =
    useNavigate();

  const {
    resetToHome,
  } = useJourney();

  function handleHomeClick(
    event:
      React.MouseEvent<
        HTMLAnchorElement
      >
  ) {
    event.preventDefault();

    /*
     * Pausa la vista de misión sin eliminar
     * el track persistido. La burbuja activa
     * permitirá retomarlo después.
     */
    resetToHome();

    navigate("/");
  }

  return (
    <aside
      style={{
        position: "fixed",

        top: 0,
        bottom: 0,
        left: 0,

        width: "64px",

        zIndex: 1000,

        boxSizing:
          "border-box",

        overflow: "hidden",

        backgroundColor:
          Theme.Colors.surface,

        borderRight:
          "1px solid rgba(255,255,255,0.05)",

        padding:
          "102px 7px 18px",

        display: "flex",

        flexDirection:
          "column",

        alignItems:
          "stretch",

        gap: "10px",
      }}
    >
      {navItems.map(
        (item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            aria-label={
              item.label
            }
            onClick={
              item.to === "/"
                ? handleHomeClick
                : undefined
            }
            style={({
              isActive,
            }) => ({
              width: "50px",
              height: "50px",

              boxSizing:
                "border-box",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              borderRadius:
                "16px",

              textDecoration:
                "none",

              color: "#FFFFFF",

              backgroundColor:
                isActive
                  ? Theme.Colors.primary
                  : "transparent",

              border:
                isActive
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid transparent",

              fontSize: "23px",

              transition:
                "transform .18s ease, background-color .18s ease",
            })}
          >
            <span
              aria-hidden="true"
              style={{
                lineHeight: 1,
              }}
            >
              {item.icon}
            </span>
          </NavLink>
        )
      )}
    </aside>
  );
}

export default Sidebar;