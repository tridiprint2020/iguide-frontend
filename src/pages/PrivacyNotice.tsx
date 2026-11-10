import { useTranslation } from "react-i18next";
import PageHeader from "../components/ui/PageHeader";
import { privacyContact } from "../data/privacyContact";

const copy = {
  es: {
    title: "Aviso de privacidad",
    intro: "Conoce qué datos usa I.GUIDE al explorar Huancayo y cómo ejercer tus derechos.",
    controller: "Responsable del tratamiento",
    address: "Domicilio de atención",
    sections: [
      {
        title: "Ubicación, recorridos y recuerdos",
        paragraphs: [
          "Con el permiso de tu navegador, I.GUIDE usa tu ubicación para mostrar lugares cercanos y registrar el recorrido de una misión. La cámara se usa cuando eliges tomar una foto. Puedes gestionar esos permisos en el navegador y explorar el catálogo sin concederlos.",
          "Los favoritos, itinerarios, recorridos y recuerdos que guardas se conservan en este navegador hasta que los elimines desde la app o borres los datos del sitio. Cuando compartes un plan o recuerdo, el contenido llega al destino que elijas. Quien reciba el enlace de un plan puede leerlo.",
        ],
      },
      {
        title: "Portadas de locales",
        paragraphs: [
          "Las fichas muestran fotografías autorizadas y sus descripciones. Al cargar una portada publicada desde el panel, tu navegador consulta a Supabase en Oregón, Estados Unidos. El proveedor recibe datos técnicos de la solicitud, como la dirección IP y el archivo solicitado. Puedes consultar la guía sin cuenta.",
          "En el entorno de edición, Supabase Auth verifica el correo y la contraseña de los editores autorizados. El catálogo registra el identificador interno del editor que publica. La foto se prepara en el navegador y se publica el JPG con su descripción. Las portadas se conservan mientras estén publicadas. Los archivos reemplazados se revisan para su eliminación.",
        ],
      },
      {
        title: "Alojamiento, mapas y clima",
        paragraphs: [
          "Vercel aloja I.GUIDE. Si la medición de visitas está habilitada, Vercel Web Analytics recibe información de uso, como páginas consultadas, procedencia de la visita y tipo de dispositivo. OpenStreetMap recibe solicitudes para mostrar la zona visible del mapa. Open-Meteo recibe las coordenadas de la consulta del tiempo.",
          "Estas conexiones pueden ser procesadas fuera de Perú. Los proveedores conservan sus registros técnicos durante los plazos de sus servicios. Si abres un enlace externo, como Google Maps, el servicio de destino recibe la solicitud y aplica su propio aviso.",
        ],
      },
    ],
    rights: "Tus derechos y cómo contactarnos",
    request: "Para pedir acceso, rectificación, cancelación u oposición, o revocar un consentimiento cuando corresponda, escribe al correo del responsable e indica qué derecho quieres ejercer.",
    authority: "También puedes acudir a la Autoridad Nacional de Protección de Datos Personales de Perú.",
    authorityLink: "Consultar los derechos ARCO",
  },
  en: {
    title: "Privacy notice",
    intro: "Learn what data I.GUIDE uses as you explore Huancayo and how to exercise your rights.",
    controller: "Data controller",
    address: "Contact address",
    sections: [
      {
        title: "Location, routes and memories",
        paragraphs: [
          "With your browser's permission, I.GUIDE uses your location to show nearby places and record the route of a mission. Your camera is used when you choose to take a photo. You can manage these permissions in your browser and explore the catalogue without granting them.",
          "Your saved favourites, itineraries, routes and memories stay in this browser until you remove them in the app or clear the site's data. When you share a plan or memory, the content goes to the destination you choose. Anyone who receives a plan link can read it.",
        ],
      },
      {
        title: "Place cover photos",
        paragraphs: [
          "Place pages show authorised photos and their descriptions. When loading a cover published from the editor, your browser connects to Supabase in Oregon, United States. The provider receives technical request data, such as your IP address and the file requested. You can use the guide without an account.",
          "In the editing environment, Supabase Auth checks the email and password of authorised editors. The catalogue records the editor's internal identifier when they publish. The photo is prepared in the browser and the JPG is published with its description. Covers are kept while they are published. Replaced files are reviewed for deletion.",
        ],
      },
      {
        title: "Hosting, maps and weather",
        paragraphs: [
          "Vercel hosts I.GUIDE. If visitor measurement is enabled, Vercel Web Analytics receives usage information such as pages viewed, visit sources and device types. OpenStreetMap receives requests for the visible map area. Open-Meteo receives the coordinates of the weather query.",
          "These connections may be processed outside Peru. Providers retain technical records for their service retention periods. When you open an external link, such as Google Maps, the destination service receives the request and applies its own notice.",
        ],
      },
    ],
    rights: "Your rights and how to contact us",
    request: "To request access, rectification, cancellation or objection, or to withdraw consent where applicable, email the data controller and say which right you want to exercise.",
    authority: "You can also contact Peru's National Authority for Personal Data Protection.",
    authorityLink: "Read about your data rights",
  },
};

export default function PrivacyNotice() {
  const { i18n } = useTranslation();
  const text = copy[i18n.resolvedLanguage === "en" ? "en" : "es"];

  if (!privacyContact) return null;

  return (
    <main className="privacy-page">
      <article className="privacy-notice">
        <PageHeader />
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <dl>
          <dt>{text.controller}</dt>
          <dd>{privacyContact.controller}</dd>
          <dt>{text.address}</dt>
          <dd>{privacyContact.address}</dd>
        </dl>
        {text.sections.map(({ title, paragraphs }) => (
          <section key={title}>
            <h2>{title}</h2>
            {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <section>
          <h2>{text.rights}</h2>
          <p>{text.request}</p>
          <p><a href={"mailto:" + privacyContact.email}>{privacyContact.email}</a></p>
          <p>{text.authority}</p>
          <p><a href="https://www.gob.pe/9270">{text.authorityLink}</a></p>
        </section>
      </article>
    </main>
  );
}
