import { isGreaterThanOrEqual26 } from '@/lib/utils';
import React from 'react';
import { Switch, View } from 'react-native';

import { SettingsRow } from './SettingsRow';

export interface SwitchSettingProps {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  subtitle?: string;
}

export const SwitchSetting: React.FC<SwitchSettingProps> = ({
  title,
  value,
  onValueChange,
  subtitle,
}) => {
  return (
    <SettingsRow
      title={title}
      subtitle={subtitle}
      showArrow={false}
      rightComponent={
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: 24,
            paddingRight: isGreaterThanOrEqual26 ? 12 : 0,
          }}
        >
          <Switch value={value} onValueChange={onValueChange} />
        </View>
      }
    />
  );
};

export default SwitchSetting;
