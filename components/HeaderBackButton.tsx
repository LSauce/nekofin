import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export default function HeaderBackButton({ canGoBack = true }: { canGoBack?: boolean }) {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const router = useRouter();
  const pathname = usePathname();
  const { servers, currentServer } = useMediaServers();

  if (servers && servers.length > 0 && pathname === '/') {
    return (
      <TouchableOpacity onPress={() => router.push('/media')}>
        {currentServer?.type === 'emby' ? (
          <MaterialCommunityIcons name="emby" size={34} color="#4caf50" />
        ) : (
          <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={require('@/assets/icons/jellyfin.svg')}
              style={{ width: 28, height: 28 }}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (!canGoBack) {
    return null;
  }

  return (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 12 }}>
      <MaterialIcons name="arrow-back-ios" size={20} color={textColor} />
    </TouchableOpacity>
  );
}
