import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HeaderButton } from '@react-navigation/elements';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';

export default function HeaderBackButton({ canGoBack = true }: { canGoBack?: boolean }) {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const router = useRouter();
  const pathname = usePathname();
  const { servers, currentServer } = useMediaServers();

  if (servers && servers.length > 0 && pathname === '/') {
    return (
      <HeaderButton onPress={() => router.push('/media')} style={{ paddingHorizontal: 6 }}>
        {currentServer?.type === 'emby' ? (
          <MaterialCommunityIcons name="emby" size={24} color="#4caf50" />
        ) : (
          <Image
            source={require('@/assets/icons/jellyfin.svg')}
            style={{ width: 24, height: 24 }}
          />
        )}
      </HeaderButton>
    );
  }

  if (!canGoBack) {
    return null;
  }

  return (
    <HeaderButton
      onPress={() => router.back()}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
      }}
    >
      <Ionicons name="chevron-back" size={24} color={textColor} />
    </HeaderButton>
  );
}
