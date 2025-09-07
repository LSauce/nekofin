import { AddServerForm } from '@/components/AddServerForm';
import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import PageScrollView from '@/components/PageScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Section } from '@/components/ui/Section';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { useSettingsColors } from '@/hooks/useSettingsColors';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { MediaServerInfo } from '@/services/media/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { MenuView } from '@react-native-menu/menu';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function MediaScreen() {
  const { servers, removeServer, setCurrentServer, currentServer } = useMediaServers();
  const { secondaryTextColor } = useSettingsColors();

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

  const handleRemoveServer = async (id: string) => {
    await removeServer(id);
  };

  const handleSetCurrentServer = (server: MediaServerInfo) => {
    setCurrentServer(server);
  };

  const renderServerItem = (server: MediaServerInfo) => {
    const isCurrentServer = currentServer?.id === server.id;

    return (
      <SettingsRow
        key={server.id}
        title={server.name}
        subtitle={`${server.address} • ${server.username}`}
        imageUri={server.userAvatar}
        icon={server.userAvatar ? undefined : 'dns'}
        showArrow={false}
        rightComponent={
          <MenuView
            isAnchoredToRight
            title="服务器操作"
            onPressAction={({ nativeEvent }) => {
              const action = nativeEvent.event;
              if (action === 'set-current') {
                handleSetCurrentServer(server);
              } else if (action === 'remove') {
                handleRemoveServer(server.id);
              }
            }}
            actions={[
              {
                id: 'set-current',
                title: isCurrentServer ? '当前服务器' : '设为当前服务器',
              },
              {
                id: 'remove',
                title: '删除服务器',
              },
            ]}
          >
            <MaterialIcons name="more-vert" size={24} color={secondaryTextColor} />
          </MenuView>
        }
      />
    );
  };

  return (
    <PageScrollView style={styles.container}>
      <Section title="服务器管理">
        <SettingsRow title="添加服务器" icon="add" onPress={handleAddServer} />
      </Section>

      {servers.length > 0 && (
        <Section title="服务器列表">{servers.map((server) => renderServerItem(server))}</Section>
      )}

      {servers.length === 0 && (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>暂无保存的服务器</ThemedText>
          <ThemedText style={styles.emptySubtext}>点击上方按钮添加你的第一个服务器</ThemedText>
        </View>
      )}

      <BottomSheetBackdropModal ref={bottomSheetRef} onDismiss={() => setIsAddServerVisible(false)}>
        {isAddServerVisible && <AddServerForm onClose={handleCloseAddServer} />}
      </BottomSheetBackdropModal>
    </PageScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
