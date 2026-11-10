import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Camera, Check, ImagePlus, LogOut, Search, ShieldCheck, Upload } from "lucide-react";
import { catalog } from "../data/catalog";
import { assertPhotoInput } from "../engine/placeCoverContract";
import { forgetPlaceCover, replacePlaceCovers, setPlaceCover } from "../engine/placeCoverStore";
import { usePlaceCover, usePlaceCovers } from "../hooks/usePlaceCover";
import { getPlacePhotoService, type EditorSession } from "../services/placePhotoService";
import logo from "../assets/branding/logo-dark-bg.png";
import "./MerchantPhotos.css";

const merchants = catalog.filter(place =>
  ["restaurant", "cafe", "bar", "nightclub", "hotel", "craft"].includes(place.type)
).sort((a, b) => a.title.localeCompare(b.title, "es"));
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function MerchantPhotos() {
  const connection = useMemo(() => {
    try { return { service: getPlacePhotoService("edit"), error: "" }; }
    catch (error) { return { service: null, error: error instanceof Error ? error.message : "Conexión pendiente de activación." }; }
  }, []);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(merchants[0]?.experienceId ?? "");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [alt, setAlt] = useState("");
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const covers = usePlaceCovers();
  const selected = merchants.find(place => place.experienceId === selectedId) ?? merchants[0];
  const published = covers.get(selectedId);
  const currentCover = usePlaceCover(selected);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : "", [photo]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => {
      setSession(null);
      setNotice("La sesión terminó. Vuelve a entrar para continuar.");
      void connection.service?.signOut();
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session, connection.service]);

  function resetMessages() { setError(""); setNotice(""); }
  function choosePlace(id: string) {
    setSelectedId(id); setPhoto(null); setAlt(""); setRights(false); setConfirmRemoval(false); resetMessages();
  }
  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!connection.service || busy) return;
    resetMessages(); setBusy("Comprobando acceso…");
    const enteredPassword = password;
    setPassword("");
    try { setSession(await connection.service.signIn(email, enteredPassword)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo entrar."); }
    finally { setBusy(""); }
  }
  async function preparePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    resetMessages(); setPhoto(null); setRights(false); setBusy("Preparando fotografía…");
    try {
      assertPhotoInput(file);
      const { compressPhotoFile } = await import("../engine/photoProcessing");
      const compressed = await compressPhotoFile(file, 1600, 0.82);
      if (compressed.size > 2 * 1024 * 1024) throw new Error("La foto sigue siendo muy grande. Elige otra fotografía.");
      setPhoto(compressed); setAlt(selected.title);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo preparar la fotografía."); }
    finally { setBusy(""); }
  }
  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!photo || !rights || !session || !connection.service || busy) return;
    resetMessages(); setBusy("Publicando portada…");
    try {
      const cover = await connection.service.publishCover(selected.experienceId, photo, alt, rights);
      setPlaceCover(connection.service.config.url, cover);
      setPhoto(null); setRights(false);
      setNotice(`Portada publicada para ${selected.title}. Ya puedes abrir su ficha.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo confirmar la publicación."); }
    finally { setBusy(""); }
  }
  async function refresh() {
    if (!connection.service || busy) return;
    resetMessages(); setBusy("Actualizando portadas…");
    try {
      replacePlaceCovers(connection.service.config.url, await connection.service.listCovers());
      setNotice("Portadas actualizadas desde el servidor.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudieron actualizar las portadas."); }
    finally { setBusy(""); }
  }
  async function remove() {
    if (!published || !session || !connection.service || busy) return;
    resetMessages(); setBusy("Retirando portada…");
    try {
      const result = await connection.service.removeCover(published);
      forgetPlaceCover(selectedId); setConfirmRemoval(false);
      setNotice(result.fileDeleted ? "Portada retirada y archivo eliminado. Se recuperó la imagen anterior." :
        "Portada retirada de la ficha. No se confirmó el borrado del archivo público: queda pendiente su eliminación en el almacenamiento.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo confirmar la retirada. Actualiza las portadas."); }
    finally { setBusy(""); }
  }

  const filtered = merchants.filter(place => searchable(`${place.title} ${place.city} ${place.address ?? ""}`).includes(searchable(query)));
  return <div className="merchant-photos">
    <header className="merchant-topbar">
      <Link to="/" aria-label="Volver a I.GUIDE"><img src={logo} alt="I.GUIDE" /></Link>
      <span>LOCALES · EDICIÓN</span>
      {session ? <button disabled={!!busy} onClick={() => { setSession(null); setPhoto(null); setRights(false); void connection.service?.signOut(); }}><LogOut size={16} /> Salir</button> : <Link to="/explorer">Ver guía →</Link>}
    </header>
    <main className="merchant-main">
      <div className="merchant-heading"><p className="merchant-eyebrow">DEL LOCAL A LA GUÍA</p>
        <h1>Una foto. Una mejor<br /><span>primera impresión.</span></h1>
        <p>Actualiza la portada de cada negocio durante tu visita.</p>
      </div>
      {!connection.service && <div className="merchant-activation" role="status"><ShieldCheck size={22} /><div><strong>Edición de portadas reservada al piloto</strong>
        <p>{connection.error || "Abre el panel del piloto para publicar o reemplazar fotos."}</p></div></div>}
      {connection.service && !session && <form className="merchant-login" onSubmit={signIn}>
        <div><ShieldCheck size={24} /><h2>Acceso de editor</h2><p>Entra con tu cuenta autorizada para publicar.</p></div>
        <label>Correo<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required disabled={!!busy} /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={!!busy} /></label>
        <button className="merchant-primary" disabled={!!busy}>Entrar</button>
      </form>}
      {session && <p className="merchant-session"><Check size={15} /> Editando como {session.email}</p>}
      <div className="merchant-workspace">
        <section className="merchant-picker" aria-label="Elegir local">
          <div className="merchant-step"><span>01</span><div><h2>Elige el local</h2><p>{merchants.length} negocios en tu catálogo</p></div></div>
          <label className="merchant-search"><Search size={18} /><input aria-label="Buscar local" type="search" placeholder="Nombre o dirección" value={query} onChange={event => setQuery(event.target.value)} disabled={!!busy} /></label>
          <div className="merchant-place-list">{filtered.map(place => <button key={place.experienceId} aria-pressed={selectedId === place.experienceId}
            className={selectedId === place.experienceId ? "is-selected" : ""} disabled={!!busy} onClick={() => choosePlace(place.experienceId)}>
            <span><strong>{place.title}</strong><small>{place.address || place.city}</small></span>
            {covers.has(place.experienceId) ? <Check size={18} aria-label="Con portada publicada" /> : <Camera size={18} />}
          </button>)}{!filtered.length && <p className="merchant-empty">No hay locales con ese nombre.</p>}</div>
        </section>
        <section className="merchant-editor" aria-label="Portada del local">
          <div className="merchant-step"><span>02</span><div><h2>{selected.title}</h2><p>{published ? "Con portada publicada" : "Prepara su portada"}</p></div></div>
          <div className="merchant-photo-preview">{preview || currentCover ? <img key={preview || currentCover} src={preview || currentCover} alt={alt || selected.title} /> : <div><ImagePlus size={42} /><p>La próxima imagen de este local<br />puede empezar aquí.</p></div>}
            <span>{photo ? "VISTA PREVIA · AÚN SIN PUBLICAR" : published ? "PORTADA PUBLICADA" : "IMAGEN ACTUAL"}</span>
          </div>
          <form onSubmit={publish}>
            <fieldset disabled={!session || !!busy}>
              <div className="merchant-upload-actions"><label className="merchant-upload"><Camera size={19} /> Tomar foto<input aria-label="Tomar foto del local" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={preparePhoto} /></label>
                <label className="merchant-upload"><ImagePlus size={19} /> Elegir foto<input aria-label="Elegir foto del local" type="file" accept="image/jpeg,image/png,image/webp" onChange={preparePhoto} /></label></div>
              <p className="merchant-help">JPG, PNG o WebP, hasta 12 MB. Preparamos una versión ligera para la guía.</p>
              {photo && <><label className="merchant-description">Descripción de la foto<input maxLength={160} required value={alt} onChange={event => setAlt(event.target.value)} /></label>
                <label className="merchant-rights"><input type="checkbox" checked={rights} onChange={event => setRights(event.target.checked)} required />
                  <span>Tengo autorización y derechos para publicar esta fotografía. Será visible para cualquier persona.</span></label></>}
              <button className="merchant-primary merchant-publish" type="submit" disabled={!photo || !rights || !!busy}><Upload size={18} /> Publicar portada</button>
            </fieldset>
          </form>
          <div className="merchant-editor-footer"><Link to={`/expedition/${selected.slug}`}>Ver ficha del local ↗</Link>
            {connection.service && <button disabled={!!busy} onClick={refresh}>Actualizar portadas</button>}</div>
          {session && published && <div className="merchant-remove">{confirmRemoval ? <><p>¿Retirar esta portada y recuperar la imagen anterior?</p><button disabled={!!busy} onClick={remove}>Sí, retirar portada</button><button disabled={!!busy} onClick={() => setConfirmRemoval(false)}>Cancelar</button></> : <button disabled={!!busy} onClick={() => setConfirmRemoval(true)}>Retirar portada publicada</button>}</div>}
        </section>
      </div>
      <div className="merchant-feedback" aria-live="polite" aria-atomic="true">{busy && <p role="status">{busy}</p>}{notice && <p className="merchant-success" role="status">{notice}</p>}{error && <p className="merchant-error" role="alert">{error}</p>}</div>
      <footer className="merchant-footer">I.GUIDE · Huancayo <span>Una portada mejora la ficha; las recomendaciones mantienen sus propios criterios.</span></footer>
    </main>
  </div>;
}
