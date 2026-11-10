import { useEffect, useState } from "react";
import { getGuardianCollection } from "../data/guardians";
import { loadUserProfile } from "../data/user";

export function useGuardianCollection() {
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

  return getGuardianCollection(profile.visitedExperiences);
}
