import {
  addPointToTrack,
  addFinishPoint,
  loadTrack,
} from "./trackingEngine";

import {
  catalog,
} from "../data/catalog";

const MIN_DISTANCE_METERS = 8;
const MAX_ACCEPTABLE_ACCURACY_METERS = 45;
const MIN_TIME_BETWEEN_POINTS_MS = 4000;
/*
 * Una lectura de alta precisión dentro de 20 m es suficiente.
 * Exigir dos dejaba la llegada congelada cuando el usuario ya
 * estaba quieto y el GPS no emitía una segunda posición.
 */
const REQUIRED_ARRIVAL_READINGS = 1;
const MAX_ARRIVAL_READING_GAP_MS = 20000;

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 3000,
  timeout: 15000,
};

type WebkitWindow =
  typeof window & {
    webkitAudioContext?:
      typeof AudioContext;
  };

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadius = 6371000;

  const deltaLat =
    ((lat2 - lat1) *
      Math.PI) /
    180;

  const deltaLng =
    ((lng2 - lng1) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) /
        180
    ) *
      Math.cos(
        (lat2 * Math.PI) /
          180
      ) *
      Math.sin(
        deltaLng / 2
      ) **
        2;

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

export type LocationCallback = (
  lat: number,
  lng: number
) => void;

export class LocationTracker {
  private watchId:
    | number
    | null = null;

  private lastLat:
    | number
    | null = null;

  private lastLng:
    | number
    | null = null;

  private lastAcceptedTimestamp =
    0;

  private arrivalCompleted =
    false;

  private arrivalCandidateCount =
    0;

  private lastArrivalCandidateAt =
    0;

  private audioContext:
    | AudioContext
    | null = null;

  /**
   * Debe llamarse desde un clic real del usuario.
   * Android/Chrome bloquea el audio si el contexto
   * se crea por primera vez desde una lectura GPS.
   */
  prepareFeedback(): void {
    try {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as WebkitWindow
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (
        !this.audioContext ||
        this.audioContext.state ===
          "closed"
      ) {
        this.audioContext =
          new AudioContextClass();
      }

      if (
        this.audioContext.state ===
        "suspended"
      ) {
        void this.audioContext.resume();
      }

      /*
       * Pulso silencioso para desbloquear
       * el canal de audio durante el gesto.
       */
      const oscillator =
        this.audioContext.createOscillator();

      const gain =
        this.audioContext.createGain();

      gain.gain.value =
        0.00001;

      oscillator.connect(gain);
      gain.connect(
        this.audioContext.destination
      );

      oscillator.start();
      oscillator.stop(
        this.audioContext.currentTime +
          0.01
      );
    } catch (error) {
      console.info(
        "El dispositivo no permitió preparar el sonido:",
        error
      );
    }
  }

  private playArrivalFeedback(): void {
    if (
      "vibrate" in navigator
    ) {
      navigator.vibrate([
        180,
        90,
        220,
        90,
        320,
      ]);
    }

    try {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as WebkitWindow
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (
        !this.audioContext ||
        this.audioContext.state ===
          "closed"
      ) {
        this.audioContext =
          new AudioContextClass();
      }

      const audioContext =
        this.audioContext;

      const playTone = (
        frequency: number,
        startsAt: number,
        duration: number
      ) => {
        const oscillator =
          audioContext.createOscillator();

        const gain =
          audioContext.createGain();

        oscillator.type =
          "sine";

        oscillator.frequency.setValueAtTime(
          frequency,
          startsAt
        );

        gain.gain.setValueAtTime(
          0.0001,
          startsAt
        );

        gain.gain.exponentialRampToValueAtTime(
          0.28,
          startsAt + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startsAt +
            duration
        );

        oscillator.connect(gain);
        gain.connect(
          audioContext.destination
        );

        oscillator.start(
          startsAt
        );

        oscillator.stop(
          startsAt +
            duration +
            0.02
        );
      };

      const startAt =
        audioContext.currentTime +
        0.03;

      if (
        audioContext.state ===
        "suspended"
      ) {
        void audioContext
          .resume()
          .then(() => {
            const resumedAt =
              audioContext.currentTime +
              0.03;

            playTone(
              659.25,
              resumedAt,
              0.20
            );

            playTone(
              783.99,
              resumedAt + 0.20,
              0.22
            );

            playTone(
              987.77,
              resumedAt + 0.42,
              0.34
            );
          });

        return;
      }

      playTone(
        659.25,
        startAt,
        0.20
      );

      playTone(
        783.99,
        startAt + 0.20,
        0.22
      );

      playTone(
        987.77,
        startAt + 0.42,
        0.34
      );
    } catch (error) {
      console.info(
        "No se pudo reproducir el sonido de llegada:",
        error
      );
    }
  }

