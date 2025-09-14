import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaItem } from '@/services/media/types';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { SkeletonUserViewCard } from '../ui/Skeleton';
import { UserViewCard } from './UserViewCard';

export const UserViewSection = ({
  userView,
  isLoading,
}: {
  userView: MediaItem[];
  isLoading?: boolean;
}) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const userViewItems = userView || [];

  if (isLoading) {
    return (
      <View style={[styles.userViewSection, { backgroundColor }]}>
        <FlatList
          data={Array.from({ length: 3 })}
          horizontal
          keyExtractor={(_, index) => `skeleton-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userViewContainer}
          renderItem={() => <SkeletonUserViewCard />}
        />
      </View>
    );
  }

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
        keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.userViewContainer}
        renderItem={({ item, index }) => (
          <UserViewCard item={item} key={item.id || index} title={item.name || '未知标题'} />
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
