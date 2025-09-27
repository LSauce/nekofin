import { useThemeColor } from '@/hooks/useThemeColor';
import {
  BottomSheetBackdrop,
  BottomSheetModalProps,
  BottomSheetModal as GorhomBottomSheetModal,
} from '@gorhom/bottom-sheet';

export const BottomSheetBackdropModal = ({
  children,
  ref,
  backgroundStyle,
  ...props
}: BottomSheetModalProps & { ref?: React.RefObject<GorhomBottomSheetModal | null> }) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const handleIndicatorColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <GorhomBottomSheetModal
      ref={ref}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          opacity={0.4}
          pressBehavior="close"
        />
      )}
      snapPoints={['100%']}
      enableDynamicSizing={true}
      backgroundStyle={[{ backgroundColor }, backgroundStyle]}
      handleIndicatorStyle={[{ backgroundColor: handleIndicatorColor }]}
      {...props}
    >
      {children}
    </GorhomBottomSheetModal>
  );
};
