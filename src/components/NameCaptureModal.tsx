import { useState } from "react";
import type { UserProfile } from "../types/user/user";
import { loadUserProfile, saveUserProfile } from "../data/user";

interface NameCaptureModalProps {
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export function NameCaptureModal({ onClose, onProfileUpdated }: NameCaptureModalProps) {
  const [nameInput, setNameInput] = useState<string>("");

  const handleSaveName = (method: "google" | "guest") => {
    // Si no escribió nada, asignamos un nombre según el botón
    const finalName = nameInput.trim() || (method === "google" ? "Google Explorer" : "Explorador");

    const currentProfile: UserProfile = loadUserProfile();
    currentProfile.name = finalName;
    currentProfile.firstVisit = false; // Marcamos que ya pasó el hito inicial

    saveUserProfile(currentProfile);
    onProfileUpdated(currentProfile); // Notificamos a la UI padre para reflejar el cambio
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#1A202C", // Negro Wanka estricto
        borderRadius: "16px",
        padding: "30px",
        maxWidth: "380px",
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #2d3748"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "22px", margin: "0 0 8px 0", color: "#FF5A5F", letterSpacing: "1px" }}>
            ¡Gran Aventura! 🏆
          </h3>
          <p style={{ color: "#a0aec0", fontSize: "14px", margin: 0 }}>
            Para guardar tus insignias y progreso en tu pasaporte digital, ¿cómo te gustaría llamarte?
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Tu nombre de explorador..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #4a5568",
              backgroundColor: "#2d3748",
              color: "#ffffff",
              fontSize: "15px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          onClick={() => handleSaveName("google")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#ffffff",
            color: "#1A202C",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <span>🌐</span> Guardar con Google
        </button>

        <button
          onClick={() => handleSaveName("guest")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #4a5568",
            backgroundColor: "transparent",
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "15px"
          }}
        >
          Continuar como invitado
        </button>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a0aec0",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Ahora no, guardar como anónimo
          </button>
        </div>
      </div>
    </div>
  );
}
