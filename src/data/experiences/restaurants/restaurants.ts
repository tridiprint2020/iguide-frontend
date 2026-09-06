import type { Experience } from "../../../types/experience/experience";
import placeholder from "../../../assets/branding/logo-light-bg.png";
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
// PARÍS
latitude: -12.066938209309713,
longitude: -75.20915417754811,
certificationRadiusMeters: 20,

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

latitude: -12.063010512710676,
longitude: -75.20661076642759,

certificationRadiusMeters: 20,

    rating: 8.7,

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

    slug:"los-girasoles",

    title:"Los Girasoles",

    type:"restaurant",

    city:"Huancayo",

    image: placeholder,

    address:"Moquegua 135, Huancayo 12004",

    description:
      "Gastronomía del Valle del Mantaro dentro de la ciudad, con pachamanca, carnero al palo y trucha.",

    latitude:-12.064901145614282,

    longitude:-75.21501080463344,

    link:"https://www.google.com/maps/dir/?api=1&destination=-12.064901145614282,-75.21501080463344",

    certificationRadiusMeters: 20,

    tags:[
        "pachamanca",
        "carnero al palo",
        "trucha",
        "familia",
        "almuerzo"
    ],

    interests:["gastronomy", "family"],

    cuisine:"gastronomía del Valle",

    priceRange:"mid",

    openingHours:"09:00-20:00",
    weeklySchedule:{
      days:[0,1,2,3,4,5,6],
      opensAt:"09:00",
      closesAt:"20:00"
    },
    mealSlots:["lunch"],
    averagePricePen:50,
    paymentMethods:["cash","yape","card"],
    reservationRequired:false,
    hasDelivery: false,
