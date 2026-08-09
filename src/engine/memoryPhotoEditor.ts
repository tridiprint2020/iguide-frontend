import {
  deletePhoto,
  loadPhotoBlob,
  storePhotoBlob,
} from "./mediaStorage";
import {
  transformPhotoBlob,
  type PhotoTransformation,
} from "./photoProcessing";
import {
  updateMemoryPhoto,
} from "./trackingEngine";
import type {
  ExpeditionTrack,
} from "../types/tracking/tracking";
import { tx } from "../i18n";

export async function transformMemoryPhoto(
  experienceId: string,
  memoryId: string,
  photoReference: string,
  transformation: PhotoTransformation
): Promise<ExpeditionTrack> {
  const originalBlob = await loadPhotoBlob(photoReference);

  if (!originalBlob) {
    throw new Error(tx("No se encontró la fotografía guardada."));
  }

  const transformedBlob = await transformPhotoBlob(
    originalBlob,
    transformation
  );
  const nextReference = await storePhotoBlob(transformedBlob);
  const updatedTrack = updateMemoryPhoto(
    experienceId,
    memoryId,
    nextReference
  );

  if (!updatedTrack) {
    await deletePhoto(nextReference).catch(() => undefined);
    throw new Error(tx("No se pudo actualizar la fotografía."));
  }

  /* La nueva referencia ya es la fuente de verdad; liberamos el Blob viejo. */
  await deletePhoto(photoReference).catch(() => undefined);

  return updatedTrack;
}