  start(
    experienceId: string,
    onUpdate: LocationCallback,
    completeJourneyContext: () => void,
    options?: {
      startsNewSegment?: boolean;
    }
  ): void {
    if (
      !navigator.geolocation
    ) {
      console.error(
        "Geolocalización no disponible en este navegador."
      );

      return;
    }

    if (
      this.watchId !== null
    ) {
      this.stop();
    }

    this.arrivalCompleted =
      false;

    this.arrivalCandidateCount =
      0;

    this.lastArrivalCandidateAt =
      0;

    this.watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude,
            longitude,
            accuracy,
          } = position.coords;

          const experience =
            catalog.find(
              (item) =>
                item.experienceId ===
                experienceId
            );

          if (!experience) {
            console.error(
              "No se encontró la experiencia activa:",
              experienceId
            );

            return;
          }

          /*
           * El punto comercial puede seguir dentro
           * del edificio. Cuando el catálogo incluya
           * arrivalLatitude/arrivalLongitude, el GPS
           * certificará usando el acceso público.
           */
          const targetLat =
            experience
              .arrivalLatitude ??
            experience.latitude;

          const targetLng =
            experience
              .arrivalLongitude ??
            experience.longitude;

          const configuredRadius =
            experience
              .certificationRadiusMeters ??
            25;

          const safeAccuracy =
            Number.isFinite(
              accuracy
            ) &&
            accuracy > 0
              ? accuracy
              : 35;

          /*
           * El error informado por el GPS no puede ampliar
           * el área del destino: en una calle con locales
           * cercanos certificaría el negocio equivocado.
           * La lectura debe entrar en el radio publicado y
           * además tener una precisión razonable para ese
           * tipo de experiencia.
           */
          const effectiveRadius =
            configuredRadius;

          const maximumArrivalAccuracy =
            Math.max(
              25,
              Math.min(
                configuredRadius * 1.5,
                100
              )
            );

          const distanceToDestination =
            getDistanceMeters(
              latitude,
              longitude,
              targetLat,
              targetLng
            );

          const now =
            Date.now();

          const isFirstReading =
            this.lastLat === null ||
            this.lastLng === null;

          const isAccurateEnoughForRoute =
            !Number.isFinite(accuracy) ||
            accuracy <=
              MAX_ACCEPTABLE_ACCURACY_METERS;

          /*
           * Chrome/Android suspende el GPS cuando el navegador
           * queda detrás de Bluetooth, YouTube u otra aplicación.
           * Al volver guardamos un comienzo de segmento, no un
           * tramo inventado entre la posición antigua y la actual.
           */
          if (
            isFirstReading &&
            options?.startsNewSegment &&
            isAccurateEnoughForRoute
          ) {
            addPointToTrack(
              experienceId,
              {
                lat: latitude,
                lng: longitude,
                timestamp: now,
                type: "resume",
              }
            );
          }

          const isReliableArrivalReading =
            safeAccuracy <=
              maximumArrivalAccuracy;

          const isInsideArrivalArea =
            distanceToDestination <=
              effectiveRadius;

