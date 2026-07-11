import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Expedition from "./pages/Expedition";
import Explorer from "./pages/Explorer";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/expedition/:slug" element={<Expedition />} />
      <Route path="/explorer" element={<Explorer />} />
    </Routes>
  );
}

export default App;