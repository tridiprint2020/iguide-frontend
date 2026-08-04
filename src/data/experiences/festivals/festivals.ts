import type { Experience } from "../../../types/experience/experience";

export const festivals: Experience[] = [
  {
    experienceId: "FES-0001",
    slug: "el-santiago",
    title: "El Santiago",
    type: "festival",
    description: "...",
    city: "Huancayo",
    date: "Finales de julio - Inicio de agosto",
    category: "religious",
    latitude: -12.06810931529854,
    longitude: -75.21005597422756,
    certificationRadiusMeters: 40,
    tags: ["tradition"],
    rating: 6.5,
    organizer: "Municipalidad de Huancayo",
    ticketUrl: "",
    coverImage: "",
    // ✅ PROPIEDADES AGREGADAS LEGALMENTE PARA CERRAR EL CONTRATO DE BASEEXPERIENCE:
    image: "", 
    admissionFee: 0,
    isActive: true,
    estimatedVisitMinutes: 180
  },

  {
    experienceId: "FES-0002",
    slug: "fiesta-de-la-santisima-trinidad",
    title: "Fiesta de la Santísima Trinidad",
    type: "festival",              // 👈 faltaba por completo
    
    description: " Es la fiesta patronal más grande de la ciudad. Se celebra entre finales de mayo y el mes de junio en honor a la Santísima Trinidad oTayta Padre, destacando por sus multitudinarias procesiones y danzas típicas.",
    city: "Huancayo",
    date: "Finales de mayo - Junio",
    category: "religious",
    latitude: -12.06810931529854, 
    longitude: -75.21005597422756,  
    certificationRadiusMeters: 40,               // 👈 número, no texto ""
    tags: ["tradition"],           // 👈 arreglo, no texto suelto
    rating: 6.5,                   // 👈 número, no texto "4.5"
    organizer: "Municipalidad de Huancayo",
ticketUrl: "",
coverImage: "",
image: "", 
    admissionFee: 0,
gallery: [],
isActive: true,
estimatedVisitMinutes: 180

  },

  {
    experienceId: "FES-0003",
    slug: "carnavales",
    title: "Carnavales",
    type: "festival",              // 👈 faltaba por completo
    
    description: " Se celebran entre febrero y marzo. Son famosos por el tradicional Huaylarsh, las comparsas coloridas, el cortamonte y la celebración del Ño Carnavalón.",
    city: "Huancayo",
    date: "Finales de enero - febrero",
    category: "religious",
    latitude: -12.06810931529854, 
    longitude: -75.21005597422756,  
    certificationRadiusMeters: 40,               // 👈 número, no texto ""
    tags: ["tradition"],           // 👈 arreglo, no texto suelto
    rating: 4.5,                   // 👈 número, no texto "4.5"
    organizer: "Municipalidad de Huancayo",
ticketUrl: "",
coverImage: "",
image: "", 
    admissionFee: 0,
gallery: [],
isActive: true,
estimatedVisitMinutes: 180

  },
];