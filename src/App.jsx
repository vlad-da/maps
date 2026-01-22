import { Route, Routes } from "react-router-dom";
import Layout from "./layout/Layout";
import AtlasMap from "./components/atlas-map/AtlasMap";
import WrapMapLibre from "./components/map-libre-map/WrapMapLibre";
import WrapOc from "./components/simple-map/WrapOc";
import { routes } from "./routes";
function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<AtlasMap routes={routes} />} />
          <Route path="/map-libre-map" element={<WrapMapLibre />} />
          <Route path="/simple-map" element={<WrapOc />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
