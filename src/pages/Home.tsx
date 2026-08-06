import {
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import BrandMark from "../components/BrandMark";
import HomeLayout from "../components/HomeLayout";

import {
  NameCaptureModal,
} from "../components/NameCaptureModal";

import {
  loadUserProfile,
} from "../data/user";

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
    </div>
  );
}

export default Home;