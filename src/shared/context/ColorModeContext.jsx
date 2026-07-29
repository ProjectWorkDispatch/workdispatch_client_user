import { useState, useEffect } from "react";
import { ColorModeContext } from "./color-mode-context.js";

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("workdispatch-color-mode");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem("workdispatch-color-mode", mode);
  }, [mode]);

  const toggleColorMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}
