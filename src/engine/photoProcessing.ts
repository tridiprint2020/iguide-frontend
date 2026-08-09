import {
  tx,
} from "../i18n";

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_JPEG_QUALITY = 0.74;

export type PhotoTransformation =
  | "flip-horizontal"
  | "rotate-clockwise";

type DecodedPhoto = ImageBitmap | HTMLImageElement;

async function decodePhoto(
  source: Blob
): Promise<DecodedPhoto> {
  if ("createImageBitmap" in window) {
    /*
     * Chrome interpreta aquí la orientación EXIF del archivo. No volvemos
     * a rotarla manualmente: hacerlo una segunda vez fue lo que convirtió
     * fotografías verticales de Android en imágenes horizontales.
     */
    try {
      return await createImageBitmap(source, {
        imageOrientation: "from-image",
      });
    } catch {
      /*
       * WebViews antiguos exponen ImageBitmap pero no todas sus opciones.
       * <img> conserva la orientación visual y evita bloquear el guardado.
       */
    }
  }

  const objectUrl = URL.createObjectURL(source);

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

function releasePhoto(image: DecodedPhoto) {
  if (
    "close" in image &&
    typeof image.close === "function"
  ) {
    image.close();
  }
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
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

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    releasePhoto(image);
    throw new Error(tx("No se pudo procesar la fotografía."));
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  releasePhoto(image);

  return canvasToJpegBlob(canvas, quality);
}

/**
 * Ajuste manual y reversible para cámaras que entregan el selfie ya
 * reflejado en los píxeles. La PWA no puede saber qué lente eligió el
 * usuario dentro de la cámara nativa, por eso el control queda en la
 * MemoryCard y nunca altera por defecto las fotos de la cámara trasera.
 */
export async function transformPhotoBlob(
  blob: Blob,
  transformation: PhotoTransformation,
  quality = 0.86
): Promise<Blob> {
  const image = await decodePhoto(blob);
  const rotates = transformation === "rotate-clockwise";
  const canvas = document.createElement("canvas");

  canvas.width = rotates ? image.height : image.width;
  canvas.height = rotates ? image.width : image.height;

  const context = canvas.getContext("2d");

  if (!context) {
    releasePhoto(image);
    throw new Error(tx("No se pudo procesar la fotografía."));
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.save();

  if (transformation === "flip-horizontal") {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
    context.drawImage(image, 0, 0, image.width, image.height);
  }

  context.restore();
  releasePhoto(image);

  return canvasToJpegBlob(canvas, quality);
}
