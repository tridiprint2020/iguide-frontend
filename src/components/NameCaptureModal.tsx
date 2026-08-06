import {
  useState,
} from "react";

import {
  Compass,
  Sparkles,
} from "lucide-react";

import type {
  FormEvent,
} from "react";

import type {
  UserProfile,
} from "../types/user/user";

import {
  loadUserProfile,
  saveUserProfile,
} from "../data/user";

import logoIG from "../assets/optimized/logoig.webp";

interface NameCaptureModalProps {
  onClose: () => void;

  onProfileUpdated: (
    updatedUser: UserProfile
  ) => void;
}

export function NameCaptureModal({
  onClose,
  onProfileUpdated,
}: NameCaptureModalProps) {
  const [
    nameInput,
    setNameInput,
  ] = useState(
    "Explorador"
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    const cleanName =
      nameInput
        .trim()
        .slice(0, 30);

    const finalName =
      cleanName ||
      "Explorador";

    const currentProfile =
      loadUserProfile();

    const updatedProfile:
      UserProfile = {
      ...currentProfile,

      name:
        finalName,

      firstVisit:
        false,
    };

    saveUserProfile(
      updatedProfile
    );

    onProfileUpdated(
      updatedProfile
    );

    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hospes-welcome-title"
      style={{
        position: "fixed",

        inset: 0,

        zIndex: 100000,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        boxSizing: "border-box",

        padding: "22px",

        overflowY: "auto",

        background:
          "rgba(3, 4, 12, 0.88)",

        backdropFilter:
          "blur(14px)",
      }}
    >
      <form
        onSubmit={
          handleSubmit
        }
        style={{
          position: "relative",

          width: "100%",

          maxWidth: "410px",

          boxSizing:
            "border-box",

          overflow: "hidden",

          padding:
            "28px 24px 24px",

          borderRadius:
            "28px",

          border:
            "1px solid rgba(255, 61, 232, 0.28)",

          background: `
            radial-gradient(
              circle at 12% 8%,
              rgba(255, 61, 232, 0.20),
              transparent 34%
            ),
            radial-gradient(
              circle at 92% 94%,
              rgba(0, 230, 255, 0.10),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              rgba(24, 25, 47, 0.99),
              rgba(8, 9, 18, 0.99)
            )
          `,

          boxShadow: `
            0 30px 90px rgba(0, 0, 0, 0.66),
            0 0 38px rgba(255, 61, 232, 0.13)
          `,

          color: "#FFFFFF",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",

            top: "-50px",

            left: "50%",

            width: "190px",

            height: "100px",

            transform:
              "translateX(-50%)",

            borderRadius:
              "50%",

            background:
              "rgba(255, 61, 232, 0.16)",

            filter:
              "blur(35px)",

            pointerEvents:
              "none",
          }}
        />

        <div
          style={{
            position: "relative",

            zIndex: 2,

            display: "flex",

            flexDirection:
              "column",

            alignItems:
              "center",

            textAlign:
              "center",
          }}
        >
          <img
            src={logoIG}
            alt="I.GUIDE"
            style={{
              width: "92px",

              maxHeight:
                "58px",

              objectFit:
                "contain",

              display: "block",

              marginBottom:
                "18px",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "relative",

              width: "68px",

              height: "68px",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              marginBottom:
                "18px",

              borderRadius:
                "22px",

              border:
                "1px solid rgba(255, 61, 232, 0.40)",

              background:
                "linear-gradient(145deg, rgba(255,61,232,0.20), rgba(12,13,25,0.96))",

              boxShadow:
                "0 0 25px rgba(255, 61, 232, 0.24)",
            }}
          >
            <Compass
              size={35}
              strokeWidth={1.45}
              color="#FF3DE8"
              style={{
                filter:
                  "drop-shadow(0 0 9px rgba(255,61,232,0.76))",
              }}
            />

            <Sparkles
              size={15}
              strokeWidth={1.7}
              color="#00E6FF"
              style={{
                position:
                  "absolute",

                top: "7px",

                right: "7px",

                filter:
                  "drop-shadow(0 0 7px rgba(0,230,255,0.80))",
              }}
            />
          </div>

          <p
            style={{
              margin:
                "0 0 6px",

              color:
                "#FF3DE8",

              fontSize:
                "10px",

              fontWeight:
                900,

              letterSpacing:
                "0.13em",

              textTransform:
                "uppercase",
            }}
          >
            Tu anfitrión local
          </p>

          <h2
            id="hospes-welcome-title"
            style={{
              margin:
                "0 0 13px",

              color:
                "#FFFFFF",

              fontSize:
                "28px",

              lineHeight: 1.1,

              fontWeight:
                900,

              letterSpacing:
                "-0.035em",
            }}
          >
            Hola, soy Hospes
          </h2>

          <p
            style={{
              maxWidth:
                "315px",

              margin:
                "0 0 24px",

              color:
                "rgba(255,255,255,0.72)",

              fontSize:
                "13px",

              lineHeight:
                1.6,
            }}
          >
            Seré tu anfitrión
            durante tus aventuras.
            Antes de comenzar,
            quisiera saber:
          </p>

          <label
            htmlFor="traveler-name"
            style={{
              alignSelf:
                "stretch",

              marginBottom:
                "8px",

              color:
                "rgba(255,255,255,0.88)",

              fontSize:
                "13px",

              fontWeight:
                800,

              textAlign:
                "left",
            }}
          >
            ¿Cómo deseas que te
            llame?
          </label>

          <input
            id="traveler-name"
            type="text"
            value={nameInput}
            onChange={(
              event
            ) =>
              setNameInput(
                event.target
                  .value
              )
            }
            onFocus={(
              event
            ) =>
              event.currentTarget
                .select()
            }
            autoFocus
            autoComplete="name"
            maxLength={30}
            placeholder="Explorador"
            style={{
              width: "100%",

              minHeight:
                "52px",

              boxSizing:
                "border-box",

              padding:
                "13px 15px",

              borderRadius:
                "14px",

              border:
                "1px solid rgba(255,255,255,0.13)",

              outline:
                "none",

              background:
                "rgba(255,255,255,0.055)",

              color:
                "#FFFFFF",

              caretColor:
                "#FF3DE8",

              fontSize:
                "16px",

              fontWeight:
                750,

              textAlign:
                "left",

              boxShadow:
                "inset 0 0 0 1px rgba(255,61,232,0.03)",

              transition:
                "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
          />

          <p
            style={{
              alignSelf:
                "stretch",

              margin:
                "8px 0 20px",

              color:
                "rgba(255,255,255,0.38)",

              fontSize:
                "10px",

              lineHeight:
                1.4,

              textAlign:
                "left",
            }}
          >
            Puedes dejar
            “Explorador” o escribir
            tu nombre.
          </p>

          <button
            type="submit"
            disabled={
              isSaving
            }
            style={{
              width: "100%",

              minHeight:
                "52px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap: "8px",

              padding:
                "12px 18px",

              border:
                "1px solid rgba(255,255,255,0.12)",

              borderRadius:
                "15px",

              background:
                isSaving
                  ? "rgba(255,61,232,0.45)"
                  : "linear-gradient(145deg, #FF3DE8, #D4008D)",

              color:
                "#FFFFFF",

              boxShadow:
                "0 10px 28px rgba(255, 0, 184, 0.29)",

              fontSize:
                "14px",

              fontWeight:
                900,

              cursor:
                isSaving
                  ? "default"
                  : "pointer",

              opacity:
                isSaving
                  ? 0.7
                  : 1,
            }}
          >
            {isSaving
              ? "Preparando tu aventura…"
              : "Comenzar aventura"}
          </button>

          <p
            style={{
              margin:
                "16px 0 0",

              color:
                "rgba(255,255,255,0.35)",

              fontSize:
                "10px",

              lineHeight:
                1.4,
            }}
          >
            Podrás cambiar tu
            nombre más adelante
            desde Perfil.
          </p>
        </div>
      </form>
    </div>
  );
}