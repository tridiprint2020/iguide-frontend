import {
  useEffect,
  useState,
} from "react";
import { tx } from "../../i18n";

type Props = {
  open: boolean;
  onClose: () => void;

  /*
   * Contrato nuevo.
   */
  onShare?: () =>
    void | Promise<void>;

  onDownload: () =>
    void | Promise<void>;

  onCopyLink: () =>
    void | Promise<void>;

  /*
   * Compatibilidad temporal con los
   * componentes anteriores.
   *
   * Se eliminarán cuando PointSavedView
   * y MemoryPreviewModal sean migrados.
   */
  onInstagram?: () =>
    void | Promise<void>;

  onFacebook?: () =>
    void | Promise<void>;

  onThreads?: () =>
    void | Promise<void>;

  onTwitter?: () =>
    void | Promise<void>;
};

function ShareDrawer({
  open,
  onClose,
  onShare,
  onDownload,
  onCopyLink,
  onInstagram,
  onFacebook,
  onThreads,
  onTwitter,
}: Props) {
  const [busyAction, setBusyAction] =
    useState<
      | "share"
      | "download"
      | "copy"
      | null
    >(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [open]);

  /*
   * Prioridad:
   *
   * 1. Usa la acción moderna onShare.
   * 2. Si todavía no fue migrada, reutiliza
   *    la primera acción social disponible.
   */
  const legacyShareAction =
    onInstagram ??
    onFacebook ??
    onThreads ??
    onTwitter;

  const effectiveShareAction =
    onShare ??
    legacyShareAction;

  async function handleShare() {
    if (
      !effectiveShareAction ||
      busyAction
    ) {
      return;
    }

    setBusyAction("share");

    try {
      await effectiveShareAction();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownload() {
    if (busyAction) {
      return;
    }

    setBusyAction("download");

    try {
      await onDownload();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCopyLink() {
    if (busyAction) {
      return;
    }

    setBusyAction("copy");

    try {
      await onCopyLink();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position:
            "fixed",

          inset: 0,

          zIndex:
            10040,

          backgroundColor:
            "rgba(0,0,0,0.68)",

          opacity:
            open ? 1 : 0,

          pointerEvents:
            open
              ? "auto"
              : "none",

          transition:
            "opacity 0.22s ease",
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={tx("Compartir recuerdo")}
        style={{
          position:
            "fixed",

          left: 0,
          right: 0,
          bottom: 0,

          zIndex:
            10050,

          boxSizing:
            "border-box",

          width:
            "100%",

          maxWidth:
            "620px",

          margin:
            "0 auto",

          padding:
            "12px 18px max(24px, env(safe-area-inset-bottom))",

          borderRadius:
            "24px 24px 0 0",

          backgroundColor:
            "#161616",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 -20px 55px rgba(0,0,0,0.52)",

          transform:
            open
              ? "translateY(0)"
              : "translateY(105%)",

          transition:
            "transform 0.26s ease-out",

          pointerEvents:
            open
              ? "auto"
              : "none",
        }}
      >
        <div
          style={{
            width:
              "52px",

            height:
              "5px",

            margin:
              "0 auto 17px",

            borderRadius:
              "999px",

            backgroundColor:
              "#555555",
          }}
        />

        <header
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              "12px",

            marginBottom:
              "18px",
          }}
        >
          <div>
            <span
              style={{
                display:
                  "block",

                color:
                  "#FF00FF",

                fontSize:
                  "10px",

                fontWeight:
                  800,

                letterSpacing:
                  "0.08em",

                textTransform:
                  "uppercase",
              }}
            >
              I.GUIDE
            </span>

            <h2
              style={{
                margin:
                  "3px 0 0",

                color:
                  "#FFFFFF",

                fontSize:
                  "19px",
              }}
            >
              {tx("Comparte tu recuerdo")}
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",

                color:
                  "rgba(255,255,255,0.58)",

                fontSize:
                  "12px",

                lineHeight:
                  1.4,
              }}
            >
              {tx("Envía la experiencia o guarda la imagen en tu dispositivo.")}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label={tx("Cerrar")}
            style={{
              width:
                "38px",

              height:
                "38px",

              flexShrink:
                0,

              borderRadius:
                "50%",

              border:
                "1px solid rgba(255,255,255,0.10)",

              background:
                "rgba(255,255,255,0.05)",

              color:
                "#FFFFFF",

              fontSize:
                "20px",

              cursor:
                "pointer",
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            display:
              "grid",

            gap:
              "10px",
          }}
        >
          {effectiveShareAction && (
            <button
              type="button"
              disabled={busyAction !== null}
              aria-busy={
                busyAction === "share"
              }
              onClick={() => {
                void handleShare();
              }}
              style={{
                minHeight:
                  "52px",

                border:
                  "none",

                borderRadius:
                  "14px",

                backgroundColor:
                  "#FF00FF",

                color:
                  "#FFFFFF",

                fontSize:
                  "14px",

                fontWeight:
                  800,

                cursor:
                  busyAction
                    ? "wait"
                    : "pointer",

                opacity:
                  busyAction &&
                  busyAction !== "share"
                    ? 0.55
                    : 1,
              }}
            >
              {busyAction === "share"
                ? tx("Preparando…")
                : `↗ ${tx("Compartir")}`}
            </button>
          )}

          <button
            type="button"
            disabled={busyAction !== null}
            aria-busy={
              busyAction === "download"
            }
            onClick={() => {
              void handleDownload();
            }}
            style={{
              minHeight:
                "50px",

              borderRadius:
                "14px",

              border:
                "1px solid rgba(255,255,255,0.13)",

              backgroundColor:
                "rgba(255,255,255,0.05)",

              color:
                "#FFFFFF",

              fontSize:
                "13px",

              fontWeight:
                750,

              cursor:
                busyAction
                  ? "wait"
                  : "pointer",

              opacity:
                busyAction &&
                busyAction !== "download"
                  ? 0.55
                  : 1,
            }}
          >
            {busyAction === "download"
              ? tx("Preparando imagen…")
              : `↓ ${tx("Descargar imagen")}`}
          </button>

          <button
            type="button"
            disabled={busyAction !== null}
            aria-busy={
              busyAction === "copy"
            }
            onClick={() => {
              void handleCopyLink();
            }}
            style={{
              minHeight:
                "44px",

              border:
                "none",

              background:
                "transparent",

              color:
                "rgba(255,255,255,0.62)",

              fontSize:
                "12px",

              fontWeight:
                650,

              cursor:
                busyAction
                  ? "wait"
                  : "pointer",
            }}
          >
            {busyAction === "copy"
              ? tx("Copiando…")
              : `🔗 ${tx("Copiar enlace")}`}
          </button>
        </div>

        <p
          style={{
            margin:
              "16px 0 0",

            color:
              "rgba(255,255,255,0.34)",

            textAlign:
              "center",

            fontSize:
              "10px",

            lineHeight:
              1.4,
          }}
        >
          {tx("Próximamente podrás elegir si deseas destacar la fotografía, ruta, tiempo, hitos o nota.")}
        </p>
      </section>
    </>
  );
}

export default ShareDrawer;
