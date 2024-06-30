import { StockData } from './services/StockApiService';

export interface TabData {
  id: string;
  title: string;
  stocks: StockData[];
  viewType: 'compact' | 'detailed' | 'individual' | 'market';
  columns?: string[];
  isActive: boolean;
}

export interface UserLayout {
  tabs: TabData[];
  activeTabId: string;
}

export interface ColorValue {
  rgb: string;
  hex: string;
}

export interface ThemeColors {
  background: ColorValue;
  foreground: ColorValue;
  card: ColorValue;
  cardForeground: ColorValue;
  detailedCardForeground: ColorValue; // Add this line
  primary: ColorValue;
  primaryForeground: ColorValue;
  secondary: ColorValue;
  secondaryForeground: ColorValue;
  muted: ColorValue;
  mutedForeground: ColorValue;
  accent: ColorValue;
  accentForeground: ColorValue;
  border: ColorValue;
  input: ColorValue;
  ring: ColorValue;
  popover: ColorValue;
  popoverForeground: ColorValue;
  chartLine: ColorValue;
  chartText: ColorValue;
  chartTimeSelector: ColorValue; 
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export interface UserSettings {
  version: number;
  refreshInterval: number;
  fontSize: number;
  stockSpacing: 'compact' | 'normal' | 'relaxed';
  selectedTheme: string;
  customThemes: {
    [key: string]: Theme;
  };
}