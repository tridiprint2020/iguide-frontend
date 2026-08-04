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

export const catalog: Experience[] = [
    ...expeditions,
    ...restaurants,
    ...cafes,
    ...bars,
    ...hotels,
    ...museums,
    ...festivals,
    ...events,
    ...crafts,
];