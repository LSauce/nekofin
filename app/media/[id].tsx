import { createApi, discoverServers, findBestServer, login } from '@/services/jellyfin';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JELLYFIN_HOST = 'demo.jellyfin.org/stable';
const JELLYFIN_USER = 'demo';
const JELLYFIN_PASS = '';

export default function MediaDetail() {
  const { id } = useLocalSearchParams();
  const [api, setApi] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const servers = await discoverServers(JELLYFIN_HOST);
      const best = findBestServer(servers);
      if (!best) return;
      const apiInstance = createApi(best.address);
      await login(apiInstance, JELLYFIN_USER, JELLYFIN_PASS);
      setApi(apiInstance);
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['mediaDetail', id, api],
    queryFn: async () => {
      if (!api || !id) return null;
      const res = await api.getItemApi().getItem(id as string);
      return res.data;
    },
    enabled: !!api && !!id,
  });

  if (isLoading || !data)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>加载中...</Text>
      </View>
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Image
        source={
          data.ImageTags && data.ImageTags.Primary
            ? `https://demo.jellyfin.org/stable/Items/${data.Id}/Images/Primary?maxWidth=600`
            : require('@/assets/images/partial-react-logo.png')
        }
        style={styles.cover}
        contentFit="cover"
      />
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>{data.Name}</Text>
        <Text style={styles.subtitle}>{data.Overview || '暂无简介'}</Text>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            const mediaSourceId = data?.MediaSources?.[0]?.Id;
            const accessToken = api?.accessToken;
            if (mediaSourceId && accessToken) {
              router.push({
                pathname: '/media/player',
                params: {
                  itemId: data.Id,
                  mediaSourceId,
                  accessToken,
                },
              });
            }
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>播放</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 260,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  playBtn: {
    backgroundColor: '#9C4DFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
