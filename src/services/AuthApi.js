import { apiRequest } from "./Api";

// Authentication calls for the Flask session backend.
// Cookies are handled by the browser (apiRequest sends credentials: "include").

export function signup(userData) {
  return apiRequest("/api/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function login(credentials) {
  return apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function logout() {
  return apiRequest("/api/logout", {
    method: "POST",
  });
}

export function checkSession() {
  return apiRequest("/api/check_session");
}

