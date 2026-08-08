import {
  tx,
} from "../i18n";

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_JPEG_QUALITY = 0.74;

async function decodePhoto(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(tx("No se pudo preparar la fotografía."))
      );
    };
    image.src = objectUrl;
  });
}

export async function compressPhotoFile(
  file: File,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = DEFAULT_JPEG_QUALITY
): Promise<Blob> {
  const image = await decodePhoto(file);
  const scale = Math.min(
    1,
    maxEdge / Math.max(image.width, image.height)
  );
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(
    1,
    Math.round(image.width * scale)
  );
  canvas.height = Math.max(
    1,
    Math.round(image.height * scale)
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(tx("No se pudo procesar la fotografía."));
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  if (
    "close" in image &&
    typeof image.close === "function"
  ) {
    image.close();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 1;
        canvas.height = 1;

        if (blob) {
          resolve(blob);
          return;
        }

        reject(
          new Error(tx("No se pudo comprimir la fotografía."))
        );
      },
      "image/jpeg",
      quality
    );
  });
}
