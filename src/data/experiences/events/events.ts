// events.ts
import type { Experience } from "../../../types/experience/experience";

export const events: Experience[] = [
  {
    experienceId: "EVE-0001",
    slug: "el-san",
    title: "El San",
    type: "event", // 👈 Limpio en inglés según el discriminador estricto
    description: " Se lleva a cabo al inicio de agosto. Rinde homenaje al apóstol Santiago para agradecer por las buenas cosechas, la fecundidad de los animales y el buen clima. Las calles se llenan de música de arpa y violín, bandas y el tradicional pago a la tierra.",
    city: "Huancayo",
    date: "Finales de agosto",
    category: "religious",
    latitude: -12.06810931529854, 
    longitude: -75.21005597422756, // 👈 Número puro nativo sin comillas
    certificationRadiusMeters: 100,
    tags: ["tradition"], // 👈 Matriz de strings tipada correctamente
    rating: 6.5, // 👈 Número decimal primitivo flotante
    organizer: "Municipalidad de Huancayo",
    ticketUrl: "",
    admissionFee: 0,
    coverImage: "",
    gallery: [],
    isActive: true,
    estimatedVisitMinutes: 180,
    // ✅ PROPIEDAD INYECTADA PARA CUMPLIR EL CONTRATO OBLIGATORIO DE BASEEXPERIENCE:
    image: "" 
  },
];
