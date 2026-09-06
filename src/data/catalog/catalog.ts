import type { Experience } from "../../types/experience";

import { expeditions } from "../experiences/expeditions/expeditions";
import { restaurants } from "../experiences/restaurants/restaurants";
import { cafes } from "../experiences/cafes/cafes";
import { bars } from "../experiences/bars/bars";
import { hotels } from "../experiences/hotels/hotels";
import { museums } from "../experiences/museums/museums";
import { festivals } from "../experiences/festivals/festivals";
import { events } from "../experiences/events/events";
import { crafts } from "../experiences/crafts/crafts";
import { foodRoutes } from "../experiences/foodRoutes/foodRoutes";

import {
  getAppLanguage,
  tx,
} from "../../i18n";

const TRANSLATABLE_STRING_FIELDS =
  new Set([
    "description",
    "hospes",
    "cuisine",
    "specialty",
  ]);

const TRANSLATABLE_ARRAY_FIELDS =
  new Set([
    "tags",
    "amenities",
    "roomTypes",
    "exhibitions",
    "menuHighlights",
  ]);

function localizeExperience(
  experience: Experience
): Experience {
  return new Proxy(
    experience,
    {
      get(target, property, receiver) {
        const value = Reflect.get(
          target,
          property,
          receiver
        ) as unknown;

        if (
          getAppLanguage() !== "en" ||
          typeof property !== "string"
        ) {
          return value;
        }

        if (
          TRANSLATABLE_STRING_FIELDS.has(
            property
          ) &&
          typeof value === "string"
        ) {
          return tx(value.trim());
        }

        if (
          TRANSLATABLE_ARRAY_FIELDS.has(
            property
          ) &&
          Array.isArray(value)
        ) {
          return value.map((item) =>
            typeof item === "string"
              ? tx(item)
              : item
          );
        }

        if (
          property === "huarique" &&
          value &&
          typeof value === "object"
        ) {
          const huarique = value as {
            reason?: unknown;
            signatureDish?: unknown;
            hospesTip?: unknown;
          };

          return {
            ...huarique,
            ...(typeof huarique.reason === "string"
              ? {
                  reason: tx(
                    huarique.reason.trim()
                  ),
                }
              : {}),
            ...(typeof huarique.signatureDish === "string"
              ? {
                  signatureDish: tx(
                    huarique.signatureDish.trim()
                  ),
                }
              : {}),
            ...(typeof huarique.hospesTip === "string"
              ? {
                  hospesTip: tx(
                    huarique.hospesTip.trim()
                  ),
                }
              : {}),
          };
        }

        return value;
      },
    }
  );
}

const baseCatalog: Experience[] = [
    ...expeditions,
    ...restaurants,
    ...cafes,
    ...bars,
    ...hotels,
    ...museums,
    ...festivals,
    ...events,
    ...crafts,
    ...foodRoutes,
];

export const catalog: Experience[] =
  baseCatalog
    .filter(
      (experience) =>
        experience.isActive !== false
    )
    .map(localizeExperience);
