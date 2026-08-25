import type {
  ArCaptureLabel,
} from "../components/ar/ArPinScene";

export type CoverCropRect = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

type CaptureArCompositeOptions = {
  video: HTMLVideoElement;
  overlayCanvas: HTMLCanvasElement;
  labels: ArCaptureLabel[];
  missionTitle?: string;
};

const MAX_CAPTURE_EDGE_PIXELS = 1440;

export function getCoverCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): CoverCropRect {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    throw new Error(
      "invalid-capture-dimensions"
    );
  }

  const sourceAspect =
    sourceWidth / sourceHeight;
  const targetAspect =
    targetWidth / targetHeight;

  if (sourceAspect > targetAspect) {
    const visibleWidth =
      sourceHeight * targetAspect;

    return {
      sourceX:
        (sourceWidth - visibleWidth) / 2,
      sourceY: 0,
      sourceWidth: visibleWidth,
      sourceHeight,
    };
  }

  const visibleHeight =
    sourceWidth / targetAspect;

  return {
    sourceX: 0,
    sourceY:
      (sourceHeight - visibleHeight) / 2,
    sourceWidth,
    sourceHeight: visibleHeight,
  };
}

function getOutputSize(
  overlayCanvas: HTMLCanvasElement
) {
  const viewportWidth =
    overlayCanvas.clientWidth ||
    window.innerWidth;
  const viewportHeight =
    overlayCanvas.clientHeight ||
    window.innerHeight;
  const longestEdge = Math.max(
    viewportWidth,
    viewportHeight
  );
  const scale = Math.min(
    window.devicePixelRatio || 1,
    MAX_CAPTURE_EDGE_PIXELS /
      longestEdge
  );

  return {
    width: Math.max(
      1,
      Math.round(viewportWidth * scale)
    ),
    height: Math.max(
      1,
      Math.round(viewportHeight * scale)
    ),
  };
}

function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(
    radius,
    width / 2,
    height / 2
  );

  context.beginPath();
  context.moveTo(
    x + safeRadius,
    y
  );
  context.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    safeRadius
  );
  context.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    safeRadius
  );
  context.arcTo(
    x,
    y + height,
    x,
    y,
    safeRadius
  );
  context.arcTo(
    x,
    y,
    x + width,
    y,
    safeRadius
  );
  context.closePath();
}

function fitLabelText(
  context: CanvasRenderingContext2D,
  value: string,
  maximumWidth: number
): string {
  if (
    context.measureText(value).width <=
    maximumWidth
  ) {
    return value;
  }

  let shortened = value;

  while (
    shortened.length > 2 &&
    context.measureText(
      `${shortened}…`
    ).width > maximumWidth
  ) {
    shortened = shortened.slice(0, -1);
  }

  return `${shortened}…`;
}

function drawBranding(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  missionTitle?: string
) {
  const padding = width * 0.044;
  const titleSize = Math.max(
    18,
    width * 0.037
  );
  const subtitleSize = Math.max(
    11,
    width * 0.021
  );
  const gradient =
    context.createLinearGradient(
      0,
      0,
      0,
      height * 0.22
    );

  gradient.addColorStop(
    0,
    "rgba(4,5,12,0.82)"
  );
  gradient.addColorStop(
    1,
    "rgba(4,5,12,0)"
  );
  context.fillStyle = gradient;
  context.fillRect(
    0,
    0,
    width,
    height * 0.24
  );

  context.fillStyle = "#FFFFFF";
  context.font =
    `900 ${titleSize}px system-ui, sans-serif`;
  context.fillText(
    "I.GUIDE AR",
    padding,
    padding + titleSize
  );

  context.fillStyle = "#39E7FF";
  context.font =
    `800 ${subtitleSize}px system-ui, sans-serif`;
  context.fillText(
    missionTitle
      ? `MISIÓN · ${missionTitle}`
      : "EXPLORACIÓN 360°",
    padding,
    padding + titleSize +
      subtitleSize * 1.55
  );
}

