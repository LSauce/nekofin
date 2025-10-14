import { useThemeColor } from '@/hooks/useThemeColor';
import { formatDurationFromTicks } from '@/lib/utils';
import { MediaItem } from '@/services/media/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EpisodeCard } from '../media/Card';
import { usePlayer } from './PlayerContext';

export interface EpisodeListModalRef {
  present: () => void;
  dismiss: () => void;
}

export function EpisodeListModal({ ref }: { ref: React.RefObject<EpisodeListModalRef | null> }) {
  const { episodes, currentItem, onEpisodeSelect } = usePlayer();
  const [open, setOpen] = useState(false);
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  const translateX = useSharedValue(screenWidth);
  const opacity = useSharedValue(0);

  const present = useCallback(() => {
    translateX.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 200 });
    scheduleOnRN(setOpen, true);

    scheduleOnRN(
      setTimeout,
      () => {
        if (currentItem && episodes.length > 0) {
          const currentIndex = episodes.findIndex((episode) => episode.id === currentItem.id);
          if (currentIndex >= 0) {
            flatListRef.current?.scrollToIndex({
              index: currentIndex,
              animated: true,
              viewPosition: 0,
            });
          }
        }
      },
      350,
    );
  }, [translateX, opacity, currentItem, episodes]);

  const dismiss = useCallback(() => {
    translateX.value = withTiming(screenWidth, { duration: 300 });
    opacity.value = withTiming(0, { duration: 200 });
    scheduleOnRN(
      setTimeout,
      () => {
        setOpen(false);
      },
      300,
    );
  }, [translateX, screenWidth, opacity]);

  useImperativeHandle(ref, () => ({
    present,
    dismiss,
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > screenWidth * 0.3 || event.velocityX > 500) {
        scheduleOnRN(dismiss);
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleBackdropPress = () => {
    dismiss();
  };

  const handleEpisodePress = useCallback(
    (episode: MediaItem) => {
      if (episode.id) {
        onEpisodeSelect(episode.id);
        dismiss();
      }
    },
    [onEpisodeSelect, dismiss],
  );

  const renderEpisodeItem = useCallback(
    ({ item }: { item: MediaItem }) => {
      const isCurrentEpisode = currentItem?.id === item.id;

      return (
        <TouchableOpacity
          style={[styles.episodeItem, isCurrentEpisode && styles.currentEpisodeItem]}
          onPress={() => handleEpisodePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.episodeContent}>
            <EpisodeCard
              item={item}
              style={{ width: 140 }}
              hideText
              showBorder={false}
              disableContextMenu
              disabled
              imgType="Primary"
            />
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.episodeMeta, { color: subtitleColor }]}>
                {`S${item.parentIndexNumber}E${item.indexNumber}`}
              </Text>
              <Text style={[styles.episodeMeta, { color: subtitleColor }]}>
                {formatDurationFromTicks(item.runTimeTicks ?? 0)}
              </Text>
              {item.overview && (
                <Text style={[styles.episodeOverview, { color: subtitleColor }]} numberOfLines={2}>
                  {item.overview.trim()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [currentItem?.id, handleEpisodePress, subtitleColor],
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents="auto">
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.modal, { width: screenWidth * 0.4 }, modalAnimatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>剧集列表</Text>
            <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={episodes}
            renderItem={renderEpisodeItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={() => {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  modal: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  episodeItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  currentEpisodeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  episodeContent: {
    flexDirection: 'row',
    gap: 12,
    padding: 8,
  },
  episodeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
    color: '#fff',
  },
  episodeMeta: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  episodeOverview: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  markButton: {
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
});
