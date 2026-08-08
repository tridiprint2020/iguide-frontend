import {
  useTranslation,
} from "react-i18next";

import {
  tx,
} from "../i18n";

function LanguageToggle() {
  const {
    i18n,
  } = useTranslation();

  const isEnglish =
    i18n.resolvedLanguage
      ?.startsWith("en") ??
    false;

  async function toggleLanguage() {
    await i18n.changeLanguage(
      isEnglish
        ? "es"
        : "en"
    );
  }

  const accessibleLabel =
    isEnglish
      ? tx(
          "Cambiar idioma a español"
        )
      : tx(
          "Cambiar idioma a inglés"
        );

  return (
    <button
      type="button"
      data-export-ignore="true"
      onClick={() => {
        void toggleLanguage();
      }}
      aria-label={
        accessibleLabel
      }
      title={accessibleLabel}
      style={{
        position: "fixed",
        top: "max(12px, env(safe-area-inset-top))",
        right: "12px",
        zIndex: 110000,
        minWidth: "148px",
        minHeight: "48px",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        padding: "5px",
        borderRadius: "999px",
        border:
          "2px solid rgba(255,255,255,0.78)",
        background:
          "linear-gradient(145deg, rgba(20,22,37,0.98), rgba(7,8,14,0.99))",
        color: "#FFFFFF",
        boxShadow:
          "0 10px 28px rgba(0,0,0,0.48), 0 0 22px rgba(66,232,245,0.20)",
        backdropFilter: "blur(16px)",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          width: "100%",
          fontSize: "11px",
          fontWeight: 900,
          letterSpacing: "0.04em",
        }}
      >
        <span
          style={{
            flex: 1,
            minHeight: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            borderRadius: "999px",
            color: isEnglish
              ? "rgba(255,255,255,0.55)"
              : "#FFFFFF",
            background: isEnglish
              ? "transparent"
              : "linear-gradient(145deg, #FF3DE8, #D4008D)",
            boxShadow: isEnglish
              ? "none"
              : "0 5px 15px rgba(255,0,184,0.34)",
          }}
        >
          <span style={{ fontSize: "18px" }}>🇪🇸</span>
          <b>ES</b>
        </span>

        <span
          style={{
            color:
              "rgba(255,255,255,0.50)",
            fontSize: "13px",
          }}
        >
          ⇄
        </span>

        <span
          style={{
            flex: 1,
            minHeight: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            borderRadius: "999px",
            color: isEnglish
              ? "#061014"
              : "rgba(255,255,255,0.55)",
            background: isEnglish
              ? "linear-gradient(145deg, #42E8F5, #00BFD1)"
              : "transparent",
            boxShadow: isEnglish
              ? "0 5px 15px rgba(66,232,245,0.30)"
              : "none",
          }}
        >
          <span style={{ fontSize: "18px" }}>🇬🇧</span>
          <b>EN</b>
        </span>
      </span>
    </button>
  );
}

export default LanguageToggle;
