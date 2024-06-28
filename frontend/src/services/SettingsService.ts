import { UserSettings, Theme, ThemeColors } from '../types';

const SETTINGS_KEY = 'userSettings';
const CURRENT_VERSION = 2;

const rgbToHex = (rgb: string): string => {
  const [r, g, b] = rgb.split(',').map(Number);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const defaultThemes: { [key: string]: Theme } = {
  light: {
    name: 'Light',
    colors: {
      background: { rgb: '255, 255, 255', hex: '#292929' },
      foreground: { rgb: '0, 0, 0', hex: '#000000' },
      card: { rgb: '255, 255, 255', hex: '#ffffff' },
      cardForeground: { rgb: '0, 0, 0', hex: '#000000' },
      detailedCardForeground: { rgb: '0, 0, 0', hex: '#000000' }, 
      primary: { rgb: '59, 130, 246', hex: '#3b82f6' },
      primaryForeground: { rgb: '255, 255, 255', hex: '#ffffff' },
      secondary: { rgb: '229, 231, 235', hex: '#e5e7eb' },
      secondaryForeground: { rgb: '0, 0, 0', hex: '#000000' },
      muted: { rgb: '229, 231, 235', hex: '#e5e7eb' },
      mutedForeground: { rgb: '107, 114, 128', hex: '#6b7280' },
      accent: { rgb: '243, 244, 246', hex: '#f3f4f6' },
      accentForeground: { rgb: '0, 0, 0', hex: '#000000' },
      border: { rgb: '229, 231, 235', hex: '#e5e7eb' },
      input: { rgb: '229, 231, 235', hex: '#e5e7eb' },
      ring: { rgb: '59, 130, 246', hex: '#3b82f6' },
      popover: { rgb: '255, 255, 255', hex: '#ffffff' },
      popoverForeground: { rgb: '0, 0, 0', hex: '#000000' }
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      background: { rgb: '41, 41, 41', hex: '#121212' },
      foreground: { rgb: '255, 255, 255', hex: '#ffffff' }, // Changed to white
      card: { rgb: '74, 74, 74', hex: '#4a4a4a' },
      cardForeground: { rgb: '229, 231, 235', hex: '#e5e7eb' },
      detailedCardForeground: { rgb: '255, 255, 255', hex: '#ffffff' }, // New color for DetailedView cards
      primary: { rgb: '56, 189, 248', hex: '#38bdf8' },
      primaryForeground: { rgb: '18, 18, 18', hex: '#121212' },
      secondary: { rgb: '71, 85, 105', hex: '#475569' },
      secondaryForeground: { rgb: '226, 232, 240', hex: '#e2e8f0' },
      muted: { rgb: '71, 85, 105', hex: '#475569' },
      mutedForeground: { rgb: '203, 213, 225', hex: '#cbd5e1' },
      accent: { rgb: '99, 102, 241', hex: '#6366f1' },
      accentForeground: { rgb: '226, 232, 240', hex: '#e2e8f0' },
      border: { rgb: '51, 65, 85', hex: '#334155' },
      input: { rgb: '51, 65, 85', hex: '#334155' },
      ring: { rgb: '56, 189, 248', hex: '#38bdf8' },
      popover: { rgb: '20, 20, 20', hex: '#141414' },
      popoverForeground: { rgb: '255, 255, 255', hex: '#ffffff' }
    },
  },
};


export const clearStorageForTesting = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SETTINGS_KEY);
    console.log('Cleared settings from localStorage');
  }
};

const defaultSettings: UserSettings = {
  version: CURRENT_VERSION,
  refreshInterval: 300000,
  fontSize: 16,
  stockSpacing: 'normal',
  selectedTheme: 'light',
  customThemes: defaultThemes,
};

export const saveSettings = (settings: UserSettings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

export const loadSettings = (): UserSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings);
    if (parsedSettings.version === CURRENT_VERSION) {
      return {
        ...parsedSettings,
        customThemes: {
          ...defaultThemes,
          ...parsedSettings.customThemes
        }
      };
    } else {
      console.log('Settings version mismatch. Resetting to defaults.');
      saveSettings(defaultSettings);
      return defaultSettings;
    }
  }
  return defaultSettings;
};

export const getThemeColors = (themeName: string, customThemes: UserSettings['customThemes']): ThemeColors => {
  return customThemes[themeName]?.colors || defaultThemes.light.colors;
};

export const createNewTheme = (name: string, baseTheme: string, customThemes: UserSettings['customThemes']): Theme => {
  const baseColors = getThemeColors(baseTheme, customThemes);
  return {
    name,
    colors: { ...baseColors }
  };
};

export const updateTheme = (name: string, colors: ThemeColors, customThemes: UserSettings['customThemes']): UserSettings['customThemes'] => {
  return {
    ...customThemes,
    [name]: {
      name,
      colors: { ...colors }
    }
  };
};


export const deleteTheme = (name: string, customThemes: UserSettings['customThemes']) => {
  const updatedThemes = { ...customThemes };
  delete updatedThemes[name];
  return updatedThemes;
};