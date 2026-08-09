import {
  tx,
} from "../i18n";

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_JPEG_QUALITY = 0.74;

type DecodedPhoto = {
  image: ImageBitmap | HTMLImageElement;
  rotationDegrees: 0 | 90 | 180 | 270;
};

async function readExifOrientation(file: File): Promise<number> {
  if (file.type && !/^image\/jpe?g$/i.test(file.type)) {
    return 1;
  }

  try {
    const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
    const view = new DataView(buffer);

    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return 1;
    }

    let offset = 2;

    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffd9 || marker === 0xffda) {
        break;
      }

      const segmentLength = view.getUint16(offset, false);
      const payloadStart = offset + 2;

      if (
        marker === 0xffe1 &&
        segmentLength >= 14 &&
        payloadStart + segmentLength - 2 <= view.byteLength &&
        view.getUint32(payloadStart, false) === 0x45786966 &&
        view.getUint16(payloadStart + 4, false) === 0
      ) {
        const tiffStart = payloadStart + 6;
        const byteOrder = view.getUint16(tiffStart, false);
        const littleEndian = byteOrder === 0x4949;

        if (!littleEndian && byteOrder !== 0x4d4d) {
          return 1;
        }

        const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const directoryStart = tiffStart + firstIfdOffset;

        if (directoryStart + 2 > view.byteLength) {
          return 1;
        }

        const entries = view.getUint16(directoryStart, littleEndian);

        for (let index = 0; index < entries; index += 1) {
          const entryOffset = directoryStart + 2 + index * 12;

          if (entryOffset + 12 > view.byteLength) {
            break;
          }

          if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
            const orientation = view.getUint16(entryOffset + 8, littleEndian);
            return orientation >= 1 && orientation <= 8
              ? orientation
              : 1;
          }
        }

        return 1;
      }

      if (segmentLength < 2) {
        break;
      }

      offset += segmentLength;
    }
  } catch {
    // Una foto sin EXIF sigue siendo válida y se procesa normalmente.
  }

  return 1;
}

function getUnmirroredRotation(
  orientation: number
): 0 | 90 | 180 | 270 {
  if (orientation === 3 || orientation === 4) {
    return 180;
  }

  if (orientation === 5 || orientation === 8) {
    return 270;
  }

  if (orientation === 6 || orientation === 7) {
    return 90;
  }

  return 0;
}

async function decodePhoto(
  file: File
): Promise<DecodedPhoto> {
  if ("createImageBitmap" in window) {
    const orientation = await readExifOrientation(file);
    const image = await createImageBitmap(file, {
      imageOrientation: "none",
    });

    return {
      image,
      /*
       * Conservamos la rotación física, pero descartamos los indicadores
       * EXIF de espejo usados por algunas cámaras frontales de Android.
       */
      rotationDegrees: getUnmirroredRotation(orientation),
    };
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        image,
        /* <img> ya interpreta EXIF en navegadores sin ImageBitmap. */
        rotationDegrees: 0,
      });
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
  const {
    image,
    rotationDegrees,
  } = await decodePhoto(file);
  const swapsDimensions =
    rotationDegrees === 90 || rotationDegrees === 270;
  const orientedWidth = swapsDimensions ? image.height : image.width;
  const orientedHeight = swapsDimensions ? image.width : image.height;
  const scale = Math.min(
    1,
    maxEdge / Math.max(orientedWidth, orientedHeight)
  );
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(
    1,
    Math.round(orientedWidth * scale)
  );
  canvas.height = Math.max(
    1,
    Math.round(orientedHeight * scale)
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(tx("No se pudo procesar la fotografía."));
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.save();

  if (rotationDegrees === 90) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  } else if (rotationDegrees === 180) {
    context.translate(canvas.width, canvas.height);
    context.rotate(Math.PI);
  } else if (rotationDegrees === 270) {
    context.translate(0, canvas.height);
    context.rotate(-Math.PI / 2);
  }

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, 0, 0, drawWidth, drawHeight);
  context.restore();

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
