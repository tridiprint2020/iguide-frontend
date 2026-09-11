import type { Experience } from "../../../types/experience/experience";
import placeholder from "../../../assets/branding/logo-light-bg.png";
export const cafes: Experience[] = [

{
    experienceId:"CAF-0001",

    slug:"bicho",

    title:"Bicho",

    type:"cafe",

    city:"Huancayo",

    image:"",

    description:"",

    latitude:-12.068743208762504, 

    longitude:-75.21075289115389,

    certificationRadiusMeters: 20,

    rating:6.6,

    tags:["café"],
    environment:"indoor",
    weatherSensitivity:"low",
    terrain:"paved",

    cuisine:"cafetería",

    priceRange:"mid",

    openingHours:"08:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},

{
    experienceId:"CAF-0002",

    slug:"la-petite-bakery",

    title:"La Petite Bakery",

    type:"cafe",

    city:"Huancayo",

    image:"",

    description:"El lugar es bonito, la atención es muy amable y el personal se nota detallista, eso se agradece. La presentación también está muy cuidada. ",

    latitude:-12.068481796239867, 

    longitude:-75.21227905401689,

    certificationRadiusMeters: 20,

    rating:6.6,

    tags:["café"],
    environment:"indoor",
    weatherSensitivity:"low",
    terrain:"paved",

    cuisine:"cafetería",

    priceRange:"mid",

    openingHours:"08:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},

{
    experienceId:"CAF-0003",

    slug:"t'ika-cafe-bar",

    title:"T'ika Café Lounge",

    type:"cafe",

    city:"Huancayo",

    image:"",

    description:"Lugar super cómodo y ambientado, con mesas y sillas super cómodas para un distraerse de la rutina diaria, tiene una amplia variedad de productos al gusto del consumidor contando tambien con una atención rapida y personal amable.",

    latitude:-12.0593990955144, 
    longitude:-75.20385851555682,
    certificationRadiusMeters: 20,

    rating:6.6,

    tags:["café"],
    environment:"indoor",
    weatherSensitivity:"low",
    terrain:"paved",

    cuisine:"cafetería",

    priceRange:"mid",

    openingHours:"11:00-24:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},

{
    experienceId: "CAF-0101",

    slug: "la-serranita",

    title: "La Serranita",

    type: "cafe",

    subtype: "icecream",

    placeCategory: "icecream_shop",

    listingStatus: "access_point",

    city: "Huancayo",

    image: placeholder,

    description: "Heladería de Huancayo y punto de acceso I.GUIDE.",

    latitude: -12.067779937071837,

    longitude: -75.20962107923576,

    arrivalLatitude: -12.067779937071837,

    arrivalLongitude: -75.20962107923576,

    link: "https://www.google.com/maps/dir/?api=1&destination=-12.067779937071837,-75.20962107923576",

    certificationRadiusMeters: 20,

    rating: 7.3,

    tags: ["heladería"],
    environment: "indoor",
    weatherSensitivity: "low",
    terrain: "paved",

    cuisine: "heladería",

    openingHours: "09:00-21:00",

    weeklySchedule: {
      days: [0, 1, 2, 3, 4, 5, 6],
      opensAt: "09:00",
      closesAt: "21:00",
      closedOnHolidays: false,
    },

    coverImage: placeholder,

    gallery: [],

    isActive: true,

    lastUpdated: "2026-09-11",

    estimatedVisitMinutes: 60,

    operationalVerification: {
      verifiedAt: "2026-09-08",
      precision: "day",
      evidenceSource:
        "Confirmación del Fundador basada en visita personal realizada aproximadamente tres días antes del 2026-09-11.",
    },

},

{
    experienceId: "CAF-0102",

    slug: "polares-gelato-italiano",

    title: "Polares – Auténtico Gelato Italiano",

    type: "cafe",

    subtype: "icecream",

    placeCategory: "icecream_shop",

    listingStatus: "editorial",

    city: "Huancayo",

    image: placeholder,

    description: "Heladería seleccionada por I.GUIDE en Huancayo.",

    latitude: -12.062358635910979,

    longitude: -75.20661775767118,

    arrivalLatitude: -12.062358635910979,

    arrivalLongitude: -75.20661775767118,

    link: "https://www.google.com/maps/dir/?api=1&destination=-12.062358635910979,-75.20661775767118",

    certificationRadiusMeters: 20,

    rating: 7.7,

    tags: ["heladería"],
    environment: "indoor",
    weatherSensitivity: "low",
    terrain: "paved",

    cuisine: "heladería",

    openingHours: "11:00-18:30",

    weeklySchedule: {
      days: [0, 1, 2, 3, 4, 5, 6],
      opensAt: "11:00",
      closesAt: "18:30",
      closedOnHolidays: true,
    },

    coverImage: placeholder,

    gallery: [],

    isActive: true,

    lastUpdated: "2026-09-11",

    estimatedVisitMinutes: 60,

    operationalVerification: {
      verifiedAt: "2026-08-28",
      precision: "day",
      evidenceSource:
        "Confirmación del Fundador basada en visita personal realizada aproximadamente dos semanas antes del 2026-09-11.",
    },

}

];
