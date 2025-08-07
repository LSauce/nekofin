import { useLocalSearchParams } from 'expo-router';
import { Video } from 'expo-video';
import { Dimensions, StyleSheet, View } from 'react-native';

const JELLYFIN_HOST = 'demo.jellyfin.org/stable';

export default function Player() {
  const { itemId, mediaSourceId, accessToken } = useLocalSearchParams();
  if (!itemId || !mediaSourceId || !accessToken) return null;
  const url = `${'https://demo.jellyfin.org/stable'}/Videos/${itemId}/stream.${'mp4'}?MediaSourceId=${mediaSourceId}&api_key=${accessToken}`;
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: url }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: Dimensions.get('window').width,
    height: (Dimensions.get('window').width * 9) / 16,
    backgroundColor: '#000',
  },
});
