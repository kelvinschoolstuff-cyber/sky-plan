import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Login() {
  const { isAuthenticated, loading, sessionExpired, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Where the user was heading before being sent here (default: Dashboard).
  const from = location.state?.from;
  const destination = from ? `${from.pathname}${from.search || ""}` : "/";
  const notice =
    location.state?.message ||
    (sessionExpired ? "Your session has expired. Please log in again." : "");

  if (!loading && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ email: email.trim(), password });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1>AgriCast</h1>
        <h2 id="login-title">Log in</h2>

        {notice && <p className="auth-notice">{notice}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New to AgriCast? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
