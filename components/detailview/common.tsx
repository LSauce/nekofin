import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TouchableOpacity,
  View,
} from 'react-native';

import { BottomSheetBackdropModal } from '../BottomSheetBackdropModal';
import { ThemedText } from '../ThemedText';

export const ItemMeta = ({ item }: { item: BaseItemDto }) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const ratingText = useMemo(() => {
    if (typeof item?.CommunityRating === 'number') return item.CommunityRating.toFixed(1);
    if (typeof item?.CriticRating === 'number') return String(item.CriticRating);
    if (item?.OfficialRating) return item.OfficialRating;
    return '';
  }, [item?.CommunityRating, item?.CriticRating, item?.OfficialRating]);

  const yearText = useMemo(() => {
    return typeof item?.ProductionYear === 'number' ? String(item.ProductionYear) : '';
  }, [item?.ProductionYear]);

  return (
    <>
      <Text style={[detailViewStyles.meta, { color: textColor }]}>
        {ratingText ? (
          <>
            <Text style={detailViewStyles.star}>★</Text>
            <Text>{` ${ratingText}`}</Text>
            {yearText ? <Text>{` · ${yearText}`}</Text> : null}
          </>
        ) : (
          <>{yearText}</>
        )}
      </Text>
    </>
  );
};

export const ItemOverview = ({ item }: { item: BaseItemDto }) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [textLineNumber, setTextLineNumber] = useState<number | null>(null);
  const [lastLineText, setLastLineText] = useState<string>('');

  const { accentColor } = useAccentColor();

  const overview = item?.Overview?.trim() ?? '';

  const handleTextLayout = useCallback((event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = event.nativeEvent;
    if (lines.length > 4) {
      const lastLine = lines[4];
      setLastLineText(lastLine.text);
    }
    setTextLineNumber(lines.length);
  }, []);

  const handleShowMore = () => {
    bottomSheetModalRef.current?.present();
  };

  if (!overview) return null;

  return (
    <>
      <View style={detailViewStyles.overviewContainer}>
        <Text
          style={[detailViewStyles.overview, { color: textColor }]}
          numberOfLines={4}
          ellipsizeMode="head"
          onTextLayout={handleTextLayout}
        >
          {overview}
        </Text>
        {textLineNumber && textLineNumber > 4 && lastLineText.trim() && (
          <View style={detailViewStyles.lastLineContainer}>
            <Text
              style={[detailViewStyles.overview, { flex: 1, color: textColor }]}
              numberOfLines={1}
            >
              {lastLineText}
            </Text>
            {textLineNumber && textLineNumber > 5 && (
              <TouchableOpacity onPress={handleShowMore}>
                <Text style={[detailViewStyles.overview, { color: accentColor }]}>查看更多</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <BottomSheetBackdropModal ref={bottomSheetModalRef} enableDynamicSizing>
        <BottomSheetView style={detailViewStyles.modalContent}>
          <Text style={[detailViewStyles.modalTitle, { color: textColor }]}>剧情简介</Text>
          <Text style={[detailViewStyles.modalOverview, { color: textColor }]}>{overview}</Text>
        </BottomSheetView>
      </BottomSheetBackdropModal>
    </>
  );
};

export const ItemInfoList = ({ item }: { item: BaseItemDto }) => {
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  const genreText = useMemo(() => {
    const primary = item?.Genres && item.Genres.length > 0 ? item.Genres : undefined;
    if (primary) return primary.join(', ');
    const fallback = item?.GenreItems?.map((g) => g.Name).filter(Boolean) ?? [];
    return fallback.join(', ');
  }, [item?.GenreItems, item?.Genres]);

  const writerText = useMemo(() => {
    const people = item?.People?.filter((p) => p?.Type === 'Writer').map((p) => p.Name) ?? [];
    return people.filter(Boolean).join(', ');
  }, [item?.People]);

  const studioText = useMemo(() => {
    const studios = item?.Studios?.map((s) => s.Name) ?? [];
    return studios.filter(Boolean).join(', ');
  }, [item?.Studios]);

  if (!genreText && !writerText && !studioText) return null;

  return (
    <View style={detailViewStyles.infoBlock}>
      {!!genreText && (
        <View style={detailViewStyles.infoRow}>
          <Text style={[detailViewStyles.infoLabel, { color: subtitleColor }]}>类型</Text>
          <ThemedText style={detailViewStyles.infoValue}>{genreText}</ThemedText>
        </View>
      )}
      {!!writerText && (
        <View style={detailViewStyles.infoRow}>
          <Text style={[detailViewStyles.infoLabel, { color: subtitleColor }]}>编剧</Text>
          <ThemedText style={detailViewStyles.infoValue}>{writerText}</ThemedText>
        </View>
      )}
      {!!studioText && (
        <View style={detailViewStyles.infoRow}>
          <Text style={[detailViewStyles.infoLabel, { color: subtitleColor }]}>工作室</Text>
          <ThemedText style={detailViewStyles.infoValue}>{studioText}</ThemedText>
        </View>
      )}
    </View>
  );
};

export const detailViewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  content: {
    top: -160,
    padding: 20,
    gap: 8,
  },
  logo: {
    top: -20,
    width: '100%',
    height: 120,
  },
  meta: {
    fontSize: 14,
  },
  star: {
    color: '#F5C518',
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
  },
  overviewContainer: {
    gap: 8,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverview: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoBlock: {
    marginTop: 6,
    rowGap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  infoLabel: {
    fontSize: 14,
    width: 56,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  playButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  horizontalList: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    gap: 8,
  },
  edgeToEdge: {
    marginHorizontal: -20,
  },
  horizontalCard: {
    width: 200,
  },
  seasonCard: {
    width: 140,
  },
  listContainer: {
    marginTop: 16,
    rowGap: 16,
  },
  listItem: {
    width: '100%',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  lastLineContainer: {
    marginTop: -8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
});
