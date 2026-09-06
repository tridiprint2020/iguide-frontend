import placeholder from "../../../assets/branding/logo-light-bg.png";
import type { Experience } from "../../../types/experience";

export const foodRoutes: Experience[] = [
  {
    experienceId: "FRT-0001",
    slug: "ruta-del-lechon-de-chupaca",
    title: "Ruta del lechón de Chupaca",
    type: "food_route",
    vendorModel: "collective",
    city: "Chupaca",
    address: "Esquina norte de la Plaza de Chupaca",
    image: placeholder,
    coverImage: placeholder,
    gallery: [],
    description:
      "Experiencia gastronómica de fin de semana entre puestos tradicionales de lechón en la Plaza de Chupaca.",
    latitude: -12.062186739531931,
    longitude: -75.2880716922477,
    link:
      "https://www.google.com/maps/dir/?api=1&destination=-12.062186739531931,-75.2880716922477",
    certificationRadiusMeters: 60,
    tags: [
      "lechón",
      "pan de chapla",
      "café pasado",
      "desayuno",
      "mercado local",
      "fin de semana",
    ],
    interests: ["gastronomy", "family"],
    priceFromPen: 5,
    weeklySchedule: {
      days: [0, 6],
      opensAt: "07:00",
      closesAt: "14:00",
      closesWhenSoldOut: true,
    },
    mealSlots: ["breakfast", "lunch"],
    paymentMethods: ["cash", "yape"],
    menuHighlights: [
      "Porción de lechón",
      "Pan de chapla",
      "Café pasado",
    ],
    isActive: true,
    lastUpdated: "2026-09-05",
    estimatedVisitMinutes: 120,
    environment: "outdoor",
    weatherSensitivity: "medium",
    terrain: "paved",
    listingStatus: "editorial",
    huarique: {
      verified: true,
      reason:
        "Los sábados y domingos, puestos tradicionales ofrecen degustaciones y porciones de lechón desde cinco soles para acompañar con pan de chapla y café pasado.",
      signatureDish:
        "Lechón con pan de chapla y café pasado",
      hospesTip:
        "Llega el domingo cerca de las 8:00 a. m., pregunta por café pasado y elige el puesto después de probar las degustaciones. Algunos terminan antes si agotan sus existencias.",
      verifiedAt: "2026-09-05",
      evidenceSource:
        "Confirmación del Fundador basada en visita personal realizada aproximadamente tres meses antes del 2026-09-05.",
    },
  },
];
