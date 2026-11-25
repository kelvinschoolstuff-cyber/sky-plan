import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Weather from "./pages/Weather";
import PlantingCalendar from "./pages/PlantingCalendar";
import Crops from "./pages/Crops";
import Farms from "./pages/Farms";
import PlantingPlans from "./pages/PlantingPlans";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="weather" element={<Weather />} />
        <Route path="planting-calendar" element={<PlantingCalendar />} />
        <Route path="crops" element={<Crops />} />
        <Route path="farms" element={<Farms />} />
        <Route path="planting-plans" element={<PlantingPlans />} />
      </Route>
    </Routes>
  );
}

export default App;
