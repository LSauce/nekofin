import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { servers } = useMediaServers();
  const router = useRouter();

  if (servers.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}
      >
        <Text>No servers found</Text>
        <TouchableOpacity onPress={() => router.push('/media')}>
          <Text>Add server</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View
        style={{
          height: 60,
          justifyContent: 'flex-end',
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 36, fontWeight: 'bold', flex: 1 }}>首页</Text>
        <TouchableOpacity
          onPress={() => BottomSheetModalRef.current?.present()}
          style={{ padding: 6, borderRadius: 16, backgroundColor: '#f2f2f2' }}
        >
          <Text style={{ fontSize: 15 }}>jellyfin</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          marginTop: 10,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>最近新增</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={{ color: '#9C4DFF', fontSize: 16 }}>查看所有 {'>'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={[]}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12, marginLeft: 20 }}
        contentContainerStyle={{ paddingRight: 20 }}
        renderItem={({ item }) => <MediaCard item={item} onPress={() => {}} />}
      />
      <BottomSheetBackdropModal ref={BottomSheetModalRef}>
        <BottomSheetView
          style={{
            flex: 1,
            padding: 36,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Awesome 🎉</Text>
          </View>
        </BottomSheetView>
      </BottomSheetBackdropModal>
    </SafeAreaView>
  );
}

function MediaCard({ item, onPress }: { item: any; onPress?: () => void }) {
  const width = Dimensions.get('window').width * 0.36;
  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress}>
      <Image
        source={
          item.ImageTags && item.ImageTags.Primary
            ? `https://demo.jellyfin.org/stable/Items/${item.Id}/Images/Primary?maxWidth=300`
            : require('@/assets/images/partial-react-logo.png')
        }
        style={styles.cover}
        contentFit="cover"
      />
      <Text style={styles.title} numberOfLines={1}>
        {item.Name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.CollectionType || ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    paddingBottom: 8,
  },
  cover: {
    width: '100%',
    height: 140,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginHorizontal: 8,
    marginTop: 2,
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
