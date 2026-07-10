import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Expedition from "./pages/Expedition";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/expedition" element={<Expedition />} />
    </Routes>
  );
}

export default App;