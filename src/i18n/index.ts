import i18n, {
  type TOptions,
} from "i18next";

import {
  initReactI18next,
} from "react-i18next";

import en from "./en";

export type AppLanguage =
  | "es"
  | "en";

const LANGUAGE_STORAGE_KEY =
  "iguide.lang";

function getInitialLanguage(): AppLanguage {
  const storedLanguage =
    localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

  if (storedLanguage === "en" || storedLanguage === "es") {
    return storedLanguage;
  }

  return navigator.language.toLowerCase().startsWith("en")
    ? "en"
    : "es";
}

const initialLanguage =
  getInitialLanguage();

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        translation: {},
      },
      en: {
        translation: en,
      },
    },
    lng: initialLanguage,
    fallbackLng: "es",
    supportedLngs: [
      "es",
      "en",
    ],
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

function synchronizeLanguage(
  language: string
) {
  const normalizedLanguage:
    AppLanguage =
      language.startsWith("en")
        ? "en"
        : "es";

  document.documentElement.lang =
    normalizedLanguage;

  localStorage.setItem(
    LANGUAGE_STORAGE_KEY,
    normalizedLanguage
  );
}

synchronizeLanguage(initialLanguage);

i18n.on(
  "languageChanged",
  synchronizeLanguage
);

export function tx(
  spanishText: string,
  options?: TOptions
): string {
  return i18n.t(
    spanishText,
    options
  );
}

export function getAppLanguage(): AppLanguage {
  return i18n.resolvedLanguage
    ?.startsWith("en")
    ? "en"
    : "es";
}

export default i18n;
