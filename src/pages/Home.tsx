import {
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import BrandMark from "../components/BrandMark";
import HomeLayout from "../components/HomeLayout";
import LanguageToggle from "../components/LanguageToggle";

import {
  NameCaptureModal,
} from "../components/NameCaptureModal";
import ReturnPointOnboardingModal from "../components/ReturnPointOnboardingModal";

import {
  loadUserProfile,
  saveUserProfile,
} from "../data/user";
import { loadReturnPoint } from "../engine/returnPointEngine";

import type {
  UserProfile,
} from "../types/user/user";

import {
  Theme,
} from "../styles/theme";

function Home() {
  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>(
      () =>
        loadUserProfile()
    );

  const [
    showNameModal,
    setShowNameModal,
  ] = useState(
    () =>
      profile.firstVisit
  );

  const [
    showReturnPointModal,
    setShowReturnPointModal,
  ] = useState(
    () =>
      !profile.firstVisit &&
      !profile.returnPointOnboardingComplete &&
      !loadReturnPoint()
  );

  function handleProfileUpdated(
    updatedProfile:
      UserProfile
  ) {
    setProfile(
      updatedProfile
    );

    setShowNameModal(
      false
    );

    if (
      !updatedProfile.returnPointOnboardingComplete &&
      !loadReturnPoint()
    ) {
      setShowReturnPointModal(true);
    }
  }

  function handleReturnPointOnboardingComplete() {
    const currentProfile = loadUserProfile();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      returnPointOnboardingComplete: true,
    };

    saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setShowReturnPointModal(false);
  }

  return (
    <div
      style={{
        position:
          "relative",

        backgroundColor:
          Theme.Colors
            .background,

        minHeight:
          "100vh",

        width:
          "100%",

        maxWidth:
          "100vw",

        overflowX:
          "hidden",
      }}
    >
      <Sidebar />

      <BrandMark />

      {/* Durante la bienvenida el selector vive dentro de su tarjeta. */}
      {!showNameModal && !showReturnPointModal && <LanguageToggle />}

      <main
        style={{
          minHeight:
            "100vh",

          marginLeft:
            "64px",

          width:
            "calc(100% - 64px)",

          maxWidth:
            "calc(100vw - 64px)",

          boxSizing:
            "border-box",

          padding:
            "14px 12px 32px",

          overflowX:
            "hidden",
        }}
      >
        <HomeLayout
          key={`${profile.name}-${profile.firstVisit}`}
        />
      </main>

      {showNameModal && (
        <NameCaptureModal
          onClose={() =>
            setShowNameModal(
              false
            )
          }
          onProfileUpdated={
            handleProfileUpdated
          }
        />
      )}

      {showReturnPointModal && !showNameModal && (
        <ReturnPointOnboardingModal
          onComplete={handleReturnPointOnboardingComplete}
        />
      )}
    </div>
  );
}

export default Home;
