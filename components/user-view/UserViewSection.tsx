import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaItem } from '@/services/media/types';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { SkeletonUserViewCard } from '../ui/Skeleton';
import { UserViewCard } from './UserViewCard';

export const UserViewSection = ({
  userView,
  isLoading,
  title,
}: {
  userView: MediaItem[];
  isLoading?: boolean;
  title?: string;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const userViewItems = userView || [];

  if (isLoading) {
    return (
      <View>
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
      <View>
        <Text style={styles.userViewContent}>暂无内容</Text>
      </View>
    );
  }

  return (
    <View>
      {title && <Text style={[styles.userViewTitle, { color: textColor }]}>{title}</Text>}
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
  userViewContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  userViewContent: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  userViewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    paddingHorizontal: 20,
    marginRight: 12,
    marginBottom: 12,
  },
});
