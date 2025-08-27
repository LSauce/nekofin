import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function HeaderLeftComponent({ canGoBack = true }: { canGoBack?: boolean }) {
  const router = useRouter();

  if (!canGoBack) {
    return null;
  }

  return (
    <TouchableOpacity onPress={() => router.back()}>
      <MaterialIcons name="arrow-back-ios" size={20} color="black" />
    </TouchableOpacity>
  );
}
