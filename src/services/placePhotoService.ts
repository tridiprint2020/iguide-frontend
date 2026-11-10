import {
  assertPlaceId, MAX_COVER_BYTES, parsePublishedCovers, PLACE_COVER_BUCKET,
  type PublishedPlaceCover,
} from "../engine/placeCoverContract";

export type PhotoServiceConfig = { url: string; publishableKey: string };
export type EditorSession = { email: string; expiresAt: number };
type PrivateSession = EditorSession & { token: string };
const COVER_FIELDS = "experience_id,object_path,alt_text,updated_at";

class CoverChangedError extends Error {
  constructor() {
    super("La portada cambió. Actualiza las portadas antes de volver a publicarla.");
  }
}

export function validatePhotoServiceConfig(url: string, key: string): PhotoServiceConfig {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("La conexión de fotos no está configurada."); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
    parsed.search || parsed.hash || !["", "/"].includes(parsed.pathname)) {
    throw new Error("La conexión de fotos necesita una URL HTTPS válida.");
  }
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && key.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      publicKey = payload.role === "anon";
    } catch { /* Invalid keys are rejected below. */ }
  }
  if (!publicKey) throw new Error("Configura únicamente la clave pública de Supabase.");
  return { url: parsed.origin, publishableKey: key };
}

export class PlacePhotoService {
  readonly config: PhotoServiceConfig;
  private session: PrivateSession | null = null;
  private fetcher: typeof fetch;

  constructor(config: PhotoServiceConfig, fetcher: typeof fetch = fetch) {
    this.config = validatePhotoServiceConfig(config.url, config.publishableKey);
    this.fetcher = fetcher;
  }

