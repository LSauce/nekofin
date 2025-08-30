import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';

export function useSettingsColors() {
  const { accentColor } = useAccentColor();

  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#151718' }, 'background');
  const separatorColor = useThemeColor({ light: '#C6C6C8', dark: '#38383A' }, 'background');

  return {
    textColor,
    secondaryTextColor,
    backgroundColor,
    accentColor,
    separatorColor,
  };
}
