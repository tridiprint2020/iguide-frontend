export interface Expedition {

  id: number;

  slug: string;

  title: string;

  city: string;

  distance: string;

  driveTime: string;

  walkTime: string;

  duration: string;

  difficulty: string;

  price: string;

  hospes: string;

  image: string;

  affinity: {

      firstTimeVisitor: number;

      family: number;

      couples: number;

      backpacker: number;

      adventure: number;

      photography: number;

      gastronomy: number;

      nightlife: number;

  };
}