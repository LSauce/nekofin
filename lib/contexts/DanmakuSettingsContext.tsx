import React, { createContext, useContext, useMemo, useState } from 'react';

export type DanmakuSettingsType = {
  opacity: number;
  speed: number;
  fontSize: number;
  heightRatio: number;
  danmakuFilter: number;
  danmakuModeFilter: number;
  danmakuDensityLimit: number;
  curEpOffset: number;
  fontFamily: string;
  fontOptions: string;
};

type DanmakuSettingsContextValue = {
  settings: DanmakuSettingsType;
  setSettings: (next: DanmakuSettingsType) => void;
};

const defaultSettings: DanmakuSettingsType = {
  opacity: 0.7,
  speed: 200,
  fontSize: 18,
  heightRatio: 0.9,
  danmakuFilter: 0,
  danmakuModeFilter: 0,
  danmakuDensityLimit: 0,
  curEpOffset: 0,
  fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
  fontOptions: '',
};

const DanmakuSettingsContext = createContext<DanmakuSettingsContextValue | null>(null);

export function DanmakuSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DanmakuSettingsType>(defaultSettings);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <DanmakuSettingsContext.Provider value={value}>{children}</DanmakuSettingsContext.Provider>
  );
}

export function useDanmakuSettings() {
  const ctx = useContext(DanmakuSettingsContext);
  if (!ctx) {
    throw new Error('useDanmakuSettings must be used within DanmakuSettingsProvider');
  }
  return ctx;
}
