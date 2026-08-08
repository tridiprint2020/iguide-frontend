import {
  toBlob,
} from "html-to-image";

import type {
  MemoryCardData,
} from "../types/memoryCard";
import { tx } from "../i18n";

export interface SharePayload {
  title: string;
  text: string;
}

function getExportPixelRatio(): number {
  if (
    typeof window !== "undefined" &&
    window.matchMedia(
      "(max-width: 520px)"
    ).matches
  ) {
    /*
     * Evita picos de memoria en Chrome Android al
     * rasterizar una tarjeta que contiene un mapa.
     */
    return 1;
  }

  return 2;
}

function sanitizeFileName(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9-_]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /(^-|-$)/g,
      ""
    )
    .toLowerCase();
}

function buildShareText(
  cardData: MemoryCardData
): string {
  const note =
    cardData.note?.trim();

  const sections = [
    tx("Completé {{title}} en {{city}} con I.GUIDE.", { title: cardData.title, city: cardData.city }),
    note
      ? `“${note}”`
      : null,
    tx("{{distance}} km · {{count}} recuerdo(s)", { distance: cardData.stats.totalDistanceKm.toFixed(2), count: cardData.stats.totalMemories }),
    tx("No visites. Pertenece. Vive la ciudad como un local."),
    "#IGuide #LiveLikeLocal #FeelTheCity",
  ];

  return sections
    .filter(
      (
        section
      ): section is string =>
        Boolean(section)
    )
    .join("\n\n");
}

function waitForImage(
  image: HTMLImageElement
): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error(tx("La fotografía todavía se está preparando."))),
      6000
    );

    image.addEventListener(
      "load",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );

    image.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeout);
        reject(new Error(tx("No se pudo cargar una imagen de la tarjeta.")));
      },
      { once: true }
    );
  });
}

async function waitForCardMedia(
  nodeRef: HTMLElement
): Promise<void> {
  const startedAt = Date.now();

  while (
    nodeRef.dataset.iguideMediaReady === "false" &&
    Date.now() - startedAt < 6000
  ) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 80);
    });
  }

  if (nodeRef.dataset.iguideMediaReady === "false") {
    throw new Error(
      tx("La fotografía todavía se está preparando. Inténtalo nuevamente en un momento.")
    );
  }

  await Promise.all(
    Array.from(nodeRef.querySelectorAll("img")).map(waitForImage)
  );
}

async function renderCardBlob(
  nodeRef: HTMLElement
): Promise<Blob> {
  await waitForCardMedia(nodeRef);

  const blob =
    await toBlob(
      nodeRef,
      {
        /* Los recuerdos de IndexedDB se muestran con blob URLs. */
        cacheBust: false,
        pixelRatio:
          getExportPixelRatio(),
        backgroundColor:
          "#090A12",
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            node.dataset
              .exportIgnore ===
              "true"
          ) {
            return false;
          }

          return true;
        },
      }
    );

  if (!blob) {
    throw new Error(
      tx("No se pudo crear la imagen de la MemoryCard.")
    );
  }

  return blob;
}

async function nativeShare(
  payload: SharePayload,
  file?: File
): Promise<boolean> {
  if (!navigator.share) {
    await navigator.clipboard.writeText(
      payload.text
    );

    alert(
      tx("Descripción copiada. Ya puedes pegarla en tu red favorita.")
    );

    return false;
  }

  try {
    const shareData:
      ShareData = {
      title:
        payload.title,
      text:
        payload.text,
    };

    if (
      file &&
      navigator.canShare?.({
        files: [file],
      })
    ) {
      shareData.files =
        [file];
    }

    await navigator.share(
      shareData
    );

    return true;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name ===
        "AbortError"
    ) {
      return false;
    }

    throw error;
  }
}

export const shareEngine = {
  async downloadImage(
    cardData: MemoryCardData,
    nodeRef: HTMLElement | null
  ): Promise<boolean> {
    if (!nodeRef) {
      alert(
        tx("La MemoryCard todavía no está lista para exportarse.")
      );

      return false;
    }

    try {
      const blob =
        await renderCardBlob(
          nodeRef
        );

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        objectUrl;

      anchor.download =
        `iguide-${sanitizeFileName(
          cardData.title ||
            cardData.placeLabel ||
            "memory-card"
        )}-${Date.now()}.png`;

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            objectUrl
          ),
        1500
      );

      return true;
    } catch (error) {
      console.error(
        "No se pudo descargar la MemoryCard:",
        error
      );

      alert(
        tx("No se pudo generar la imagen. Inténtalo nuevamente con el mapa completamente cargado.")
      );

      return false;
    }
  },

  async shareMemory(
    cardData: MemoryCardData,
    nodeRef?: HTMLElement | null
  ): Promise<boolean> {
    const payload:
      SharePayload = {
      title:
        tx("Mi momento en {{title}}", { title: cardData.title }),
      text:
        buildShareText(
          cardData
        ),
    };

    try {
      if (nodeRef) {
        const blob =
          await renderCardBlob(
            nodeRef
          );

        const file =
          new File(
            [blob],
            `iguide-${sanitizeFileName(
              cardData.title
            )}.png`,
            {
              type:
                "image/png",
            }
          );

        return await nativeShare(
          payload,
          file
        );
      }

      return await nativeShare(
        payload
      );
    } catch (error) {
      console.error(
        "No se pudo compartir la MemoryCard:",
        error
      );

      await navigator.clipboard.writeText(
        payload.text
      );

      alert(
        tx("No se pudo adjuntar la imagen, pero la descripción quedó copiada.")
      );

      return false;
    }
  },

  async copyShareText(
    cardData: MemoryCardData
  ): Promise<string> {
    const text =
      buildShareText(
        cardData
      );

    await navigator.clipboard.writeText(
      text
    );

    alert(
      tx("Descripción copiada.")
    );

    return text;
  },

  async copyShareLink(
    cardData: MemoryCardData
  ): Promise<string> {
    return this.copyShareText(
      cardData
    );
  },

  async shareAchievement(
    title: string,
    description: string
  ): Promise<boolean> {
    return nativeShare({
      title:
        tx("Explorador de {{title}}", { title }),
      text:
        `${description}\n\n${tx("No visites. Pertenece. Vive la ciudad como un local.")}\n\n#IGuide #LiveLikeLocal`,
    });
  },
};
