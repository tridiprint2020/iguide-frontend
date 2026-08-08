const DATABASE_NAME = "iguide-media";
const DATABASE_VERSION = 1;
const PHOTO_STORE = "photos";
const PHOTO_REFERENCE_PREFIX = "iguide-photo:";

type StoredPhoto = {
  id: string;
  blob: Blob;
  createdAt: number;
};

let databasePromise: Promise<IDBDatabase> | null = null;

function openMediaDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(
        new Error(
          "Este navegador no permite guardar fotografías de forma segura."
        )
      );
      return;
    }

    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(PHOTO_STORE)) {
        database.createObjectStore(PHOTO_STORE, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(
        request.error ??
          new Error("No se pudo abrir el archivo de recuerdos.")
      );
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(
        new Error(
          "El archivo de recuerdos está ocupado. Cierra otras pestañas de I.GUIDE e inténtalo otra vez."
        )
      );
    };
  });

  return databasePromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openMediaDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(
          PHOTO_STORE,
          mode
        );
        const request = operation(
          transaction.objectStore(PHOTO_STORE)
        );

        request.onerror = () =>
          reject(
            request.error ??
              new Error("No se pudo acceder al recuerdo.")
          );
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () =>
          reject(
            transaction.error ??
              new Error("No se pudo completar el guardado.")
          );
      })
  );
}

export function isStoredPhotoReference(
  value?: string
): boolean {
  return Boolean(value?.startsWith(PHOTO_REFERENCE_PREFIX));
}

function getPhotoId(reference: string): string {
  return reference.slice(PHOTO_REFERENCE_PREFIX.length);
}

/**
 * Guarda el archivo pesado fuera de localStorage. El timeline conserva
 * únicamente esta referencia pequeña, evitando agotar la cuota de Chrome.
 */
export async function storePhotoBlob(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const photo: StoredPhoto = {
    id,
    blob,
    createdAt: Date.now(),
  };

  await runTransaction<IDBValidKey>(
    "readwrite",
    (store) => store.put(photo)
  );

  return `${PHOTO_REFERENCE_PREFIX}${id}`;
}

export async function loadPhotoBlob(
  reference: string
): Promise<Blob | null> {
  if (!isStoredPhotoReference(reference)) {
    return null;
  }

  const stored = await runTransaction<StoredPhoto | undefined>(
    "readonly",
    (store) => store.get(getPhotoId(reference))
  );

  return stored?.blob ?? null;
}

export async function deletePhoto(
  reference: string
): Promise<void> {
  if (!isStoredPhotoReference(reference)) {
    return;
  }

  await runTransaction<undefined>(
    "readwrite",
    (store) => store.delete(getPhotoId(reference))
  );
}
