import { sleep } from '@/lib/utils';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function HiddenScreen() {
  const { itemId } = useLocalSearchParams<{
    itemId: string;
  }>();

  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      navigation.setOptions({
        orientation: 'landscape',
      });
      await sleep(375);
      router.replace({
        pathname: '/player/content',
        params: {
          itemId,
        },
      });
    })();
  }, [router, itemId, navigation]);

  return <View style={{ flex: 1, backgroundColor: 'black' }} />;
}
