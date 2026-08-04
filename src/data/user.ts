import type {
  FavoriteReaction,
  UserFavorite,
  UserProfile,
} from "../types/user/user";

const STORAGE_KEY =
  "iguide_user_profile";

const defaultUser: UserProfile = {
  name: "Explorador",

  firstVisit: true,

  travelMode: "couple",

  interests: [
    "photography",
    "adventure",
  ],

  level: 1,

  experience: 0,

  visitedExperiences: [],

  achievements: [],

  favorites: [],
};

function cloneDefaultUser(): UserProfile {
  return {
    ...defaultUser,

    interests: [
      ...defaultUser.interests,
    ],

    visitedExperiences: [],

    achievements: [],

    favorites: [],
  };
}

/**
 * Migra perfiles antiguos para que las nuevas
 * propiedades no rompan usuarios ya guardados.
 */
function normalizeUserProfile(
  rawProfile:
    | Partial<UserProfile>
    | null
    | undefined
): UserProfile {
  const fallback =
    cloneDefaultUser();

  if (!rawProfile) {
    return fallback;
  }

  return {
    ...fallback,
    ...rawProfile,

    interests:
      Array.isArray(
        rawProfile.interests
      )
        ? rawProfile.interests
        : fallback.interests,

    visitedExperiences:
      Array.isArray(
        rawProfile.visitedExperiences
      )
        ? rawProfile.visitedExperiences
        : [],

    achievements:
      Array.isArray(
        rawProfile.achievements
      )
        ? rawProfile.achievements
        : [],

    favorites:
      Array.isArray(
        rawProfile.favorites
      )
        ? rawProfile.favorites
        : [],
  };
}

export function loadUserProfile():
  UserProfile {
  if (
    typeof window ===
    "undefined"
  ) {
    return cloneDefaultUser();
  }

  const storedData =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!storedData) {
    const initialProfile =
      cloneDefaultUser();

    saveUserProfile(
      initialProfile
    );

    return initialProfile;
  }

  try {
    const parsed =
      JSON.parse(
        storedData
      ) as Partial<UserProfile>;

    const normalized =
      normalizeUserProfile(
        parsed
      );

    /*
     * Guarda inmediatamente la versión migrada
     * para que favorites exista desde ahora.
     */
    saveUserProfile(
      normalized
    );

    return normalized;
  } catch (error) {
    console.error(
      "No se pudo leer el perfil I.GUIDE:",
      error
    );

    const fallback =
      cloneDefaultUser();

    saveUserProfile(
      fallback
    );

    return fallback;
  }
}

export function saveUserProfile(
  profile: UserProfile
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(profile)
  );

  /*
   * Permite que otros componentes sincronicen
   * su interfaz al cambiar favoritos o XP.
   */
  window.dispatchEvent(
    new CustomEvent(
      "iguide-user-updated",
      {
        detail: profile,
      }
    )
  );
}

export function completeExpedition(
  experienceId: string,
  xpReward: number = 100
): UserProfile {
  const profile =
    loadUserProfile();

  if (
    !profile.visitedExperiences.includes(
      experienceId
    )
  ) {
    profile.visitedExperiences = [
      ...profile.visitedExperiences,
      experienceId,
    ];

    profile.experience +=
      xpReward;

    const nextLevel =
      Math.floor(
        profile.experience / 300
      ) + 1;

    if (
      nextLevel >
      profile.level
    ) {
      profile.level =
        nextLevel;

      const achievementId =
        `level_${nextLevel}`;

      if (
        !profile.achievements.includes(
          achievementId
        )
      ) {
        profile.achievements = [
          ...profile.achievements,
          achievementId,
        ];
      }
    }

    saveUserProfile(
      profile
    );
  }

  return profile;
}

export function getFavorite(
  experienceId: string
): UserFavorite | null {
  const profile =
    loadUserProfile();

  return (
    profile.favorites.find(
      (favorite) =>
        favorite.experienceId ===
        experienceId
    ) ?? null
  );
}

export function isFavorite(
  experienceId: string
): boolean {
  return Boolean(
    getFavorite(
      experienceId
    )
  );
}

/**
 * Primer toque:
 * guarda el lugar.
 *
 * Segundo toque:
 * lo retira de favoritos.
 */
export function toggleFavorite(
  experienceId: string
): UserProfile {
  const profile =
    loadUserProfile();

  const existing =
    profile.favorites.find(
      (favorite) =>
        favorite.experienceId ===
        experienceId
    );

  if (existing) {
    profile.favorites =
      profile.favorites.filter(
        (favorite) =>
          favorite.experienceId !==
          experienceId
      );
  } else {
    const now =
      Date.now();

    profile.favorites = [
      ...profile.favorites,
      {
        experienceId,
        reaction: "saved",
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  saveUserProfile(
    profile
  );

  return profile;
}

/**
 * Cambia la valoración positiva.
 * Si aún no estaba guardado, lo crea.
 */
export function setFavoriteReaction(
  experienceId: string,
  reaction: FavoriteReaction
): UserProfile {
  const profile =
    loadUserProfile();

  const now =
    Date.now();

  const existing =
    profile.favorites.find(
      (favorite) =>
        favorite.experienceId ===
        experienceId
    );

  if (existing) {
    profile.favorites =
      profile.favorites.map(
        (favorite) =>
          favorite.experienceId ===
          experienceId
            ? {
                ...favorite,
                reaction,
                updatedAt: now,
              }
            : favorite
      );
  } else {
    profile.favorites = [
      ...profile.favorites,
      {
        experienceId,
        reaction,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  saveUserProfile(
    profile
  );

  return profile;
}

export function removeFavorite(
  experienceId: string
): UserProfile {
  const profile =
    loadUserProfile();

  profile.favorites =
    profile.favorites.filter(
      (favorite) =>
        favorite.experienceId !==
        experienceId
    );

  saveUserProfile(
    profile
  );

  return profile;
}

export function resetUserProfile():
  UserProfile {
  const profile =
    cloneDefaultUser();

  saveUserProfile(
    profile
  );

  return profile;
}