import {
  Languages,
} from "lucide-react";

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
        top: "max(10px, env(safe-area-inset-top))",
        right: "12px",
        zIndex: 12000,
        minWidth: "78px",
        minHeight: "38px",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        padding: "7px 10px",
        borderRadius: "999px",
        border:
          "1px solid rgba(255,255,255,0.20)",
        background:
          "linear-gradient(145deg, rgba(20,22,37,0.94), rgba(7,8,14,0.96))",
        color: "#FFFFFF",
        boxShadow:
          "0 8px 24px rgba(0,0,0,0.32), 0 0 16px rgba(66,232,245,0.08)",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
      }}
    >
      <Languages
        size={15}
        color="#42E8F5"
        strokeWidth={2}
      />

      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "9px",
          fontWeight: 900,
          letterSpacing: "0.06em",
        }}
      >
        <b
          style={{
            color: isEnglish
              ? "rgba(255,255,255,0.42)"
              : "#FF65DF",
          }}
        >
          ES
        </b>
        <span
          style={{
            color:
              "rgba(255,255,255,0.28)",
          }}
        >
          |
        </span>
        <b
          style={{
            color: isEnglish
              ? "#42E8F5"
              : "rgba(255,255,255,0.42)",
          }}
        >
          EN
        </b>
      </span>
    </button>
  );
}

export default LanguageToggle;
