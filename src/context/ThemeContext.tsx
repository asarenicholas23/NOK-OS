import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface ThemeContextType {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  setPathname: (pathname: string) => void;
}

const THEMED_ROUTES = /^\/(os|review|approve|proposal)(\/|$)/;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Plain localStorage-backed light/dark preference for the /os workspace
// (and the client review/proposal pages). No dependency on Firestore/auth.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nok-os-theme") as "dark" | "light") || "dark";
  });

  // Day Mode only applies to the /os workspace and the client review/proposal
  // pages. The public site has no toggle: it uses fixed paper/ink sections.
  // ThemeProvider sits outside the router, so ThemeClassSync (rendered inside
  // it) re-applies the class whenever the route changes.
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const light = theme === "light" && THEMED_ROUTES.test(pathname);
    document.documentElement.classList.toggle("light", light);
  }, [theme, pathname]);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("nok-os-theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setPathname }}>
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

/** Render inside <BrowserRouter> so the theme class follows route changes. */
export const ThemeClassSync: React.FC = () => {
  const { pathname } = useLocation();
  const { setPathname } = useTheme();
  useEffect(() => setPathname(pathname), [pathname, setPathname]);
  return null;
};
