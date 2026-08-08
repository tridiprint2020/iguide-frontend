import {
  useRef,
  useState,
} from "react";

import {
  Route,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import MemoryCard from "../MemoryCard";
import ShareDrawer from "./ShareDrawer";

import {
  shareEngine,
} from "../../engine/shareEngine";

import {
  useJourney,
} from "../../context/JourneyContext";


import type {
  Experience,
} from "../../types/experience/experience";

import type {
  TimelineItem,
} from "../../types/tracking/tracking";

import type {
  MemoryCardData,
} from "../../types/memoryCard";
import { tx } from "../../i18n";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memoryData: MemoryCardData | null;
  experienceContext:
    | Experience
    | null;
  mapContext: {
    center: [number, number];
    path: [number, number][];
    memories: TimelineItem[];
  };
};

function MemoryPreviewModal({
  isOpen,
  onClose,
  memoryData,
  experienceContext,
  mapContext,
}: Props) {
  const navigate =
    useNavigate();

  const {
    startWalking,
  } = useJourney();

  const memoryCardRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  if (
    !isOpen ||
    !memoryData
  ) {
    return null;
  }

  const exportData:
    MemoryCardData = {
    ...memoryData,
    experienceId:
      experienceContext
        ?.experienceId,
    mapBackground:
      mapContext,
  };

  async function handleSocialShare() {
    await shareEngine.shareMemory(
      exportData,
      memoryCardRef.current
    );
  }

  async function handleCopyText() {
    await shareEngine.copyShareText(
      exportData
    );
  }

  async function handleDownload() {
    await shareEngine.downloadImage(
      exportData,
      memoryCardRef.current
    );
  }

  function handleStartActiveJourney() {
    onClose();

    if (
      experienceContext
    ) {
      startWalking(
        experienceContext
      );

      navigate(
        `/expedition/${experienceContext.slug}`
      );

      return;
    }

    navigate(
      "/explorer"
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:
          "fixed",
        inset: 0,
        zIndex: 99999,
        boxSizing:
          "border-box",
        overflowY:
          "auto",
        padding:
          "max(18px, env(safe-area-inset-top)) 14px max(28px, env(safe-area-inset-bottom))",
        backgroundColor:
          "rgba(6,6,6,0.94)",
        backdropFilter:
          "blur(16px)",
      }}
    >
      <div
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
        style={{
          width:
            "100%",
          maxWidth:
            "390px",
          margin:
            "0 auto",
          display:
            "flex",
          flexDirection:
            "column",
          gap:
            "14px",
        }}
      >
        <header
          style={{
            minHeight:
              "48px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "12px",
          }}
        >
          <div>
            <p
              style={{
                margin:
                  0,
                color:
                  "#FF3DE8",
                fontSize:
                  "9px",
                fontWeight:
                  900,
                letterSpacing:
                  "0.12em",
                textTransform:
                  "uppercase",
              }}
            >
              I.GUIDE
            </p>

            <h2
              style={{
                margin:
                  "3px 0 0",
                color:
                  "#FFFFFF",
                fontSize:
                  "17px",
              }}
            >
              {tx("Descubrimiento local")}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tx("Cerrar")}
            style={{
              width:
                "42px",
              height:
                "42px",
              display:
                "grid",
              placeItems:
                "center",
              borderRadius:
                "50%",
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(255,255,255,0.06)",
              color:
                "#FFFFFF",
              cursor:
                "pointer",
            }}
          >
            <X
              size={19}
            />
          </button>
        </header>

        <MemoryCard
          ref={memoryCardRef}
          data={
            exportData
          }
          onShare={() =>
            setShareOpen(
              true
            )
          }
          onDownload={
            handleDownload
          }
        />

        <button
          type="button"
          onClick={
            handleStartActiveJourney
          }
          style={{
            width:
              "100%",
            minHeight:
              "58px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            gap:
              "9px",
            border:
              "1px solid rgba(255,255,255,0.13)",
            borderRadius:
              "17px",
            background:
              "linear-gradient(145deg, #FF3DE8, #D4008D)",
            color:
              "#FFFFFF",
            fontSize:
              "14px",
            fontWeight:
              900,
            cursor:
              "pointer",
            boxShadow:
              "0 12px 28px rgba(255,0,184,0.25)",
          }}
        >
          <Route
            size={20}
            strokeWidth={2}
          />

          {tx("Comenzar misión local")}
        </button>
      </div>

      <ShareDrawer
        open={
          shareOpen
        }
        onClose={() =>
          setShareOpen(
            false
          )
        }
        onShare={
          handleSocialShare
        }
        onDownload={
          handleDownload
        }
        onCopyLink={
          handleCopyText
        }
      />
    </div>
  );
}

export default MemoryPreviewModal;
