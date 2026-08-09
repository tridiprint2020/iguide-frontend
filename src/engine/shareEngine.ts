import type {
  MemoryCardData,
} from "../types/memoryCard";
import {
  renderMemoryCardBlob,
} from "./memoryCardRenderEngine";
import { tx } from "../i18n";

export interface SharePayload {
  title: string;
  text: string;
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
    _nodeRef: HTMLElement | null
  ): Promise<boolean> {
    void _nodeRef;

    try {
      const blob =
        await renderMemoryCardBlob(cardData);

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
        )}-${Date.now()}.jpg`;

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
        tx("No se pudo preparar la imagen. Inténtalo nuevamente.")
      );

      return false;
    }
  },

  async shareMemory(
    cardData: MemoryCardData,
    _nodeRef?: HTMLElement | null
  ): Promise<boolean> {
    void _nodeRef;

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
      const blob = await renderMemoryCardBlob(cardData);

      const file =
        new File(
          [blob],
          `iguide-${sanitizeFileName(
            cardData.title
          )}.jpg`,
          {
            type:
              "image/jpeg",
          }
        );

      return await nativeShare(
        payload,
        file
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
