//src/context/UseContext.jsx

import { createContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

// Keep the context and provider together as in the starter structure.
// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(null);

async function authRequest(path, options = {}) {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Authentication failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Restore the browser's existing session when the app starts.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function restoreSession() {
      try {
        const data = await authRequest("/api/auth/me", {
          signal: controller.signal,
        });

        if (active) {
          setUser(data.user);
        }
      } catch (err) {
        if (!active || err.name === "AbortError") {
          return;
        }

        setUser(null);

        // Being logged out is an expected state.
        if (err.status !== 401) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  async function login(email, password) {
    setError("");

    try {
      const data = await authRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logout() {
    setError("");

    try {
      await authRequest("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  return (
    <UserContext.Provider
      value={{ user, loading, error, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}