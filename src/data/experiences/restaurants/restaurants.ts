import type { Experience } from "../../../types/experience/experience";
import placeholder from "../../../assets/optimized/logo-iguide.webp";
export const restaurants: Experience[] = [

{
    experienceId:"RES-0001",

    slug:"paris",

    title:"París",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante pasteleria con platos variados.",

    latitude:-12.066962820751636, 
    longitude:-75.20918072188105,

    certificationRadiusMeters: 20,

    /*
     * La primera prueba de campo registró una diferencia de
     * 86 m entre el pin comercial y el acceso usado por el
     * visitante. La llegada automática conserva el radio
     * estricto; este radio ampliado solo se usa cuando el
     * usuario pulsa explícitamente "Estoy aquí".
     */
    manualCertificationRadiusMeters: 120,

    rating:7.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"12:00-23:45",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},


{
    experienceId:"RES-0002",

    slug:"detras-de-la-catedral",

    title:"Detras de la Catedral",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante tradicional reconocido por su tacutacu especial y platos variados del Valle del Mantaro.",

    latitude:-12.067612508362327, 

    longitude:-75.20924555843641,

    certificationRadiusMeters: 20,

    rating:7.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"08:00-22:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},


{
    experienceId:"RES-0003",

    slug:"lalo`s",

    title:"Lalo`s",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante pizzeria panaderia reconocido por su prestigio el Valle del Mantaro.",

    latitude:-12.066936474802029, 

    longitude:-75.20683733702873,

    certificationRadiusMeters: 20,

    rating:4.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"07:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},


{
    experienceId:"RES-0004",

    slug:"el-caramba",

    title:"El Caramba",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante Parrillas de renombre en Huancayo desde 1985.",

    latitude:-12.062674525276481, 

    longitude:-75.20639804385293,

    certificationRadiusMeters: 20,

    rating:8.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"12:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},


{
    experienceId:"RES-0005",

    slug:"el-leopardo",

    title:"El Leopardo",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante tradicional reconocido por su mondongo y platos típicos del Valle del Mantaro.",

    latitude:-12.074750288017627, 

    longitude:-75.20981559359163,

    certificationRadiusMeters: 20,

    rating:6.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"09:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

}
,

{
    experienceId:"RES-0006",

    slug:"huancahuasi",

    title:"Huancahuasi",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante tradicional reconocido por su pachamanca y platos típicos del Valle del Mantaro.",

    latitude:-12.047228137415656, 

    longitude:-75.22319813036002,

    certificationRadiusMeters: 20,

    rating:5.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"09:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},


{
    experienceId:"RES-0007",

    slug:"girasoles",

    title:"Girasoles",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante tradicional reconocido por su pachamanca y platos típicos del Valle del Mantaro.",

    latitude:-12.064796348202057, 

    longitude:-75.21502859441074,

    certificationRadiusMeters: 20,

    rating:5.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"09:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},
{
    experienceId:"RES-0008",

    slug:"el-olimpico",

    title:"El Olimpico",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    description:
      "Restaurante antiguo muy reconocido con platos variados del Valle del Mantaro.",

    latitude:-12.068237220679455, 

    longitude:-75.20950176147316,
    
    certificationRadiusMeters: 20,

    rating:6.7,

    tags:[
        "tradicional",
        "familia",
        "almuerzo"
    ],

    cuisine:"tradicional",

    priceRange:"mid",

    openingHours:"08:00-21:00",
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},
];
