import { useThemeColor } from '@/hooks/useThemeColor';
import {
  BottomSheetBackdrop,
  BottomSheetModalProps,
  BottomSheetModal as GorhomBottomSheetModal,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';

const BottomSheetModalHandle = () => {
  const { dismiss } = useBottomSheetModal();
  const backgroundColor = useThemeColor({ light: '#f2f2f2', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
      <TouchableOpacity
        onPress={() => dismiss()}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BottomSheetBackdropModal = ({
  children,
  ref,
  backgroundStyle,
  ...props
}: BottomSheetModalProps & { ref: React.RefObject<GorhomBottomSheetModal | null> }) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');

  return (
    <GorhomBottomSheetModal
      ref={ref}
      snapPoints={['90%']}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          opacity={0.4}
          pressBehavior="close"
        />
      )}
      enableDynamicSizing={false}
      handleComponent={BottomSheetModalHandle}
      backgroundStyle={[{ backgroundColor }, backgroundStyle]}
      {...props}
    >
      {children}
    </GorhomBottomSheetModal>
  );
};
