import { storage } from '@/lib/storage';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ThemeColorContextValue = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const DEFAULT_ACCENT_COLOR = '#9C4DFF';
const STORAGE_KEY = 'theme.accentColor';

const ThemeColorContext = createContext<ThemeColorContextValue | undefined>(undefined);

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const initialAccentColor = storage.getString(STORAGE_KEY) || DEFAULT_ACCENT_COLOR;
  const [accentColorState, setAccentColorState] = useState<string>(initialAccentColor);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    storage.set(STORAGE_KEY, color);
  }, []);

  const contextValue = useMemo<ThemeColorContextValue>(
    () => ({
      accentColor: accentColorState,
      setAccentColor,
    }),
    [accentColorState, setAccentColor],
  );

  return <ThemeColorContext.Provider value={contextValue}>{children}</ThemeColorContext.Provider>;
}

export function useAccentColor() {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) {
    throw new Error('useAccentColor must be used within a ThemeColorProvider');
  }
  return ctx;
}