admissionFee: 0,
coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
lastUpdated:"2026-09-05",
estimatedVisitMinutes: 90,
environment:"mixed",
weatherSensitivity:"low",
terrain:"paved",
listingStatus:"editorial",
menuHighlights:[
  "Carnero al palo",
  "Pachamanca de tres sabores con humitas extra",
  "Papa a la Huancaína",
  "Cebiche de trucha"
],
huarique:{
  verified:true,
  reason:"Si no tienes tiempo de ir a Ingenio o Sapallanga por una pachamanca, aquí puedes probar gastronomía del Valle dentro de la ciudad.",
  signatureDish:"Pachamanca de tres sabores con humitas extra",
  hospesTip:"Pide humitas extra; las adorarás.",
  verifiedAt:"2026-09-05",
  evidenceSource:"Confirmación del Fundador basada en visita personal realizada aproximadamente tres semanas antes del 2026-09-05."
}

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
{
  experienceId:"RES-0009",
  slug:"el-padrinazo",
  title:"El Padrinazo",
  type:"restaurant",
  city:"Huancayo",
  address:"Jr. Calixto 317, Huancayo",
  image:placeholder,
  coverImage:placeholder,
  gallery:[],
  description:"Restaurante de comida local frecuentado por comerciantes del Mercado Central, con caldos y porciones abundantes de platos del valle.",
  latitude:-12.069155261880008,
  longitude:-75.20726025397761,
  link:"https://www.google.com/maps/dir/?api=1&destination=-12.069155261880008,-75.20726025397761",
  certificationRadiusMeters:20,
  tags:["comida local","caldos","mondongo","sancochado","chicharrón colorado"],
  interests:["gastronomy"],
  cuisine:"comida local del Valle del Mantaro",
  priceRange:"budget",
  openingHours:"07:00-15:00",
  weeklySchedule:{
    days:[1,2,3,4,5,6],
    opensAt:"07:00",
    closesAt:"15:00",
    closedOnHolidays:true
  },
  mealSlots:["breakfast","lunch"],
  averagePricePen:30,
  paymentMethods:["cash","yape"],
  reservationRequired:false,
  hasDelivery:false,
  menuHighlights:["Mondongo","Sancochado","Chicharrón Colorado"],
  isActive:true,
  lastUpdated:"2026-09-05",
  estimatedVisitMinutes:45,
  environment:"indoor",
  weatherSensitivity:"low",
  terrain:"paved",
  listingStatus:"editorial",
  huarique:{
    verified:true,
    reason:"Es uno de los preferidos de los comerciantes del Mercado Central por sus porciones contundentes y presas dignas del valle.",
    signatureDish:"Mondongo, sancochado y chicharrón colorado",
    hospesTip:"En el almuerzo puedes pedir yapa de refresco.",
    verifiedAt:"2026-09-05",
    evidenceSource:"Confirmación del Fundador basada en visita personal realizada aproximadamente seis semanas antes del 2026-09-05."
  }
},
{
  experienceId:"RES-0010",
  slug:"el-braserito",
  title:"El Braserito",
  type:"restaurant",
  city:"Huancayo",
  address:"Jr. Huánuco 486, Huancayo",
  image:placeholder,
  coverImage:placeholder,
  gallery:[],
  description:"Anticuchería de buena sazón, variedad, salsas sabrosas y aperitivos a precio justo.",
  latitude:-12.073709750427867,
  longitude:-75.20812441988363,
  link:"https://www.google.com/maps/dir/?api=1&destination=-12.073709750427867,-75.20812441988363",
  certificationRadiusMeters:20,
  tags:["anticuchos","rachi","molleja","parrilla","noche"],
  interests:["gastronomy","nightlife"],
  cuisine:"anticuchería",
  priceRange:"budget",
  openingHours:"16:00-22:30",
  weeklySchedule:{
    days:[0,1,2,3,4,5,6],
    opensAt:"16:00",
    closesAt:"22:30",
    closedOnHolidays:true
  },
  mealSlots:["dinner"],
  averagePricePen:30,
  paymentMethods:["cash","yape","card"],
  reservationRequired:false,
  hasDelivery:false,
  menuHighlights:["Anticucho","Rachi","Molleja","Plato mixto"],
  isActive:true,
  lastUpdated:"2026-09-05",
  estimatedVisitMinutes:60,
  environment:"indoor",
  weatherSensitivity:"low",
  terrain:"paved",
  listingStatus:"editorial",
  huarique:{
    verified:true,
    reason:"Tiene buena sazón y variedad a buen precio, con salsas sabrosas y buenos aperitivos.",
    signatureDish:"Plato mixto de anticucho con rachi y molleja",
    hospesTip:"Prueba el uvachado como digestivo.",
    verifiedAt:"2026-09-05",
    evidenceSource:"Confirmación del Fundador basada en visita personal realizada aproximadamente tres semanas antes del 2026-09-05."
  }
},
{
  experienceId:"RES-0011",
  slug:"restaurant-campestre-valle-azul",
  title:"Restaurant Campestre Valle Azul",
  type:"restaurant",
  city:"Quichuay",
  address:"Av. Juan Morales Vivanco 390, Quichuay 12205",
  image:placeholder,
  coverImage:placeholder,
  gallery:[],
  description:"Restaurante campestre del Valle del Mantaro reconocido por mantener su sabor y calidad, especialmente en la trucha preparada de distintas maneras.",
  latitude:-11.8900916,
  longitude:-75.2905327,
  link:"https://www.google.com/maps/dir/?api=1&destination=-11.89009160,-75.29053270",
  certificationRadiusMeters:60,
  tags:["trucha","pachamanca","cuy","conejo","comida campestre","familia"],
  interests:["gastronomy","family"],
  cuisine:"gastronomía del Valle del Mantaro",
  priceRange:"mid",
  openingHours:"11:00-18:00",
  weeklySchedule:{
    days:[0,1,2,3,4,5,6],
    opensAt:"11:00",
    closesAt:"18:00"
  },
  mealSlots:["lunch"],
  averagePricePen:40,
  paymentMethods:["cash","yape","card"],
  reservationRequired:false,
  hasDelivery:false,
  menuHighlights:["Trucha en diferentes preparaciones","Papa a la Huancaína","Cebiche de trucha","Caldo de gallina","Chicharrón de alcachofa","Picante de cuy","Conejo chactado","Pachamanca"],
  isActive:true,
  lastUpdated:"2026-09-05",
  estimatedVisitMinutes:150,
  environment:"mixed",
  weatherSensitivity:"medium",
  terrain:"paved",
  listingStatus:"editorial",
  huarique:{
    verified:true,
    reason:"Entre muchos locales del valle, ha mantenido su sabor y su calidad; los conocedores locales lo consideran una elección confiable, especialmente por su trucha en todos sus sabores.",
    signatureDish:"Trucha en sus diferentes preparaciones",
    hospesTip:"Llega alrededor de la 1:00 p. m.; los fines de semana suele llenarse. Prueba sin miedo todo el menú.",
    verifiedAt:"2026-09-05",
    evidenceSource:"Confirmación del Fundador basada en visita personal realizada aproximadamente dos meses antes del 2026-09-05. Dirección y coordenadas contrastadas con fuentes públicas; falta validación GPS en la puerta."
  }
},
{
  experienceId:"RES-0012",
  slug:"la-casa-los-conquistadores",
  title:"La Casa – Los Conquistadores",
  type:"restaurant",
  city:"Huancayo",
  address:"Jr. Calixto 598, Huancayo",
  image:placeholder,
  coverImage:placeholder,
  gallery:[],
  description:"Pollería local con pollo a la brasa, atención práctica y precio justo.",
  latitude:-12.069785889274364,
  longitude:-75.20839458880786,
  link:"https://www.google.com/maps/dir/?api=1&destination=-12.069785889274364,-75.20839458880786",
  certificationRadiusMeters:20,
  tags:["pollo a la brasa","pollería","familia","almuerzo","cena"],
  interests:["gastronomy","family"],
  cuisine:"pollería",
  priceRange:"budget",
  openingHours:"12:00-22:30",
  weeklySchedule:{
    days:[0,1,2,3,4,5,6],
    opensAt:"12:00",
    closesAt:"22:30"
  },
  mealSlots:["lunch","dinner"],
  averagePricePen:25,
  paymentMethods:["cash","yape","card"],
  reservationRequired:false,
  hasDelivery:true,
  menuHighlights:["Pollo a la brasa"],
  isActive:true,
  lastUpdated:"2026-09-05",
  estimatedVisitMinutes:60,
  environment:"indoor",
  weatherSensitivity:"low",
  terrain:"paved",
  listingStatus:"editorial",
  huarique:{
    verified:true,
    reason:"Ofrece pollo a la brasa bien servido y a precio justo, cumpliendo lo que un cliente local espera sin pagar sobreprecio.",
    signatureDish:"Pollo a la brasa",
    hospesTip:"Pide el ají verde. Si buscas mayor rotación del producto, llega cerca de las 2:00 p. m. o las 8:00 p. m.",
    verifiedAt:"2026-09-05",
    evidenceSource:"Confirmación del Fundador basada en visita personal realizada aproximadamente una semana antes del 2026-09-05."
  }
},
];
