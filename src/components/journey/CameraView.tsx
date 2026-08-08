import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  Check,
  ImagePlus,
  Route,
  RotateCcw,
} from "lucide-react";

import {
  useJourney,
} from "../../context/JourneyContext";

import type {
  TimelineItem,
} from "../../types/tracking/tracking";

const MAX_IMAGE_EDGE = 1280;
const JPEG_QUALITY = 0.74;

export function CameraView() {
  const {
    savePoint,
    resumeWalking,
  } = useJourney();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    photoFile,
    setPhotoFile,
  ] =
    useState<File | null>(
      null
    );

  const hasAutoOpenedRef =
    useRef(false);

  function openNativeCamera() {
    setErrorMessage(null);
    fileInputRef.current?.click();
  }

  useEffect(() => {
    if (hasAutoOpenedRef.current) {
      return;
    }

    hasAutoOpenedRef.current = true;

    // Dispara la cámara nativa apenas se entra a esta pantalla,
    // para que sea un solo toque desde fuera (en vez de dos).
    window.setTimeout(
      openNativeCamera,
      150
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decodeImage(
    file: File
  ): Promise<
    ImageBitmap | HTMLImageElement
  > {
    if (
      "createImageBitmap" in
      window
    ) {
      return createImageBitmap(
        file
      );
    }

    const dataUrl =
      await readFileAsDataUrl(
        file
      );

    return new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        image.onload = () =>
          resolve(image);

        image.onerror = () =>
          reject(
            new Error(
              "No se pudo preparar la fotografía."
            )
          );

        image.src =
          dataUrl;
      }
    );
  }

  async function compressImage(
    file: File
  ): Promise<string> {
    const image =
      await decodeImage(file);

    const sourceWidth =
      image.width;

    const sourceHeight =
      image.height;

    const scale =
      Math.min(
        1,
        MAX_IMAGE_EDGE /
          Math.max(
            sourceWidth,
            sourceHeight
          )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      Math.max(
        1,
        Math.round(
          sourceWidth *
            scale
        )
      );

    canvas.height =
      Math.max(
        1,
        Math.round(
          sourceHeight *
            scale
        )
      );

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "No se pudo procesar la fotografía."
      );
    }

    context.imageSmoothingEnabled =
      true;

    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (
      "close" in image &&
      typeof image.close ===
        "function"
    ) {
      image.close();
    }

    return canvas.toDataURL(
      "image/jpeg",
      JPEG_QUALITY
    );
  }

  function readFileAsDataUrl(
    file: File
  ): Promise<string> {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            if (
              typeof reader.result ===
              "string"
            ) {
              resolve(
                reader.result
              );

              return;
            }

            reject(
              new Error(
                "No se pudo convertir la fotografía."
              )
            );
          };

        reader.onerror =
          () =>
            reject(
              new Error(
                "No se pudo leer la fotografía."
              )
            );

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  function getCurrentCoordinates(): Promise<{
    lat: number;
    lng: number;
  }> {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !navigator.geolocation
        ) {
          reject(
            new Error(
              "Este dispositivo no permite obtener ubicación GPS."
            )
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat:
                position.coords
                  .latitude,

              lng:
                position.coords
                  .longitude,
            });
          },

          () => {
            reject(
              new Error(
                "No se pudo obtener tu ubicación. Activa el GPS e inténtalo nuevamente."
              )
            );
          },

          {
            enableHighAccuracy:
              true,

            maximumAge:
              8000,

            timeout:
              15000,
          }
        );
      }
    );
  }

  async function handlePhotoSelected(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    setErrorMessage(
      null
    );

    try {
      const photo =
        await readFileAsDataUrl(
          file
        );

      setPreview(
        photo
      );

      setPhotoFile(
        file
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la imagen."
      );
    }
  }

  async function handleConfirmMemory() {
    if (!photoFile) {
      return;
    }

    setIsSaving(
      true
    );

    setErrorMessage(
      null
    );

    try {
      const [
        compressedPhoto,
        coordinates,
      ] =
        await Promise.all([
          compressImage(
            photoFile
          ),

          getCurrentCoordinates(),
        ]);

      const memoryPoint:
        TimelineItem = {
        id:
          crypto.randomUUID(),

        type:
          "memory",

        lat:
          coordinates.lat,

        lng:
          coordinates.lng,

        timestamp:
          Date.now(),

        photo:
          compressedPhoto,
      };

      savePoint(
        memoryPoint
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el recuerdo."
      );

      setIsSaving(
        false
      );
    }
  }

  function handleRepeatPhoto() {
    setPreview(
      null
    );

    setPhotoFile(
      null
    );

    setErrorMessage(
      null
    );

    window.setTimeout(
      openNativeCamera,
      50
    );
  }

  return (
    <div
      style={{
        minHeight:
          "100dvh",

        height:
          "100dvh",

        display:
          "grid",

        gridTemplateRows:
          "auto minmax(0, 1fr) auto",

        boxSizing:
          "border-box",

        overflow:
          "hidden",

        backgroundColor:
          "#080910",

        color:
          "#FFFFFF",
      }}
    >
      <header
        style={{
          minHeight:
            "58px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "12px",

          padding:
            "8px 14px",

          borderBottom:
            "1px solid rgba(255,255,255,0.07)",

          background:
            "rgba(8,9,16,0.96)",
        }}
      >
        <button
          type="button"
          onClick={
            resumeWalking
          }
          disabled={
            isSaving
          }
          style={{
            minHeight:
              "42px",

            display:
              "inline-flex",

            alignItems:
              "center",

            gap:
              "7px",

            padding:
              "8px 11px",

            borderRadius:
              "12px",

            border:
              "1px solid rgba(255,255,255,0.10)",

            background:
              "rgba(255,255,255,0.05)",

            color:
              "#FFFFFF",

            fontWeight:
              750,

            cursor:
              "pointer",

            opacity:
              isSaving
                ? 0.45
                : 1,
          }}
        >
          <Route
            size={18}
          />

          Ruta
        </button>

        <span
          style={{
            color:
              "#FF3DE8",

            fontSize:
              "11px",

            fontWeight:
              900,

            letterSpacing:
              "0.10em",

            textTransform:
              "uppercase",
          }}
        >
          {preview
            ? "Revisar foto"
            : "Guardar recuerdo"}
        </span>
      </header>

      <main
        style={{
          minHeight:
            0,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding:
            "12px",

          overflow:
            "hidden",
        }}
      >
        <section
          style={{
            position:
              "relative",

            width:
              "100%",

            height:
              "100%",

            maxWidth:
              "620px",

            overflow:
              "hidden",

            borderRadius:
              "22px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background:
              "#11131D",

            boxShadow:
              "inset 0 0 35px rgba(0,0,0,0.34)",
          }}
        >
          {preview ? (
            <img
              src={
                preview
              }
              alt="Vista previa de la fotografía"
              style={{
                width:
                  "100%",

                height:
                  "100%",

                display:
                  "block",

                objectFit:
                  "contain",

                objectPosition:
                  "center",

                backgroundColor:
                  "#05060B",
              }}
            />
          ) : (
            <div
              style={{
                height:
                  "100%",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "12px",

                padding:
                  "26px",

                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  width:
                    "72px",

                  height:
                    "72px",

                  display:
                    "grid",

                  placeItems:
                    "center",

                  borderRadius:
                    "24px",

                  color:
                    "#FF3DE8",

                  background:
                    "rgba(255,0,255,0.10)",

                  border:
                    "1px solid rgba(255,0,255,0.28)",

                  boxShadow:
                    "0 0 26px rgba(255,0,255,0.14)",
                }}
              >
                <Camera
                  size={34}
                  strokeWidth={
                    1.6
                  }
                />
              </div>

              <strong
                style={{
                  fontSize:
                    "18px",
                }}
              >
                Captura el momento
              </strong>

              <p
                style={{
                  maxWidth:
                    "300px",

                  margin:
                    0,

                  color:
                    "rgba(255,255,255,0.56)",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.5,
                }}
              >
                La fotografía se guardará comprimida junto con tu ubicación.
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              style={{
                position:
                  "absolute",

                left:
                  "12px",

                right:
                  "12px",

                bottom:
                  "12px",

                padding:
                  "10px 12px",

                borderRadius:
                  "12px",

                border:
                  "1px solid rgba(255,85,85,0.34)",

                background:
                  "rgba(66,8,18,0.91)",

                color:
                  "#FFD3D3",

                fontSize:
                  "11px",

                lineHeight:
                  1.4,

                backdropFilter:
                  "blur(10px)",
              }}
            >
              {errorMessage}
            </div>
          )}
        </section>
      </main>

      <footer
        style={{
          padding:
            "10px 14px max(14px, env(safe-area-inset-bottom))",

          borderTop:
            "1px solid rgba(255,255,255,0.07)",

          background:
            "rgba(8,9,16,0.98)",

          boxShadow:
            "0 -12px 28px rgba(0,0,0,0.30)",
        }}
      >
        <input
          ref={
            fileInputRef
          }
          type="file"
          accept="image/*"
          capture="environment"
          onChange={
            handlePhotoSelected
          }
          style={{
            display:
              "none",
          }}
        />

        {preview ? (
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(0, 0.82fr) minmax(0, 1.18fr)",

              gap:
                "9px",

              maxWidth:
                "620px",

              margin:
                "0 auto",
            }}
          >
            <button
              type="button"
              onClick={
                handleRepeatPhoto
              }
              disabled={
                isSaving
              }
              style={{
                minHeight:
                  "52px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "7px",

                borderRadius:
                  "15px",

                border:
                  "1px solid rgba(255,255,255,0.13)",

                background:
                  "rgba(255,255,255,0.05)",

                color:
                  "#FFFFFF",

                fontWeight:
                  800,

                cursor:
                  "pointer",

                opacity:
                  isSaving
                    ? 0.45
                    : 1,
              }}
            >
              <RotateCcw
                size={18}
              />

              Repetir
            </button>

            <button
              type="button"
              onClick={() => {
                void handleConfirmMemory();
              }}
              disabled={
                isSaving
              }
              style={{
                minHeight:
                  "52px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "8px",

                border:
                  "none",

                borderRadius:
                  "15px",

                background:
                  "linear-gradient(145deg, #FF3DE8, #D4008D)",

                color:
                  "#FFFFFF",

                fontWeight:
                  900,

                cursor:
                  "pointer",

                boxShadow:
                  "0 10px 24px rgba(255,0,184,0.25)",

                opacity:
                  isSaving
                    ? 0.55
                    : 1,
              }}
            >
              <Check
                size={19}
              />

              {isSaving
                ? "Guardando…"
                : "Usar fotografía"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              openNativeCamera
            }
            disabled={
              isSaving
            }
            style={{
              width:
                "100%",

              maxWidth:
                "620px",

              minHeight:
                "54px",

              margin:
                "0 auto",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap:
                "9px",

              border:
                "none",

              borderRadius:
                "16px",

              background:
                "linear-gradient(145deg, #FF3DE8, #D4008D)",

              color:
                "#FFFFFF",

              fontSize:
                "14px",

              fontWeight:
                900,

              cursor:
                "pointer",

              boxShadow:
                "0 10px 26px rgba(255,0,184,0.26)",
            }}
          >
            <ImagePlus
              size={20}
            />

            Abrir cámara
          </button>
        )}
      </footer>
    </div>
  );
}