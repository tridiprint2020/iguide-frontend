import Sidebar from "../components/Sidebar";
import BrandMark from "../components/BrandMark";
import HomeLayout from "../components/HomeLayout";
import { Theme } from "../styles/theme";

function Home() {
  return (
    <div
      style={{
        position: "relative",

        backgroundColor:
          Theme.Colors.background,

        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",

        overflowX: "hidden",
      }}
    >
      <Sidebar />

      <BrandMark />

      <main
        style={{
          minHeight: "100vh",

          marginLeft: "64px",

          width: "calc(100% - 64px)",
          maxWidth: "calc(100vw - 64px)",

          boxSizing: "border-box",

          padding:
            "14px 12px 32px",

          overflowX: "hidden",
        }}
      >
        <HomeLayout />
      </main>
    </div>
  );
}

export default Home;