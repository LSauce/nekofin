import React from 'react';
import { Switch, SwitchProps, View } from 'react-native';

import { SettingsRow } from './SettingsRow';

export type SwitchSettingProps = {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  subtitle?: string;
} & SwitchProps;

export const SwitchSetting: React.FC<SwitchSettingProps> = ({
  title,
  value,
  onValueChange,
  subtitle,
  ...switchProps
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
          }}
        >
          <Switch value={value} onValueChange={onValueChange} {...switchProps} />
        </View>
      }
    />
  );
};

export default SwitchSetting;
