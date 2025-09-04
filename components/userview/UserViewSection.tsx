import { useThemeColor } from '@/hooks/useThemeColor';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { UserViewCard } from './UserViewCard';

export const UserViewSection = ({ userView }: { userView: BaseItemDto[] }) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const userViewItems = userView || [];

  if (userViewItems.length === 0) {
    return (
      <View style={styles.userViewSection}>
        <Text style={styles.userViewTitle}>暂无内容</Text>
      </View>
    );
  }

  return (
    <View style={[styles.userViewSection, { backgroundColor }]}>
      <FlatList
        data={userViewItems}
        horizontal
        keyExtractor={(item, index) => (item.Id ? String(item.Id) : String(index))}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.userViewContainer}
        renderItem={({ item, index }) => (
          <UserViewCard item={item} key={item.Id || index} title={item.Name || '未知标题'} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  userViewSection: {
    marginTop: 10,
  },
  userViewContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  userViewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
});
