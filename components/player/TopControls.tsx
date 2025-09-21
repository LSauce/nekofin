import { useDanmakuSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { formatBitrate } from '@/lib/utils';
import { DandanComment } from '@/services/dandanplay';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MenuView } from '@react-native-menu/menu';
import { BlurView } from 'expo-blur';
import * as Network from 'expo-network';
import { useNetworkState } from 'expo-network';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DanmakuSearchModal, DanmakuSearchModalRef } from './DanmakuSearchModal';
import { usePlayer } from './PlayerContext';

export function TopControls() {
  const {
    title,
    showControls,
    setShowControls,
    fadeAnim,
    setMenuOpen,
    tracks,
    selectedTracks,
    onAudioTrackChange,
    onSubtitleTrackChange,
    onRateChange,
    rate,
    mediaStats,
    onCommentsLoaded,
    danmakuEpisodeInfo,
    danmakuComments,
  } = usePlayer();
  const router = useRouter();
  const navigation = useNavigation();
  const [now, setNow] = useState<string>('');
  const { type: networkType } = useNetworkState();
  const { settings: danmakuSettings, setSettings: setDanmakuSettings } = useDanmakuSettings();
  const danmakuSearchModalRef = useRef<DanmakuSearchModalRef>(null);

  const audioTracks =
    tracks?.audio?.filter((track) => track.index !== -1).sort((a, b) => a.index - b.index) ?? [];
  const subtitleTracks =
    tracks?.subtitle?.filter((track) => track.index !== -1).sort((a, b) => a.index - b.index) ?? [];

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = `${d.getHours()}`.padStart(2, '0');
      const m = `${d.getMinutes()}`.padStart(2, '0');
      setNow(`${h}:${m}`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const handleBackPress = async () => {
    setShowControls(false);
    navigation.setOptions({
      orientation: 'portrait',
    });
    setTimeout(() => {
      router.back();
    }, 100);
  };

  const handleAudioTrackSelect = (trackIndex: number) => {
    onAudioTrackChange?.(trackIndex);
  };

  const handleSubtitleTrackSelect = (trackIndex: number) => {
    onSubtitleTrackChange?.(trackIndex);
  };

  const handleRateSelect = (newRate: number) => {
    onRateChange?.(newRate);
  };

  const createMenuAction = <T,>(id: string, title: string, currentValue: T, targetValue: T) => ({
    id,
    title,
    state: currentValue === targetValue ? ('on' as const) : ('off' as const),
  });

  const createRateAction = (rateValue: number) =>
    createMenuAction(`rate_${rateValue}`, `${rateValue}x`, rate, rateValue);

  const handleDanmakuToggle = useCallback(() => {
    setDanmakuSettings({
      ...danmakuSettings,
      danmakuFilter: danmakuSettings.danmakuFilter === 15 ? 0 : 15, // 15 = 所有弹幕都过滤掉
    });
  }, [danmakuSettings, setDanmakuSettings]);

  const handleDanmakuSearch = useCallback(() => {
    danmakuSearchModalRef.current?.present();
  }, []);

  const handleCommentsLoaded = useCallback(
    (comments: DandanComment[], episodeInfo?: { animeTitle: string; episodeTitle: string }) => {
      onCommentsLoaded?.(comments, episodeInfo);
    },
    [onCommentsLoaded],
  );

  return (
    <>
      <Animated.View
        style={[styles.backButton, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView tint="dark" intensity={100} style={styles.backButtonBlur}>
          <TouchableOpacity style={styles.backButtonTouchable} onPress={handleBackPress}>
            <AntDesign name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      <Animated.View style={[styles.netSpeedContainer, fadeAnimatedStyle]} pointerEvents="none">
        <Animated.View style={styles.netRow}>
          {networkType === Network.NetworkStateType.WIFI && (
            <MaterialIcons name="wifi" size={14} color="#fff" />
          )}
          {networkType === Network.NetworkStateType.CELLULAR && (
            <MaterialIcons name="network-cell" size={14} color="#fff" />
          )}
          {networkType === Network.NetworkStateType.ETHERNET && (
            <MaterialIcons name="settings-ethernet" size={14} color="#fff" />
          )}
          {(networkType === Network.NetworkStateType.NONE ||
            networkType === Network.NetworkStateType.UNKNOWN) && (
            <MaterialIcons name="signal-cellular-off" size={14} color="#fff" />
          )}
          {!!mediaStats?.inputBitrate && mediaStats.inputBitrate > 0 && (
            <Text style={[styles.textShadow, styles.netSpeedText]}>
              {formatBitrate(mediaStats.inputBitrate)}
            </Text>
          )}
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.danmakuInfoContainer, fadeAnimatedStyle]} pointerEvents="none">
        {danmakuEpisodeInfo && (
          <View style={styles.danmakuInfoRow}>
            <MaterialIcons name="chat" size={12} color="#fff" />
            <Text style={[styles.textShadow, styles.danmakuInfoText]}>
              {danmakuEpisodeInfo.animeTitle} - {danmakuEpisodeInfo.episodeTitle}
            </Text>
          </View>
        )}
        {danmakuComments.length > 0 && (
          <Text style={[styles.textShadow, styles.danmakuCountText]}>
            {danmakuComments.length} 条弹幕
          </Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.clockContainer, fadeAnimatedStyle]} pointerEvents="none">
        {!!now && <Text style={[styles.textShadow, styles.clockText]}>{now}</Text>}
      </Animated.View>

      <Animated.View
        style={[styles.controlsContainer, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView tint="dark" intensity={100} style={styles.controlsBlur}>
          <View style={styles.controlsRow}>
            <MenuView
              isAnchoredToRight
              onPressAction={({ nativeEvent }) => {
                const key = nativeEvent.event;
                if (key.startsWith('audio_')) {
                  const trackIndex = parseInt(key.replace('audio_', ''));
                  handleAudioTrackSelect(trackIndex);
                }
                setMenuOpen(false);
              }}
              onOpenMenu={() => {
                setMenuOpen(true);
              }}
              onCloseMenu={() => {
                setMenuOpen(false);
              }}
              title="音轨选择"
              actions={
                audioTracks.length > 0
                  ? audioTracks.map((track) =>
                      createMenuAction(
                        `audio_${track.index}`,
                        track.name,
                        selectedTracks?.audio?.index,
                        track.index,
                      ),
                    )
                  : [{ id: 'no_audio', title: '无可用音轨', state: 'off' as const }]
              }
            >
              <TouchableOpacity
                style={[styles.controlButton, audioTracks.length === 0 && styles.disabledButton]}
                disabled={audioTracks.length === 0}
              >
                <MaterialIcons
                  name="audiotrack"
                  size={20}
                  color={audioTracks.length === 0 ? '#666' : 'white'}
                />
              </TouchableOpacity>
            </MenuView>

            <MenuView
              isAnchoredToRight
              onPressAction={({ nativeEvent }) => {
                const key = nativeEvent.event;
                if (key.startsWith('subtitle_')) {
                  const trackIndex = parseInt(key.replace('subtitle_', ''));
                  handleSubtitleTrackSelect(trackIndex);
                }
                setMenuOpen(false);
              }}
              onOpenMenu={() => {
                setMenuOpen(true);
              }}
              onCloseMenu={() => {
                setMenuOpen(false);
              }}
              title="字幕选择"
              actions={
                subtitleTracks.length > 0
                  ? [
                      createMenuAction(
                        'subtitle_-1',
                        '关闭字幕',
                        selectedTracks?.subtitle?.index,
                        -1,
                      ),
                      ...subtitleTracks.map((track) =>
                        createMenuAction(
                          `subtitle_${track.index}`,
                          track.name,
                          selectedTracks?.subtitle?.index,
                          track.index,
                        ),
                      ),
                    ]
                  : [{ id: 'no_subtitle', title: '无可用字幕', state: 'off' as const }]
              }
            >
              <TouchableOpacity
                style={[styles.controlButton, subtitleTracks.length === 0 && styles.disabledButton]}
                disabled={subtitleTracks.length === 0}
              >
                <MaterialIcons
                  name="subtitles"
                  size={20}
                  color={subtitleTracks.length === 0 ? '#666' : 'white'}
                />
              </TouchableOpacity>
            </MenuView>

            <MenuView
              isAnchoredToRight
              onPressAction={({ nativeEvent }) => {
                const key = nativeEvent.event;
                if (key.startsWith('rate_')) {
                  const newRate = parseFloat(key.replace('rate_', ''));
                  handleRateSelect(newRate);
                }
                setMenuOpen(false);
              }}
              onOpenMenu={() => {
                setMenuOpen(true);
              }}
              onCloseMenu={() => {
                setMenuOpen(false);
              }}
              title="播放速度"
              actions={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(createRateAction)}
            >
              <TouchableOpacity style={styles.controlButton}>
                <MaterialIcons name="speed" size={20} color="white" />
              </TouchableOpacity>
            </MenuView>

            <MenuView
              isAnchoredToRight
              onPressAction={({ nativeEvent }) => {
                const key = nativeEvent.event;
                if (key === 'danmaku_toggle') {
                  handleDanmakuToggle();
                } else if (key === 'danmaku_search') {
                  handleDanmakuSearch();
                }
                setMenuOpen(false);
              }}
              onOpenMenu={() => {
                setMenuOpen(true);
              }}
              onCloseMenu={() => {
                setMenuOpen(false);
              }}
              title="弹幕设置"
              actions={[
                createMenuAction(
                  'danmaku_toggle',
                  danmakuSettings.danmakuFilter === 15 ? '开启弹幕' : '关闭弹幕',
                  danmakuSettings.danmakuFilter,
                  15,
                ),
                { id: 'danmaku_search', title: '搜索弹幕', state: 'off' },
              ]}
            >
              <TouchableOpacity style={styles.controlButton}>
                <MaterialIcons name="chat" size={20} color="white" />
              </TouchableOpacity>
            </MenuView>
          </View>
        </BlurView>
      </Animated.View>

      {!!title && (
        <Animated.View style={[styles.titleContainer, fadeAnimatedStyle]} pointerEvents="none">
          <Text style={[styles.textShadow, styles.title]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </Animated.View>
      )}

      <DanmakuSearchModal ref={danmakuSearchModalRef} onCommentsLoaded={handleCommentsLoaded} />
    </>
  );
}

const styles = StyleSheet.create({
  textShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  netSpeedContainer: {
    position: 'absolute',
    top: 10,
    left: 100,
    zIndex: 10,
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netSpeedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
  },
  titleContainer: {
    position: 'absolute',
    top: 10,
    left: 100,
    right: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 100,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    top: 50,
    right: 100,
    zIndex: 10,
  },
  controlsBlur: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clockContainer: {
    position: 'absolute',
    top: 10,
    right: 100,
    zIndex: 10,
  },
  clockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  danmakuInfoContainer: {
    position: 'absolute',
    top: 32,
    left: 100,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  danmakuInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  danmakuInfoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'left',
  },
  danmakuCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'left',
    opacity: 0.8,
  },
});