          if (
            isInsideArrivalArea &&
            isReliableArrivalReading
          ) {
            const followsPreviousReading =
              this.lastArrivalCandidateAt > 0 &&
              now -
                this.lastArrivalCandidateAt <=
                MAX_ARRIVAL_READING_GAP_MS;

            this.arrivalCandidateCount =
              followsPreviousReading
                ? this.arrivalCandidateCount + 1
                : 1;

            this.lastArrivalCandidateAt =
              now;
          } else {
            this.arrivalCandidateCount =
              0;

            this.lastArrivalCandidateAt =
              0;
          }

          console.info(
            "Proximidad I.GUIDE",
            {
              destination:
                experience.title,
              distanceMeters:
                Math.round(
                  distanceToDestination
                ),
              effectiveRadius:
                Math.round(
                  effectiveRadius
                ),
              accuracyMeters:
                Math.round(
                  safeAccuracy
                ),
              requiredAccuracyMeters:
                Math.round(
                  maximumArrivalAccuracy
                ),
              arrivalReadings:
                this.arrivalCandidateCount,
              targetPosition: {
                lat: targetLat,
                lng: targetLng,
              },
            }
          );

          if (
            !this.arrivalCompleted &&
            this.arrivalCandidateCount >=
              REQUIRED_ARRIVAL_READINGS
          ) {
            const currentTrack =
              loadTrack(
                experienceId
              );

            if (
              currentTrack &&
              !currentTrack.completedAt
            ) {
              this.arrivalCompleted =
                true;

              const alreadyHasFinish =
                currentTrack.timeline.some(
                  (item) =>
                    item.type ===
                    "finish"
                );

              if (
                !alreadyHasFinish
              ) {
                addFinishPoint(
                  experienceId,
                  latitude,
                  longitude
                );
              }

              /*
               * Primero sincronizamos Timeline,
               * luego cerramos el sensor y finalmente
               * cambiamos React a la pantalla completada.
               */
              onUpdate(
                latitude,
                longitude
              );

              this.playArrivalFeedback();
              this.stop();
              completeJourneyContext();

              return;
            }
          }

          if (
            this.lastLat ===
              null ||
            this.lastLng ===
              null
          ) {
            if (!isAccurateEnoughForRoute) {
              return;
            }

            this.lastLat =
              latitude;

            this.lastLng =
              longitude;

            this.lastAcceptedTimestamp =
              now;

            onUpdate(
              latitude,
              longitude
            );

            return;
          }

          const tooSoon =
            now -
              this
                .lastAcceptedTimestamp <
            MIN_TIME_BETWEEN_POINTS_MS;

          const tooImprecise =
            Number.isFinite(
              accuracy
            ) &&
            accuracy >
              MAX_ACCEPTABLE_ACCURACY_METERS;

          if (
            tooSoon ||
            tooImprecise
          ) {
            return;
          }

          const moved =
            getDistanceMeters(
              this.lastLat,
              this.lastLng,
              latitude,
              longitude
            );

          if (
            moved <
            MIN_DISTANCE_METERS
          ) {
            return;
          }

          addPointToTrack(
            experienceId,
            {
              lat: latitude,
              lng: longitude,
              timestamp: now,
              type: "walk",
            }
          );

          this.lastLat =
            latitude;

          this.lastLng =
            longitude;

          this.lastAcceptedTimestamp =
            now;

          onUpdate(
            latitude,
            longitude
          );
        },

        (error) => {
          console.error(
            "Error de GPS:",
            error.message
          );
        },

        HIGH_ACCURACY_OPTIONS
      );
  }

  stop(): void {
    if (
      this.watchId !== null
    ) {
      navigator.geolocation.clearWatch(
        this.watchId
      );

      this.watchId =
        null;
    }

    this.lastLat =
      null;

    this.lastLng =
      null;

    this.lastAcceptedTimestamp =
      0;

    this.arrivalCandidateCount =
      0;

    this.lastArrivalCandidateAt =
      0;
  }
}

export const locationTracker =
  new LocationTracker();
