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
}: BottomSheetModalProps & { ref: React.RefObject<GorhomBottomSheetModal | null> }) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');

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
      enableDynamicSizing={true}
      backgroundStyle={[{ backgroundColor }, backgroundStyle]}
      {...props}
    >
      {children}
    </GorhomBottomSheetModal>
  );
};
