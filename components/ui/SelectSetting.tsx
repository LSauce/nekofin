import { useSettingsColors } from '@/hooks/useSettingsColors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import React, { ReactNode, useCallback } from 'react';
import { View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { SettingsRow } from './SettingsRow';

export type SelectOption = {
  title: string;
  value: string;
  subtitle?: string;
};

export type CustomAction = {
  id: string;
  title: string;
  onPress: () => void;
};

export type SelectSettingProps = {
  title: string;
  subtitle?: string;
  value: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  placeholder?: string;
  menuTitle?: string;
  leftComponent?: ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  customActions?: CustomAction[];
  showSelectionMenu?: boolean;
};

export const SelectSetting: React.FC<SelectSettingProps> = ({
  title,
  subtitle,
  value,
  options,
  onValueChange,
  placeholder = '请选择',
  menuTitle = '选择选项',
  leftComponent,
  icon,
  customActions = [],
  showSelectionMenu = true,
}) => {
  const { secondaryTextColor } = useSettingsColors();

  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption?.title || placeholder;

  const menuActions: MenuAction[] = options.map((option) => ({
    id: option.value,
    title: option.title,
    subtitle: option.subtitle,
    state: option.value === value ? 'on' : 'off',
  }));

  const handleMenuAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      const selectedId = nativeEvent.event;
      if (selectedId !== value && onValueChange) {
        onValueChange(selectedId);
      }
    },
    [value, onValueChange],
  );

  const handleCustomAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      const actionId = nativeEvent.event;
      const action = customActions.find((a) => a.id === actionId);
      if (action) {
        action.onPress();
      }
    },
    [customActions],
  );

  const customMenuActions: MenuAction[] = customActions.map((action) => ({
    id: action.id,
    title: action.title,
  }));

  const renderRightComponent = useCallback(() => {
    const components = [];

    if (showSelectionMenu && options.length > 0) {
      components.push(
        <MenuView
          key="selection"
          isAnchoredToRight
          title={menuTitle}
          onPressAction={handleMenuAction}
          actions={menuActions}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
              gap: 4,
            }}
          >
            <ThemedText>{displayText}</ThemedText>
            <Ionicons name="chevron-expand" size={16} color={secondaryTextColor} />
          </View>
        </MenuView>,
      );
    }

    if (customActions.length > 0) {
      components.push(
        <MenuView
          key="custom"
          isAnchoredToRight
          title="操作"
          onPressAction={handleCustomAction}
          actions={customMenuActions}
        >
          <Ionicons name="chevron-expand" size={20} color={secondaryTextColor} />
        </MenuView>,
      );
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 24,
        }}
      >
        {components}
      </View>
    );
  }, [
    showSelectionMenu,
    options.length,
    customActions.length,
    menuTitle,
    handleMenuAction,
    menuActions,
    displayText,
    secondaryTextColor,
    handleCustomAction,
    customMenuActions,
  ]);

  return (
    <SettingsRow
      title={title}
      subtitle={subtitle}
      icon={icon}
      showArrow={false}
      leftComponent={leftComponent}
      rightComponent={renderRightComponent()}
    />
  );
};

export default SelectSetting;
