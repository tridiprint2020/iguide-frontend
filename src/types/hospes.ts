import type { HospesAction } from "./hospesBrain";

export type HospesTone =
  | "brand"
  | "info"
  | "success"
  | "warning";

export interface HospesMessage {
  title: string;
  message: string;
  icon: string;
  color: string;

  tone?: HospesTone;

  /*
   * Acción opcional sugerida por Hospes.
   * La pantalla decide cómo ejecutarla.
   */
  action?: HospesAction;
}