import {
  Compass,
  House,
  MapPinOff,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";

import logo from "../assets/branding/logo-dark-bg.png";
import { tx } from "../i18n";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding: "24px",
        background:
          "radial-gradient(circle at 10% 10%, rgba(255,32,206,0.13), transparent 32%), radial-gradient(circle at 90% 85%, rgba(66,232,245,0.10), transparent 34%), #080910",
        color: "#FFFFFF",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "430px",
          boxSizing: "border-box",
          padding: "28px 24px 24px",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(17,19,29,0.94)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <img
          src={logo}
          alt="I.GUIDE"
          style={{
            width: "116px",
            height: "64px",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            width: "74px",
            height: "74px",
            display: "grid",
            placeItems: "center",
            margin: "12px auto 18px",
            borderRadius: "24px",
            border: "1px solid rgba(255,61,232,0.28)",
            background: "rgba(255,61,232,0.08)",
            color: "#FF3DE8",
          }}
        >
          <MapPinOff size={35} strokeWidth={1.6} />
        </div>

        <span
          style={{
            color: "#42E8F5",
            fontSize: "10px",
            fontWeight: 900,
            letterSpacing: "0.13em",
          }}
        >
          ERROR 404
        </span>

        <h1
          style={{
            margin: "8px 0 10px",
            fontSize: "clamp(1.8rem, 7vw, 2.35rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
          }}
        >
          {tx("Este rincón no está en el mapa")}
        </h1>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: "330px",
            color: "rgba(255,255,255,0.64)",
            fontSize: "12px",
            lineHeight: 1.55,
          }}
        >
          {tx("La dirección no existe o cambió. Hospes puede ayudarte a retomar la exploración.")}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          <NotFoundLink to="/" icon={House} label={tx("Ir al inicio")} primary />
          <NotFoundLink to="/explorer" icon={Compass} label={tx("Explorar")} />
        </div>
      </section>
    </main>
  );
}

type NotFoundLinkProps = {
  to: string;
  icon: typeof House;
  label: string;
  primary?: boolean;
};

function NotFoundLink({
  to,
  icon: Icon,
  label,
  primary = false,
}: NotFoundLinkProps) {
  return (
    <Link
      to={to}
      style={{
        minHeight: "48px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        padding: "0 10px",
        borderRadius: "14px",
        border: primary
          ? "none"
          : "1px solid rgba(66,232,245,0.22)",
        background: primary
          ? "linear-gradient(145deg, #FF3DE8, #D4008D)"
          : "rgba(66,232,245,0.06)",
        color: "#FFFFFF",
        fontSize: "11px",
        fontWeight: 900,
        textDecoration: "none",
      }}
    >
      <Icon size={17} color={primary ? "#FFFFFF" : "#42E8F5"} />
      {label}
    </Link>
  );
}
