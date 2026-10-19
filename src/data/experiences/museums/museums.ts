// museums.ts
import type { Experience } from "../../../types/experience/experience";
export const museums: Experience[] = [

{
    experienceId:"MUS-0001",

    slug:"museo-salesiano-vicente-rasetto",

    title:"Museo Salesiano Vicente Rasetto",

    type:"museum",

    city:"Huancayo",

    image:"",

    // Colecciones: inventario MINCETUR 1179 y Guía de Museos MINCUL 2023.
    description:"Museo ubicado en el Colegio Salesiano Santa Rosa, en El Tambo. Reúne colecciones de historia natural y arqueología, además de fósiles, minerales, monedas y estampillas. Una visita para conocer la biodiversidad y el patrimonio cultural del Perú. Confirma con el museo los horarios, la tarifa y las condiciones para tomar fotografías.",

    address:"Jr. Santa Rosa 299, El Tambo",

    latitude:-12.065556297758183, 

    longitude:-75.21436104549964,

    certificationRadiusMeters: 20,

    // Tarifa actual pendiente de confirmación; no presentar S/0 como dato.

    rating:6.6,

    tags:["museo"],

    environment:"indoor",
    weatherSensitivity:"low",
    terrain:"paved",

    // Fuentes de 2023/2025 difieren; horario operativo actual sin verificar.
    openingHours:"",
    guidedTours: false,
exhibitions: ["Colección Permanente"],
coverImage: "",
gallery: [],
isActive: true,
lastUpdated: "2026-10-19",
estimatedVisitMinutes: 90

},


{
    experienceId:"MUS-0002",

    slug:"museo-de-sitio-y-santuario-arqueológico-de-wariwillka",

    title:"Museo de Sitio y Santuario Arqueológico de Wariwillka",

    type:"museum",

    city:"Huancayo",

    image:"",

    description:"museo creado en 1965con una momia muy bien conservada y una zona arqueológica",

    latitude:-12.117197981744543, 

    longitude:-75.20625129646363,

    certificationRadiusMeters: 20,

    admissionFee:0,

    rating:6.6,

    tags:["museo"],

    environment:"mixed",
    weatherSensitivity:"high",
    avoidWhenWet:true,
    terrain:"paved",

    openingHours:"09:00-17:00",
    guidedTours: false,
exhibitions: ["Colección Permanente"],
coverImage: "",
gallery: [],
isActive: true,
estimatedVisitMinutes: 90

}
];
