import {
  useEffect,
  useState,
} from "react";

import {
  Heart,
} from "lucide-react";

import {
  isFavorite,
  toggleFavorite,
} from "../data/user";

import {
  Theme,
} from "../styles/theme";

type Props = {
  experienceId:
    string;

  compact?:
    boolean;

  onChange?: (
    isNowFavorite: boolean
  ) => void;
};

function FavoriteButton({
  experienceId,
  compact = false,
  onChange,
}: Props) {
  const [
    selected,
    setSelected,
  ] = useState(
    () =>
      isFavorite(
        experienceId
      )
  );

  useEffect(() => {
    function syncFavorite() {
      setSelected(
        isFavorite(
          experienceId
        )
      );
    }

    window.addEventListener(
      "iguide-user-updated",
      syncFavorite
    );

    return () => {
      window.removeEventListener(
        "iguide-user-updated",
        syncFavorite
      );
    };
  }, [experienceId]);

  function handleClick(
    event:
      React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    const profile =
      toggleFavorite(
        experienceId
      );

    const isNowFavorite =
      profile.favorites.some(
        (favorite) =>
          favorite.experienceId ===
          experienceId
      );

    setSelected(
      isNowFavorite
    );

    onChange?.(
      isNowFavorite
    );
  }

  return (
    <button
      type="button"
      onClick={
        handleClick
      }
      aria-pressed={
        selected
      }
      aria-label={
        selected
          ? "Quitar de favoritos"
          : "Guardar en favoritos"
      }
      title={
        selected
          ? "Guardado en Mis lugares"
          : "Guardar para después"
      }
      style={{
        minWidth:
          compact
            ? "38px"
            : "44px",

        minHeight:
          compact
            ? "38px"
            : "44px",

        padding:
          compact
            ? "6px"
            : "8px 12px",

        borderRadius:
          Theme.Radius.pill,

        border:
          selected
            ? `1px solid ${Theme.Colors.primary}`
            : "1px solid rgba(255,255,255,0.12)",

        backgroundColor:
          selected
            ? "rgba(255,0,122,0.16)"
            : "rgba(255,255,255,0.05)",

        color:
          selected
            ? Theme.Colors.primary
            : "#FFFFFF",

        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap: "6px",

        cursor:
          "pointer",

        fontSize:
          "13px",

        fontWeight:
          700,

        transition:
          "background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
      }}
    >
      <Heart
        size={
          compact
            ? 20
            : 18
        }
        strokeWidth={
          selected
            ? 2.4
            : 2
        }
        fill={
          selected
            ? "currentColor"
            : "none"
        }
      />

      {!compact && (
        <span>
          {selected
            ? "Guardado"
            : "Guardar"}
        </span>
      )}
    </button>
  );
}

export default FavoriteButton;