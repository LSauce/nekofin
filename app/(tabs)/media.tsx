import { AddServerForm } from '@/components/AddServerForm';
import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { ServerList } from '@/components/ServerList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRef, useState } from 'react';
import { Platform, PlatformColor, StyleSheet, View, type ColorValue } from 'react-native';

export default function MediaScreen() {
  const headerHeight = useHeaderHeight();

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [isAddServerVisible, setIsAddServerVisible] = useState(false);
  const backgroundColorDefault = useThemeColor({ light: '#fff', dark: '#000' }, 'background');

  const backgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('systemGroupedBackground') : backgroundColorDefault;
  const cardBackgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondarySystemGroupedBackground') : backgroundColor;

  const handleAddServer = () => {
    setIsAddServerVisible(true);
    bottomSheetRef.current?.present();
  };

  const handleCloseAddServer = () => {
    setIsAddServerVisible(false);
    bottomSheetRef.current?.dismiss();
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: headerHeight }]}>
      <View style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            媒体服务器
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            管理你的 Jellyfin 服务器连接
          </ThemedText>
        </View>

        <View style={[styles.groupContainer, { backgroundColor: cardBackgroundColor }]}>
          <SettingsRow title="添加服务器" icon="add" onPress={handleAddServer} disableBorder />
        </View>

        <View style={styles.content}>
          <ServerList />
        </View>
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
  scrollView: {
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
  groupContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
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
