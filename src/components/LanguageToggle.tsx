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
        left: "7px",
        bottom: "max(18px, env(safe-area-inset-bottom))",
        zIndex: 110000,
        width: "50px",
        minHeight: "84px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        borderRadius: "17px",
        border:
          "1px solid rgba(255,255,255,0.18)",
        background:
          "linear-gradient(180deg, rgba(22,23,42,0.98), rgba(8,9,18,0.99))",
        color: "#FFFFFF",
        boxShadow:
          "0 10px 24px rgba(0,0,0,0.44), 0 0 18px rgba(66,232,245,0.12)",
        backdropFilter: "blur(16px)",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          width: "100%",
          fontSize: "9px",
          fontWeight: 900,
          letterSpacing: "0.04em",
        }}
      >
        <span
          style={{
            width: "40px",
            minHeight: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            borderRadius: "12px",
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
          <span style={{ fontSize: "17px", lineHeight: 1 }}>🇪🇸</span>
          <b>ES</b>
        </span>

        <span
          style={{
            color:
              "rgba(255,255,255,0.50)",
            width: "24px",
            height: "1px",
            overflow: "hidden",
            background:
              "rgba(255,255,255,0.16)",
          }}
        >
          ⇄
        </span>

        <span
          style={{
            width: "40px",
            minHeight: "34px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            borderRadius: "12px",
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
          <span style={{ fontSize: "17px", lineHeight: 1 }}>🇬🇧</span>
          <b>EN</b>
        </span>
      </span>
    </button>
  );
}

export default LanguageToggle;
