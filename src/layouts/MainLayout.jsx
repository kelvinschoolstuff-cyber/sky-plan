import { Outlet, NavLink } from "react-router-dom";
import "../App.css";

function MainLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AgriCast</h1>
        <p>Agricultural Planning and Weather Advisory Platform</p>
        <span>Kenya</span>

        <nav>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/weather"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Weather
          </NavLink>
          <NavLink
            to="/crops"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Crops
          </NavLink>
          <NavLink
            to="/planting-calendar"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Planting Calendar
          </NavLink>
          <NavLink
            to="/farms"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            My Farms
          </NavLink>
          <NavLink
            to="/planting-plans"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Planting Plans
          </NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
