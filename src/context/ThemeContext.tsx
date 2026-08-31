import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Plain localStorage-backed light/dark preference shared by the public site
// and the /os dashboard. Deliberately has no dependency on Firestore/auth —
// both surfaces just read/write the same "nok-os-theme" key independently.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nok-os-theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("nok-os-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
