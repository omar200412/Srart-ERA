"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeAuthContextType {
  user: string | null;
  darkMode: boolean;
  toggleTheme: () => void;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const ThemeAuthContext = createContext<ThemeAuthContextType | undefined>(undefined);

export function ThemeAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false); // 👈 KRİTİK: Hydration hatasını önler

  useEffect(() => {
    // Tarayıcı tamamen yüklendiğinde çalışır
    setMounted(true);
    
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("userEmail");
    if (token && savedUser) setUser(savedUser);

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      if (newMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return newMode;
    });
  };

  const login = (token: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUser(null);
    window.location.href = "/";
  };

  // ⚠️ SUNUCU HATASINI ENGELLEMEK İÇİN: 
  // Sayfa tarayıcıda tamamen yüklenene kadar (mounted) veriye erişimi beklet
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeAuthContext.Provider value={{ user, darkMode, toggleTheme, login, logout }}>
      {children}
    </ThemeAuthContext.Provider>
  );
}

// Güvenli kanca
// ... (üst kısımlar aynı)

export const useThemeAuth = () => {
  const context = useContext(ThemeAuthContext);
  // Eğer LandingPage bir Provider bulamazsa bu hatayı verir
  if (!context) {
    return {
      user: null,
      darkMode: false,
      toggleTheme: () => {},
      login: () => {},
      logout: () => {}
    };
  }
  return context;
};