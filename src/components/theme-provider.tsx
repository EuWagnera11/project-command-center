import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark";
interface Ctx { theme: Theme }

const ThemeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "instabot-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(STORAGE_KEY, "dark");
  }, []);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
