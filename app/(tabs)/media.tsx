import { AddServerForm } from '@/components/AddServerForm';
import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { ServerList } from '@/components/ServerList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function MediaScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [isAddServerVisible, setIsAddServerVisible] = useState(false);

  const handleAddServer = () => {
    setIsAddServerVisible(true);
    bottomSheetRef.current?.present();
  };

  const handleCloseAddServer = () => {
    setIsAddServerVisible(false);
    bottomSheetRef.current?.dismiss();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          媒体服务器
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          管理你的 Jellyfin 服务器连接
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ServerList onAddServer={handleAddServer} />
      </View>

      <BottomSheetBackdropModal ref={bottomSheetRef} onDismiss={() => setIsAddServerVisible(false)}>
        {isAddServerVisible && <AddServerForm onClose={handleCloseAddServer} />}
      </BottomSheetBackdropModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 16,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