function drawLabels(
  context: CanvasRenderingContext2D,
  labels: ArCaptureLabel[],
  width: number,
  height: number
) {
  const titleSize = Math.max(
    12,
    width * 0.025
  );
  const distanceSize = Math.max(
    10,
    width * 0.019
  );
  const horizontalPadding =
    width * 0.022;
  const verticalPadding =
    height * 0.009;
  const maximumTextWidth =
    width * 0.42;

  labels.forEach((label) => {
    context.font =
      `850 ${titleSize}px system-ui, sans-serif`;
    const title = fitLabelText(
      context,
      label.title,
      maximumTextWidth
    );
    const titleWidth =
      context.measureText(title).width;

    context.font =
      `800 ${distanceSize}px system-ui, sans-serif`;
    const distanceWidth =
      context.measureText(
        label.distanceText
      ).width;
    const cardWidth =
      Math.max(
        titleWidth,
        distanceWidth
      ) + horizontalPadding * 2;
    const cardHeight =
      titleSize +
      distanceSize +
      verticalPadding * 3.3;
    const centerX =
      label.xRatio * width;
    const bottomY =
      label.yRatio * height -
      height * 0.008;
    const x = Math.min(
      width - cardWidth -
        horizontalPadding,
      Math.max(
        horizontalPadding,
        centerX - cardWidth / 2
      )
    );
    const y = Math.min(
      height - cardHeight -
        verticalPadding,
      Math.max(
        height * 0.12,
        bottomY - cardHeight
      )
    );

    drawRoundedRectangle(
      context,
      x,
      y,
      cardWidth,
      cardHeight,
      width * 0.018
    );
    context.fillStyle =
      "rgba(7,8,17,0.88)";
    context.fill();
    context.strokeStyle = label.mission
      ? "rgba(255,98,241,0.92)"
      : "rgba(57,231,255,0.68)";
    context.lineWidth = Math.max(
      1.5,
      width * 0.003
    );
    context.stroke();

    context.fillStyle = "#FFFFFF";
    context.font =
      `850 ${titleSize}px system-ui, sans-serif`;
    context.fillText(
      title,
      x + horizontalPadding,
      y + verticalPadding +
        titleSize
    );

    context.fillStyle = label.mission
      ? "#FF8FF5"
      : "#8AF4FF";
    context.font =
      `800 ${distanceSize}px system-ui, sans-serif`;
    context.fillText(
      label.distanceText,
      x + horizontalPadding,
      y + verticalPadding * 2.2 +
        titleSize + distanceSize
    );
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(
          new Error(
            "ar-capture-encoding-failed"
          )
        );
      },
      "image/jpeg",
      0.88
    );
  });
}

/**
 * Compone el fotograma visible de la cámara, el canvas WebGL y sus
 * etiquetas. No solicita otra cámara ni abandona la misión, por lo que
 * la imagen guardada coincide con la vista AR que el usuario encuadró.
 */
export async function captureArCompositeBlob({
  video,
  overlayCanvas,
  labels,
  missionTitle,
}: CaptureArCompositeOptions): Promise<Blob> {
  if (
    video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) {
    throw new Error(
      "ar-camera-frame-not-ready"
    );
  }

  const output = getOutputSize(
    overlayCanvas
  );
  const canvas =
    document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "ar-capture-context-unavailable"
    );
  }

  const crop = getCoverCropRect(
    video.videoWidth,
    video.videoHeight,
    output.width,
    output.height
  );

  context.drawImage(
    video,
    crop.sourceX,
    crop.sourceY,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    output.width,
    output.height
  );

  context.drawImage(
    overlayCanvas,
    0,
    0,
    overlayCanvas.width,
    overlayCanvas.height,
    0,
    0,
    output.width,
    output.height
  );

  drawBranding(
    context,
    output.width,
    output.height,
    missionTitle
  );
  drawLabels(
    context,
    labels,
    output.width,
    output.height
  );

  return canvasToBlob(canvas);
}
