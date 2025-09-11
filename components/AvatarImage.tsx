import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ImageStyle, StyleProp, View } from 'react-native';

interface AvatarImageProps {
  avatarUri?: string;
  style?: StyleProp<ImageStyle>;
}

export function AvatarImage({ avatarUri, style }: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);
  const { accentColor } = useAccentColor();

  if (!avatarUri || imageError) {
    return (
      <View
        style={[
          style,
          { backgroundColor: accentColor, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <MaterialIcons name="person" size={20} color="white" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUri }}
      style={style}
      contentFit="cover"
      onError={() => setImageError(true)}
    />
  );
}
