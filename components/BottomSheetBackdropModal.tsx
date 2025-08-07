import {
  BottomSheetBackdrop,
  BottomSheetModalProps,
  BottomSheetModal as GorhomBottomSheetModal,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';

const BottomSheetModalHandle = () => {
  const { dismiss } = useBottomSheetModal();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
      <TouchableOpacity
        onPress={() => dismiss()}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#f2f2f2',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

export const BottomSheetBackdropModal = ({
  children,
  ref,
  ...props
}: BottomSheetModalProps & { ref: React.RefObject<GorhomBottomSheetModal | null> }) => {
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
      {...props}
    >
      {children}
    </GorhomBottomSheetModal>
  );
};
