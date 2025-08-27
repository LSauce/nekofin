import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function HeaderLeftComponent({ canGoBack = true }: { canGoBack?: boolean }) {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const router = useRouter();

  if (!canGoBack) {
    return null;
  }

  return (
    <TouchableOpacity onPress={() => router.back()}>
      <MaterialIcons name="arrow-back-ios" size={20} color={textColor} />
    </TouchableOpacity>
  );
}
