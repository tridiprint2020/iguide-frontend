const FEEDBACK_ENABLED_KEY =
  "iguide_sensory_feedback_enabled";

type WebkitWindow =
  typeof window & {
    webkitAudioContext?:
      typeof AudioContext;
  };

type ToneOptions = {
  frequency: number;
  startsAt: number;
  duration: number;
  volume?: number;
  type?: OscillatorType;
  endFrequency?: number;
};

class SensoryFeedbackEngine {
  private audioContext:
    | AudioContext
    | null = null;

  isEnabled(): boolean {
    return (
      localStorage.getItem(
        FEEDBACK_ENABLED_KEY
      ) !== "false"
    );
  }

  setEnabled(enabled: boolean): void {
    localStorage.setItem(
      FEEDBACK_ENABLED_KEY,
      String(enabled)
    );

    window.dispatchEvent(
      new CustomEvent(
        "iguide-feedback-setting-changed",
        { detail: { enabled } }
      )
    );
  }

  prepare(): void {
    if (!this.isEnabled()) {
      return;
    }

    const context =
      this.getAudioContext();

    if (!context) {
      return;
    }

    if (
      context.state ===
      "suspended"
    ) {
      void context.resume();
    }

    const oscillator =
      context.createOscillator();
    const gain =
      context.createGain();

    gain.gain.value = 0.00001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(
      context.currentTime + 0.01
    );
  }

  missionStart(): void {
    this.play((context) => {
      const start =
        context.currentTime + 0.02;

      this.tone(context, {
        frequency: 392,
        endFrequency: 523.25,
        startsAt: start,
        duration: 0.18,
        volume: 0.11,
        type: "sine",
      });

      this.tone(context, {
        frequency: 659.25,
        startsAt: start + 0.16,
        duration: 0.22,
        volume: 0.12,
        type: "sine",
      });
    });

    this.vibrate([45]);
  }

  shutter(): void {
    this.play((context) => {
      const start =
        context.currentTime + 0.01;

      const buffer =
        context.createBuffer(
          1,
          Math.ceil(
            context.sampleRate * 0.16
          ),
          context.sampleRate
        );
      const channel =
        buffer.getChannelData(0);

      for (
        let index = 0;
        index < channel.length;
        index += 1
      ) {
        const decay =
          1 - index / channel.length;
        channel[index] =
          (Math.random() * 2 - 1) *
          decay;
      }

      const source =
        context.createBufferSource();
      const filter =
        context.createBiquadFilter();
      const gain =
        context.createGain();

      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 1250;
      filter.Q.value = 0.85;

      gain.gain.setValueAtTime(
        0.0001,
        start
      );
      gain.gain.exponentialRampToValueAtTime(
        0.18,
        start + 0.008
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + 0.15
      );

      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start(start);
      source.stop(start + 0.16);

      this.tone(context, {
        frequency: 145,
        endFrequency: 82,
        startsAt: start,
        duration: 0.07,
        volume: 0.16,
        type: "square",
      });

      this.tone(context, {
        frequency: 118,
        endFrequency: 72,
        startsAt: start + 0.085,
        duration: 0.065,
        volume: 0.12,
        type: "square",
      });
    });

    this.vibrate([24, 32, 18]);
  }

  memorySaved(): void {
    this.play((context) => {
      const start =
        context.currentTime + 0.02;

      this.tone(context, {
        frequency: 659.25,
        endFrequency: 880,
        startsAt: start,
        duration: 0.18,
        volume: 0.10,
        type: "sine",
      });
    });

    this.vibrate([34]);
  }

  favorite(): void {
    this.play((context) => {
      const start =
        context.currentTime + 0.015;

      this.tone(context, {
        frequency: 587.33,
        endFrequency: 783.99,
        startsAt: start,
        duration: 0.15,
        volume: 0.08,
        type: "sine",
      });
    });

    this.vibrate([24]);
  }

  arrival(): void {
    this.play((context) => {
      const start =
        context.currentTime + 0.03;

      [
        523.25,
        659.25,
        783.99,
      ].forEach(
        (frequency, index) => {
          this.tone(context, {
            frequency,
            startsAt:
              start + index * 0.16,
            duration:
              index === 2
                ? 0.32
                : 0.20,
            volume:
              index === 2
                ? 0.15
                : 0.12,
            type: "sine",
          });
        }
      );
    });

    this.vibrate([
      110,
      65,
      150,
    ]);
  }

  private getAudioContext():
    | AudioContext
    | null {
    try {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as WebkitWindow
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      if (
        !this.audioContext ||
        this.audioContext.state ===
          "closed"
      ) {
        this.audioContext =
          new AudioContextClass();
      }

      return this.audioContext;
    } catch {
      return null;
    }
  }

  private play(
    buildSound: (
      context: AudioContext
    ) => void
  ): void {
    if (!this.isEnabled()) {
      return;
    }

    const context =
      this.getAudioContext();

    if (!context) {
      return;
    }

    if (
      context.state ===
      "suspended"
    ) {
      void context
        .resume()
        .then(() =>
          buildSound(context)
        )
        .catch(() => undefined);
      return;
    }

    buildSound(context);
  }

  private tone(
    context: AudioContext,
    options: ToneOptions
  ): void {
    const oscillator =
      context.createOscillator();
    const gain =
      context.createGain();
    const end =
      options.startsAt +
      options.duration;

    oscillator.type =
      options.type ?? "sine";
    oscillator.frequency.setValueAtTime(
      options.frequency,
      options.startsAt
    );

    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        options.endFrequency,
        end
      );
    }

    gain.gain.setValueAtTime(
      0.0001,
      options.startsAt
    );
    gain.gain.exponentialRampToValueAtTime(
      options.volume ?? 0.12,
      options.startsAt + 0.018
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(options.startsAt);
    oscillator.stop(end + 0.02);
  }

  private vibrate(
    pattern: number[]
  ): void {
    if (
      !this.isEnabled() ||
      !("vibrate" in navigator)
    ) {
      return;
    }

    navigator.vibrate(pattern);
  }
}

export const sensoryFeedbackEngine =
  new SensoryFeedbackEngine();
