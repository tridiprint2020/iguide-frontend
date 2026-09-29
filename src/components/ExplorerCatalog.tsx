import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { catalog } from "../data/catalog";
import { isVerifiedHuarique } from "../engine/huariqueEngine";
import { browseCategories, readBrowseTypes } from "../engine/navigationPolicy";
import type { Experience } from "../types/experience";
import { tx } from "../i18n";
import "./ExplorerCatalog.css";
export default function ExplorerCatalog() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const types = readBrowseTypes(params);
  const q = params.get("q") ?? "";
  const huariques = params.get("huariques") === "1";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params); if (value) next.set(key,value); else next.delete(key);
    setParams(next, { replace:true });
  }
  const entries = catalog.filter(item => item.isActive !== false && (!types.length || types.includes(item.type)) &&
    (!huariques || isVerifiedHuarique(item)) && `${item.title} ${item.description}`.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
  return <section className="explorer-catalog" aria-label={tx("Explorar por categoría")}>
    <h1>{tx("Descubre Huancayo")}</h1><p>{tx("Elige una categoría y encuentra tu próxima experiencia.")}</p>
    <label>{tx("Buscar lugares")}<input type="search" value={q} onChange={event => update("q",event.target.value)} /></label>
    <div className="explorer-categories">{browseCategories.map(([type,label]) => <button key={type} aria-pressed={types.includes(type)}
      onClick={() => update("types",(types.includes(type) ? types.filter(value=>value!==type) : [...types,type]).join(","))}>{tx(label)}</button>)}
      <button aria-pressed={huariques} onClick={() => update("huariques", huariques ? "" : "1")}>{tx("Huariques")}</button>
      <button onClick={() => setParams({}, {replace:true})}>{tx("Limpiar filtros")}</button>
    </div>
    <Link className="explorer-map-link" to={`/mapa?${params.toString()}`}>{tx("Ver en mapa")} →</Link>
    {!entries.length && <p role="status">{tx("No hay lugares con estos filtros.")}</p>}
    <div className="explorer-catalog-grid">{entries.map(item => <CatalogCard key={item.experienceId} experience={item} from={location.pathname+location.search} />)}</div>
  </section>;
}
function CatalogCard({experience,from}: {experience:Experience;from:string}) {
  const [failed,setFailed] = useState(false);
  const photo=[experience.image,experience.coverImage].find(value=>value&&!/logo|placeholder/i.test(value));
  return <Link className="explorer-catalog-card" to={`/expedition/${experience.slug}`} state={{from}}>
    {photo&&!failed ? <img src={photo} alt="" loading="lazy" onError={()=>setFailed(true)} /> : <div className="explorer-catalog-photo">{tx("Foto del lugar pendiente")}</div>}
    <div><h2>{experience.title}</h2><p>{experience.description}</p><span>{tx("Ver detalles")} →</span></div>
  </Link>;
}
