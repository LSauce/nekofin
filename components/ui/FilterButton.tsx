import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '../ThemedText';
import { FilterSheet } from './FilterSheet';

export const FilterButton = ({
  label,
  title,
  options,
  onSelect,
}: {
  label: string;
  title?: string;
  options: { label: string; value?: string; active?: boolean }[];
  onSelect: (value?: string) => void;
}) => {
  const sheetRef = useRef<GorhomBottomSheetModal | null>(null);
  return (
    <GlassView
      style={[
        styles.chip,
        !isLiquidGlassAvailable() && {
          backgroundColor: 'rgba(127,127,127,0.15)',
        },
      ]}
      isInteractive
    >
      <TouchableOpacity onPress={() => sheetRef.current?.present()}>
        <ThemedText style={styles.chipText} type="subtitle">
          {label}
        </ThemedText>
      </TouchableOpacity>
      <FilterSheet
        ref={sheetRef}
        title={title}
        options={options}
        onSelect={(v) => {
          onSelect(v);
          sheetRef.current?.dismiss();
        }}
      />
    </GlassView>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
  },
});
