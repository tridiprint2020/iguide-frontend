import { useEffect, useState } from "react";
import { getGuardianCollection } from "../data/guardians";
import { getStickerCollection, type CollectionId } from "../data/collectibles";
import { loadUserProfile } from "../data/user";

export function useCollectibleCollection(collectionId?: CollectionId) {
  const [profile, setProfile] = useState(loadUserProfile);

  useEffect(() => {
    const refresh = () => setProfile(loadUserProfile());
    window.addEventListener("iguide-user-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("iguide-user-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return {
    guardians: getGuardianCollection(profile.visitedExperiences, collectionId),
    stickers: getStickerCollection(profile.visitedExperiences, collectionId),
  };
}
