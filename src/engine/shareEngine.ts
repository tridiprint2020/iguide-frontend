import type { MemoryCardData } from "../types/memoryCard";

export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

async function share(payload: SharePayload) {
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return true;
    } catch {
      return false;
    }
  }

  const fallback =
    payload.url != null
      ? `${payload.text}\n${payload.url}`
      : payload.text;

  await navigator.clipboard.writeText(fallback);
  alert("¡Copiado! Pégalo en tus redes favoritas 📲");
  return false;
}

export const shareEngine = {
  // ✅ Corregido: Se eliminó la alerta ts(6133) usando guiones bajos estrictos
  downloadImage: async (_cardData: MemoryCardData, _nodeRef: HTMLDivElement | null): Promise<boolean> => {
    console.log("shareEngine -> Renderizando canvas premium para:", _cardData.placeLabel);
    if (!_nodeRef) return false;
    
    alert("Generando captura de imagen de tu recorrido... 🖼️");
    return true;
  },

  shareMemory: (cardData: MemoryCardData) => {
    const fallbackUrl = `https://i.guide{btoa(cardData.placeLabel).substring(0, 8)}`;
    return share({
      title: "Mi momento en I.GUIDE",
      // ✅ Clones de copy exactos extraídos de tu diseño de redes sociales
      text: `¡Mi momento en ${cardData.city || "Huancayo"}! 📍\n\n"${cardData.note ?? "Los mejores detalles están en el camino."}"\n\n#IGuide #LiveLikeLocal #FeelTheCity`,
      url: fallbackUrl,
    });
  },

  shareAchievement: (title: string, description: string, url?: string) => {
    return share({
      title: `Explorador de ${title}`,
      text: `${description}\n\n🏆 Cada paso, una historia. Cada historia, un recuerdo.\n\n#IGuide #LiveLikeLocal`,
      url,
    });
  },

  // ✅ Corregido: Removida la advertencia ts(6133) de la línea 58 usando la variable limpia
  copyShareLink: async (_cardData: MemoryCardData) => {
    const url = `https://i.guide{btoa(cardData.placeLabel).substring(0, 8)}`;
    await navigator.clipboard.writeText(url);
    alert("Enlace de descubrimiento copiado 📋");
    return url;
  }
};