  private async request(path: string, init: RequestInit = {}, authenticated = false): Promise<unknown> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.config.publishableKey);
    if (authenticated) {
      if (!this.session || this.session.expiresAt <= Date.now()) {
        this.session = null;
        throw new Error("La sesión terminó. Vuelve a entrar para publicar.");
      }
      headers.set("Authorization", `Bearer ${this.session.token}`);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await this.fetcher(`${this.config.url}${path}`, {
        ...init, headers, signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer",
      });
      if (!response.ok) {
        if (response.status === 401) {
          if (authenticated) this.session = null;
          throw new Error(authenticated ? "La sesión terminó. Vuelve a entrar para publicar." : "Revisa tu correo y contraseña.");
        }
        if (response.status === 403) throw new Error("Tu cuenta no tiene permiso para esta acción.");
        if (response.status === 409 && path.startsWith("/rest/v1/iguide_place_covers")) throw new CoverChangedError();
        if (response.status === 413) throw new Error("La foto supera el tamaño permitido.");
        if (response.status === 429) throw new Error("Espera un momento y vuelve a intentarlo.");
        throw new Error("No se pudo completar la operación. Vuelve a intentarlo.");
      }
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        throw new Error("No pudimos confirmar la operación. Revisa tu conexión y actualiza antes de repetirla.", { cause: error });
      }
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async signIn(email: string, password: string): Promise<EditorSession> {
    this.session = null;
    const data = await this.request("/auth/v1/token?grant_type=password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    }) as { access_token?: string; expires_in?: number; user?: { id?: string; email?: string } };
    if (!data?.access_token || typeof data.expires_in !== "number" || data.expires_in <= 0 ||
      !data.user?.id || !/^[a-f0-9-]{36}$/i.test(data.user.id)) {
      throw new Error("No se pudo confirmar el acceso.");
    }
    this.session = {
      token: data.access_token, expiresAt: Date.now() + Math.min(data.expires_in, 86400) * 1000,
      email: data.user.email ?? email.trim(),
    };
    try {
      const editors = await this.request(`/rest/v1/iguide_photo_editors?select=user_id&user_id=eq.${data.user.id}&limit=1`, {}, true);
      if (!Array.isArray(editors) || !editors.some(row => row.user_id === data.user?.id)) {
        throw new Error("Tu cuenta todavía no está habilitada para editar locales.");
      }
      return { email: this.session.email, expiresAt: this.session.expiresAt };
    } catch (error) {
      await this.signOut();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const token = this.session?.token;
    this.session = null;
    if (!token) return;
    try {
      await this.request("/auth/v1/logout?scope=local", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* Local access is always cleared, including when offline. */ }
  }

  async listCovers(): Promise<PublishedPlaceCover[]> {
    return parsePublishedCovers(await this.request(`/rest/v1/iguide_place_covers?select=${COVER_FIELDS}&limit=1000`));
  }

  async publishCover(
    id: string, photo: Blob, alt: string, rightsConfirmed: boolean, expected: PublishedPlaceCover | null,
  ): Promise<PublishedPlaceCover> {
    assertPlaceId(id);
    if (!rightsConfirmed) throw new Error("Confirma que tienes autorización para publicar la fotografía.");
    if (photo.type !== "image/jpeg" || photo.size <= 0 || photo.size > MAX_COVER_BYTES) {
      throw new Error("La portada debe ser un JPG de hasta 2 MB.");
    }
    if (!alt.trim() || alt.trim().length > 160) throw new Error("Añade una descripción de hasta 160 caracteres.");
    const previous = expected === null ? null : parsePublishedCovers([expected])[0];
    if (previous && previous.experience_id !== id) throw new Error("La portada anterior no corresponde a este local.");
    const path = `${id}/${crypto.randomUUID()}.jpg`;
    await this.request(`/storage/v1/object/${PLACE_COVER_BUCKET}/${path}`, {
      method: "POST", headers: { "Content-Type": "image/jpeg", "Cache-Control": "max-age=3600", "x-upsert": "false" },
      body: photo,
    }, true);
    try {
      const filter = previous ? `&experience_id=eq.${id}&object_path=eq.${encodeURIComponent(previous.object_path)}` : "";
      const fields = { object_path: path, alt_text: alt.trim(), rights_confirmed: true };
      const rows = parsePublishedCovers(await this.request(`/rest/v1/iguide_place_covers?select=${COVER_FIELDS}${filter}`, {
        method: previous ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(previous ? fields : { experience_id: id, ...fields }),
      }, true));
      if (previous && rows.length === 0) throw new CoverChangedError();
      if (rows.length !== 1 || rows[0].experience_id !== id || rows[0].object_path !== path) throw new Error("Confirmación incompleta.");
      return rows[0];
    } catch (error) {
      if (error instanceof CoverChangedError) throw error;
      // A timed-out response may have committed. Never delete that upload.
      try {
        const confirmed = (await this.listCovers()).find(row => row.experience_id === id && row.object_path === path);
        if (confirmed) return confirmed;
      } catch { /* Keep the existing public state when reconciliation also fails. */ }
      throw new Error("La foto se subió, pero no pudimos confirmar su publicación. Actualiza las portadas antes de repetirla.", { cause: error });
    }
  }

  async removeCover(cover: PublishedPlaceCover): Promise<{ fileDeleted: boolean }> {
    const [validated] = parsePublishedCovers([cover]);
    const rows = parsePublishedCovers(await this.request(`/rest/v1/iguide_place_covers?experience_id=eq.${validated.experience_id}&object_path=eq.${validated.object_path}&select=${COVER_FIELDS}`, {
      method: "DELETE", headers: { Prefer: "return=representation" },
    }, true));
    if (rows.length !== 1) throw new Error("La portada cambió. Actualiza antes de retirarla.");
    try {
      await this.request(`/storage/v1/object/${PLACE_COVER_BUCKET}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [validated.object_path] }),
      }, true);
      return { fileDeleted: true };
    } catch { return { fileDeleted: false }; }
  }
}

let configuredService: PlacePhotoService | undefined;
export function getPlacePhotoService(): PlacePhotoService | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !key) return null;
  if (!url || !key) throw new Error("La conexión de fotos está incompleta.");
  configuredService ??= new PlacePhotoService({ url, publishableKey: key });
  return configuredService;
}
