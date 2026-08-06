import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";


const sourceDirectory = path.resolve(
  "src/assets/placeholders"
);

const outputDirectory = path.resolve(
  "src/assets/optimized"
);

const supportedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const LARGE_PHOTO_WIDTH = 1000;
const LOGO_WIDTH = 360;

async function ensureDirectory(
  directoryPath
) {
  await fs.mkdir(
    directoryPath,
    {
      recursive: true,
    }
  );
}

async function getFilesRecursively(
  directoryPath
) {
  const entries =
    await fs.readdir(
      directoryPath,
      {
        withFileTypes: true,
      }
    );

  const files = [];

  for (const entry of entries) {
    const fullPath =
      path.join(
        directoryPath,
        entry.name
      );

    if (entry.isDirectory()) {
      const nestedFiles =
        await getFilesRecursively(
          fullPath
        );

      files.push(
        ...nestedFiles
      );

      continue;
    }

    const extension =
      path.extname(
        entry.name
      ).toLowerCase();

    if (
      supportedExtensions.has(
        extension
      )
    ) {
      files.push(
        fullPath
      );
    }
  }

  return files;
}

function isLogoFile(
  fileName
) {
  return fileName
    .toLowerCase()
    .includes("logo");
}

async function optimizeFile(
  sourcePath
) {
  const relativePath =
    path.relative(
      sourceDirectory,
      sourcePath
    );

  const parsedPath =
    path.parse(
      relativePath
    );

  const destinationDirectory =
    path.join(
      outputDirectory,
      parsedPath.dir
    );

  await ensureDirectory(
    destinationDirectory
  );

  const destinationPath =
    path.join(
      destinationDirectory,
      `${parsedPath.name}.webp`
    );

  const logo =
    isLogoFile(
      parsedPath.name
    );

  const inputStats =
    await fs.stat(
      sourcePath
    );

  const image =
    sharp(
      sourcePath,
      {
        failOn: "none",
      }
    ).rotate();

  const metadata =
    await image.metadata();

  const maximumWidth =
    logo
      ? LOGO_WIDTH
      : LARGE_PHOTO_WIDTH;

  const shouldResize =
    typeof metadata.width ===
      "number" &&
    metadata.width >
      maximumWidth;

  let pipeline =
    image;

  if (shouldResize) {
    pipeline =
      pipeline.resize({
        width:
          maximumWidth,

        withoutEnlargement:
          true,

        fit:
          "inside",
      });
  }

  await pipeline
    .webp({
      quality:
        logo
          ? 78
          : 66,

      alphaQuality: 85,

      effort: 6,

      smartSubsample:
        true,
    })
    .toFile(
      destinationPath
    );

  const outputStats =
    await fs.stat(
      destinationPath
    );

  const reduction =
    inputStats.size > 0
      ? Math.round(
          (
            1 -
            outputStats.size /
              inputStats.size
          ) *
            100
        )
      : 0;

  console.log(
    [
      relativePath,
      `${(
        inputStats.size /
        1024
      ).toFixed(0)} KB`,
      "→",
      `${(
        outputStats.size /
        1024
      ).toFixed(0)} KB`,
      `(${reduction}% menos)`,
    ].join(" ")
  );
}

async function main() {
  await ensureDirectory(
    outputDirectory
  );

  const files =
    await getFilesRecursively(
      sourceDirectory
    );

  if (
    files.length === 0
  ) {
    console.log(
      "No se encontraron imágenes compatibles."
    );

    return;
  }

  console.log(
    `Optimizando ${files.length} imágenes...`
  );

  for (const filePath of files) {
    try {
      await optimizeFile(
        filePath
      );
    } catch (error) {
      console.error(
        `No se pudo optimizar ${filePath}:`,
        error
      );
    }
  }

  console.log(
    "\nOptimización terminada."
  );

  console.log(
    `Archivos generados en: ${outputDirectory}`
  );
}

void main();