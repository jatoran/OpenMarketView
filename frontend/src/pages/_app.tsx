import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from '../contexts/ThemeContext';
import { loadSettings } from '../services/SettingsService';
import { GlobalStateProvider } from '../contexts/GlobalStateContext';

export default function App({ Component, pageProps }: AppProps) {
  const initialSettings = loadSettings();
  
  return (
    <ThemeProvider initialSettings={initialSettings}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}