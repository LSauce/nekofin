import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

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
    <>
      <TouchableOpacity style={styles.chip} onPress={() => sheetRef.current?.present()}>
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
    </>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  chipActive: {
    backgroundColor: 'rgba(127,127,255,0.35)',
  },
  chipText: {
    fontSize: 12,
  },
});
