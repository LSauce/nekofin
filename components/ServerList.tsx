import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { createApiFromServerInfo } from '@/services/jellyfin';
import { MediaServerInfo } from '@/services/media/types';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ServerListProps {
  onAddServer?: () => void;
}

export function ServerList({ onAddServer }: ServerListProps) {
  const { servers, removeServer } = useMediaServers();

  const handleServerPress = (server: MediaServerInfo) => {
    try {
      const api = createApiFromServerInfo(server);
      console.log('Connected to server:', server.name, api);
    } catch (error) {
      console.error('Failed to connect to server:', error);
    }
  };

  const handleRemoveServer = async (id: string) => {
    await removeServer(id);
  };

  const renderServer = ({ item }: { item: MediaServerInfo }) => (
    <TouchableOpacity style={styles.serverItem} onPress={() => handleServerPress(item)}>
      <View style={styles.serverInfo}>
        <ThemedText style={styles.serverName}>{item.name}</ThemedText>
        <ThemedText style={styles.serverAddress}>{item.address}</ThemedText>
        <ThemedText style={styles.serverUser}>用户: {item.username}</ThemedText>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveServer(item.id)}>
        <ThemedText style={styles.removeButtonText}>删除</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!onAddServer) return null;

    return (
      <TouchableOpacity style={styles.addButton} onPress={onAddServer}>
        <ThemedText style={styles.addButtonText}>+ 添加服务器</ThemedText>
      </TouchableOpacity>
    );
  };

  if (servers.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>暂无保存的服务器</ThemedText>
        <ThemedText style={styles.emptySubtext}>点击下方按钮添加你的第一个服务器</ThemedText>
        {onAddServer && (
          <TouchableOpacity style={styles.addButton} onPress={onAddServer}>
            <ThemedText style={styles.addButtonText}>+ 添加服务器</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={servers}
      renderItem={renderServer}
      keyExtractor={(item) => item.id}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  serverItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serverAddress: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  serverUser: {
    fontSize: 12,
    opacity: 0.5,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
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
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
