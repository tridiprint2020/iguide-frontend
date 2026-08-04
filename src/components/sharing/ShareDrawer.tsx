import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  onInstagram: () => void;
  onFacebook: () => void;
  onThreads: () => void;
  onTwitter: () => void;

  onDownload: () => void;
  onCopyLink: () => void;
};

function ShareDrawer({
  open,
  onClose,
  onInstagram,
  onFacebook,
  onThreads,
  onTwitter,
  onDownload,
  onCopyLink,
}: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const socialButtons = [
    {
      label: "Instagram",
      icon: "📷",
      action: onInstagram,
    },
    {
      label: "Facebook",
      icon: "📘",
      action: onFacebook,
    },
    {
      label: "Threads",
      icon: "🧵",
      action: onThreads,
    },
    {
      label: "Twitter",
      icon: "𝕏",
      action: onTwitter,
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/60
          transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          rounded-t-[24px]
          bg-[#161616]
          px-6 pt-4 pb-8
          shadow-2xl
          transition-transform duration-300 ease-out
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Drag Handle */}

        <div className="flex justify-center mb-5">
          <div className="w-14 h-1.5 rounded-full bg-gray-500" />
        </div>

        <h2 className="text-white text-lg font-semibold text-center">
          Compartir descubrimiento
        </h2>

        <p className="text-gray-400 text-sm text-center mt-1 mb-6">
          Comparte este momento con tus amigos
        </p>

        {/* Redes */}

        <div className="grid grid-cols-4 gap-4 mb-8">
          {socialButtons.map((button) => (
            <button
              key={button.label}
              onClick={button.action}
              className="
                flex flex-col items-center justify-center
                min-h-[64px]
                rounded-2xl
                bg-[#202020]
                hover:bg-[#2A2A2A]
                active:scale-95
                transition-all
              "
            >
              <span className="text-2xl">{button.icon}</span>

              <span className="mt-2 text-xs text-gray-300">
                {button.label}
              </span>
            </button>
          ))}
        </div>

        {/* Acciones */}

        <div className="space-y-3">
          <button
            onClick={onDownload}
            className="
              w-full
              min-h-[52px]
              rounded-full
              bg-pink-600
              hover:bg-pink-500
              active:scale-[0.98]
              transition-all
              text-white
              font-semibold
            "
          >
            Descargar imagen
          </button>

          <button
            onClick={onCopyLink}
            className="
              w-full
              min-h-[52px]
              rounded-full
              border
              border-gray-500
              hover:border-white
              hover:bg-white/5
              active:scale-[0.98]
              transition-all
              text-white
              font-medium
            "
          >
            Copiar enlace
          </button>
        </div>
      </div>
    </>
  );
}

export default ShareDrawer;