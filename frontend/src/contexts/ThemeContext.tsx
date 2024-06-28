import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings, ThemeColors } from '../types';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  customThemes: UserSettings['customThemes'];
  setCustomThemes: (themes: UserSettings['customThemes']) => void;
  applyTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode, initialSettings: UserSettings }> = ({ children, initialSettings }) => {
  const [theme, setTheme] = useState<string>(initialSettings.selectedTheme);
  const [customThemes, setCustomThemes] = useState<UserSettings['customThemes']>(initialSettings.customThemes);

const applyTheme = (themeName: string) => {
  const selectedTheme = customThemes[themeName];
  if (selectedTheme) {
    const root = window.document.documentElement;
    Object.entries(selectedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value.rgb);
      root.style.setProperty(`--${key}-hex`, value.hex);
    });
    setTheme(themeName);
  }
};

  useEffect(() => {
    applyTheme(theme);
  }, [theme, customThemes]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customThemes, setCustomThemes, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};