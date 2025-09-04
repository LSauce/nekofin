import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  BottomSheetScrollView,
  BottomSheetModal as GorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../ThemedText';

type FilterOption = { label: string; value?: string; active?: boolean };
type FilterSheetProps = {
  title?: string;
  options: FilterOption[];
  onSelect: (value?: string) => void;
  ref?: React.RefObject<GorhomBottomSheetModal | null>;
};

export const FilterSheet = ({ title, options, onSelect, ref }: FilterSheetProps) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <BottomSheetBackdropModal ref={ref} snapPoints={['50%', '90%']}>
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {title ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{title}</Text>
          </View>
        ) : null}
        <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
          {options.map((opt) => (
            <SheetOption
              key={`${opt.label}-${opt.value ?? 'all'}`}
              label={opt.label}
              active={!!opt.active}
              onPress={() => onSelect(opt.value)}
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheetBackdropModal>
  );
};

function SheetOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: active ? 'rgba(127,127,255,0.25)' : 'transparent',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <ThemedText style={{ fontSize: 16 }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}
