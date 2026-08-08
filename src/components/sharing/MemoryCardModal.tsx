import {
  useRef,
} from "react";

import MemoryCard from "../MemoryCard";

import {
  shareEngine,
} from "../../engine/shareEngine";

import type {
  MemoryCardData,
} from "../../types/memoryCard";
import { tx } from "../../i18n";

type Props = {
  open: boolean;
  data: MemoryCardData | null;
  onClose: () => void;
  onShare?: (
    data: MemoryCardData
  ) => void;
};

export default function MemoryCardModal({
  open,
  data,
  onClose,
  onShare,
}: Props) {
  const memoryCardRef =
    useRef<HTMLElement | null>(
      null
    );

  if (
    !open ||
    !data
  ) {
    return null;
  }

  const cardData = data;

  async function handleDownload() {
    await shareEngine.downloadImage(
      cardData,
      memoryCardRef.current
    );
  }

  async function handleShare() {
    if (onShare) {
      onShare(cardData);
      return;
    }

    await shareEngine.shareMemory(
      cardData,
      memoryCardRef.current
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tx("MemoryCard de {{title}}", { title: cardData.title })}
      onClick={onClose}
      style={{
        position:
          "fixed",
        inset: 0,
        zIndex: 20000,
        overflowY:
          "auto",
        boxSizing:
          "border-box",
        padding:
          "max(24px, env(safe-area-inset-top)) 14px max(36px, env(safe-area-inset-bottom))",
        backgroundColor:
          "rgba(0,0,0,0.84)",
        backdropFilter:
          "blur(12px)",
      }}
    >
      <section
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
          alignItems:
            "center",
          gap:
            "14px",
        }}
      >
        <header
          style={{
            width:
              "100%",
            minHeight:
              "52px",
            boxSizing:
              "border-box",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "12px",
            padding:
              "10px 12px 10px 16px",
            borderRadius:
              "18px",
            border:
              "1px solid rgba(255,255,255,0.08)",
            backgroundColor:
              "#151515",
          }}
        >
          <div
            style={{
              minWidth:
                0,
            }}
          >
            <p
              style={{
                margin:
                  0,
                overflow:
                  "hidden",
                color:
                  "#FFFFFF",
                fontSize:
                  "14px",
                fontWeight:
                  800,
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {cardData.title}
            </p>

            <p
              style={{
                margin:
                  "2px 0 0",
                color:
                  "#A1A1AA",
                fontSize:
                  "11px",
              }}
            >
              {tx("Una experiencia vivida como local")}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Cerrar MemoryCard"
            style={{
              width:
                "40px",
              height:
                "40px",
              flexShrink:
                0,
              borderRadius:
                "50%",
              border:
                "1px solid rgba(255,255,255,0.10)",
              backgroundColor:
                "#242424",
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

        <MemoryCard
          ref={
            memoryCardRef
          }
          data={cardData}
          onShare={
            handleShare
          }
          onDownload={
            handleDownload
          }
        />

        <button
          type="button"
          onClick={
            onClose
          }
          style={{
            width:
              "100%",
            minHeight:
              "50px",
            borderRadius:
              "15px",
            border:
              "1px solid rgba(255,255,255,0.12)",
            backgroundColor:
              "#151515",
            color:
              "#FFFFFF",
            fontWeight:
              700,
            cursor:
              "pointer",
          }}
        >
          {tx("Volver al mapa")}
        </button>
      </section>
    </div>
  );
}
