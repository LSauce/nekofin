import { getSystemColor } from '@/constants/SystemColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';

import { useColorScheme } from './useColorScheme';

export function useSettingsColors() {
  const { accentColor } = useAccentColor();
  const theme = useColorScheme() ?? 'light';

  const textColor = getSystemColor('label', theme);
  const secondaryTextColor = getSystemColor('secondaryLabel', theme);
  const backgroundColor = getSystemColor('systemBackground', theme);
  const separatorColor = getSystemColor('systemGray4', theme);
  const secondarySystemGroupedBackground = getSystemColor(
    'secondarySystemGroupedBackground',
    theme,
  );

  return {
    textColor,
    secondaryTextColor,
    backgroundColor,
    accentColor,
    separatorColor,
    secondarySystemGroupedBackground,
  };
}
