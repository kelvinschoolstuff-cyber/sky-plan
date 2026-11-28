import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Weather from "./pages/Weather";
import PlantingCalendar from "./pages/PlantingCalendar";
import Crops from "./pages/Crops";

command to add these
import Farms from "./pages/Farms";
import PlantingPlans from "./pages/PlantingPlans";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <Routes>
      {/* Public pages without the application navigation */}
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />

      <Route element={<MainLayout />}>
        {/* Weather stays public */}
        <Route path="weather" element={<Weather />} />

        {/* Everything below requires a signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="planting-calendar" element={<PlantingCalendar />} />
          <Route path="crops" element={<Crops />} />
          <Route path="farms" element={<Farms />} />
          <Route path="planting-plans" element={<PlantingPlans />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
