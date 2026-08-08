import { loadUserProfile } from "../data/user";
import { Theme } from "../styles/theme";
import { tx } from "../i18n";

export default function WelcomeHeader() {
  const user = loadUserProfile();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: Theme.Colors.text,
        }}
      >
        {tx("¡Hola, {{name}}!", { name: user.name })} 👋
      </span>

      <h1
        style={{
          margin: 0,
          lineHeight: 1,
          fontWeight: 300,
          fontSize: "clamp(52px,7vw,82px)",
          color: Theme.Colors.text,
        }}
      >
        {tx("Bienvenido a")}
      </h1>

      <h1
        style={{
          margin: 0,
          lineHeight: 0.9,
          fontWeight: 900,
          fontSize: "clamp(56px,8vw,92px)",
          color: Theme.Colors.primary,
        }}
      >
        Huancayo
      </h1>

      <p
        style={{
          marginTop: 18,
          color: Theme.Colors.textSoft,
          fontSize: 24,
          lineHeight: 1.6,
        }}
      >
        {tx("No visites. Pertenece.")}
        <br />
        {tx("Vive la ciudad como un local.")}
      </p>
    </div>
  );
}
