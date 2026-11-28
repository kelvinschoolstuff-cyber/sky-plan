import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../App.css";
import "../pages/Auth.css";

function MainLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      // The server session may still be active, so stay signed in.
      setLogoutError(err.message || "Could not log out. Please try again.");
      setLoggingOut(false);
    }
  }

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

        {!loading && (
          <div className="nav-account">
            {isAuthenticated ? (
              <>
                <p>Signed in as {user.username}</p>
                <button
                  type="button"
                  className="nav-logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/signup">Sign up</NavLink>
              </>
            )}
            {logoutError && (
              <p className="nav-error" role="alert">
                {logoutError}
              </p>
            )}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
