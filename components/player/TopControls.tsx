import { formatBitrate } from '@/lib/utils';
import { MediaStats, MediaTrack, MediaTracks } from '@/modules/vlc-player';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MenuView } from '@react-native-menu/menu';
import { BlurView } from 'expo-blur';
import * as Network from 'expo-network';
import { useNetworkState } from 'expo-network';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type TopControlsProps = {
  title: string;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  fadeAnim: SharedValue<number>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  tracks?: MediaTracks;
  selectedTracks?: MediaTrack;
  onAudioTrackChange?: (trackIndex: number) => void;
  onSubtitleTrackChange?: (trackIndex: number) => void;
  mediaStats?: MediaStats;
};

export function TopControls({
  title,
  showControls,
  setShowControls,
  fadeAnim,
  menuOpen,
  setMenuOpen,
  tracks,
  selectedTracks,
  onAudioTrackChange,
  onSubtitleTrackChange,
  mediaStats,
}: TopControlsProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const [now, setNow] = useState<string>('');
  const { type: networkType } = useNetworkState();

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

      <Animated.View style={[styles.clockContainer, fadeAnimatedStyle]} pointerEvents="none">
        {!!now && <Text style={[styles.textShadow, styles.clockText]}>{now}</Text>}
      </Animated.View>

      <Animated.View
        style={[styles.danmakuButton, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView tint="dark" intensity={100} style={styles.danmakuButtonBlur}>
          <MenuView
            isAnchoredToRight
            onPressAction={({ nativeEvent }) => {
              const key = nativeEvent.event;
              if (key.startsWith('audio_')) {
                const trackIndex = parseInt(key.replace('audio_', ''));
                handleAudioTrackSelect(trackIndex);
              } else if (key.startsWith('subtitle_')) {
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
            actions={[
              ...(audioTracks.length > 0
                ? [
                    {
                      id: 'audio',
                      title: '音轨选择',
                      subactions: audioTracks.map((track) => ({
                        id: `audio_${track.index}`,
                        title: track.name,
                        state:
                          selectedTracks?.audio?.index === track.index
                            ? ('on' as const)
                            : ('off' as const),
                      })),
                    },
                  ]
                : []),
              ...(subtitleTracks.length > 0
                ? [
                    {
                      id: 'subtitle',
                      title: '字幕选择',
                      subactions: [
                        {
                          id: 'subtitle_-1',
                          title: '关闭字幕',
                          state:
                            selectedTracks?.subtitle?.index === -1
                              ? ('on' as const)
                              : ('off' as const),
                        },
                        ...subtitleTracks.map((track) => ({
                          id: `subtitle_${track.index}`,
                          title: track.name,
                          state:
                            selectedTracks?.subtitle?.index === track.index
                              ? ('on' as const)
                              : ('off' as const),
                        })),
                      ],
                    },
                  ]
                : []),
            ]}
          >
            <TouchableOpacity style={styles.danmakuButtonTouchable}>
              <AntDesign name="setting" size={20} color="white" />
            </TouchableOpacity>
          </MenuView>
        </BlurView>
      </Animated.View>

      {!!title && (
        <Animated.View style={[styles.titleContainer, fadeAnimatedStyle]} pointerEvents="none">
          <Text style={[styles.textShadow, styles.title]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        </Animated.View>
      )}
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
  danmakuButton: {
    position: 'absolute',
    top: 50,
    right: 100,
    zIndex: 10,
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
  danmakuButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  danmakuButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
