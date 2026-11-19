"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "threadcraft_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          } catch {
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    } catch {
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
