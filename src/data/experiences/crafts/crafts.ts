import type { Experience } from "../../../types/experience/experience";
import placeholder from "../../../assets/placeholders/logo-iguide.png";

export const crafts: Experience[] = [
    {
    experienceId:"CRA-0001",

    slug:"casa-del-artesano",

    title:"Casa del Artesano",

    type:"craft",

    city:"Huancayo",

    image:"",

    description:"Muchas variedad de artesanía, la atención es muy amable y la calidad y precio van de mano.",

    latitude:-12.068546131012889, 
    longitude:-75.21048292482685,
    certificationRadiusMeters: 20,

    rating:6.6,

    tags:["artesanía", "cerámica", "souvenir"],

    specialty:"Cerámica Wanka",

    openingHours:"09:00-22:00",
   

coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

},

{
    experienceId:"CRA-0002",

    slug:"casa-del-barro-wanka",

    title:"CASA DEL BARRO WANKA",

    type:"craft",

    city:"Huancayo",

    image:"",

    description:"Muchas variedad de artesanía, la atención personalizada.",

    latitude:-12.068315987790546, 
    longitude:-75.20888155028801,
    certificationRadiusMeters: 20,

    rating:6.6,

    tags:["artesanía"],

    specialty:"Artesanía Wanka",

    openingHours:"09:00-22:00",
    

coverImage: placeholder, // O string vacío ""
gallery: [],
isActive: true,
estimatedVisitMinutes: 60

}

];