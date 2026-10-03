import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentTheme = 'gemini' | 'sapphire' | 'amethyst' | 'titanium';
export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentTheme;
  toggleMode: () => void;
  setAccent: (accent: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_CONFIGS: Record<AccentTheme, { name: string; hex: string; description: string }> = {
  gemini: {
    name: 'Gemini Rainbow',
    hex: '#4285F4',
    description: 'Signature Google multi-color gradient'
  },
  sapphire: {
    name: 'Google Blue',
    hex: '#1a73e8',
    description: 'Crisp academic cobalt'
  },
  amethyst: {
    name: 'Lavender Purple',
    hex: '#9b72cb',
    description: 'Deep royal amethyst'
  },
  titanium: {
    name: 'Obsidian Slate',
    hex: '#5f6368',
    description: 'Monochrome minimalist'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode: ThemeMode = 'dark';
  const [accent, setAccentState] = useState<AccentTheme>('gemini');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    localStorage.setItem('litbuddy_theme_mode', 'dark');
  }, []);

  const toggleMode = () => {
    // Locked to dark mode
  };

  const setAccent = (newAccent: AccentTheme) => {
    setAccentState(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ mode: 'dark', accent, toggleMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
