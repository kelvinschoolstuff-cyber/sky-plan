import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { setUnauthorizedHandler } from "../services/Api";
import * as authApi from "../services/AuthApi";

const AuthContext = createContext(null);

// Share one in-flight session check. React StrictMode runs effects twice in
// development, which would otherwise send two identical requests.
let pendingSessionCheck = null;
function checkSessionOnce() {
  if (!pendingSessionCheck) {
    pendingSessionCheck = authApi.checkSession().finally(() => {
      pendingSessionCheck = null;
    });
  }
  return pendingSessionCheck;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // If the backend rejects a request with 401 while the user is signed in, the
  // session has ended: sign out locally so ProtectedRoute sends them to Login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) {
        setSessionExpired(true);
        setUser(null);
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Ask the backend once, when the app first loads, whether a session exists.
  // Navigating between pages does not remount this provider, so it is not
  // repeated.
  useEffect(() => {
    let active = true;

    checkSessionOnce()
      .then((result) => {
        if (active) setUser(result.authenticated ? result.data : null);
      })
      .catch(() => {
        // Backend unreachable or errored: treat as signed out, do not crash.
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    if (!result?.user) {
      throw new Error("Unexpected response from the server.");
    }
    setUser(result.user);
    setSessionExpired(false);
    return result.user;
  }, []);

  const signup = useCallback(
    async (userData) => {
      await authApi.signup(userData);

      // Signup does not start a session, so sign in with the same credentials.
      try {
        return await login({
          email: userData.email,
          password: userData.password,
        });
      } catch {
        const error = new Error(
          "Your account was created, but signing in automatically failed. Please log in.",
        );
        error.accountCreated = true;
        throw error;
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // 401 means the session had already ended, so the user is signed out
      // either way. Any other failure (network, server error) means the
      // session may still be active: keep the user signed in and report it.
      if (error.status !== 401) throw error;
    }
    setUser(null);
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      sessionExpired,
      login,
      signup,
      logout,
    }),
    [user, loading, sessionExpired, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
