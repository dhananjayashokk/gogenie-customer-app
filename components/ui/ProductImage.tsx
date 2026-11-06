import { Text } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { getCategoryIcon } from '@/utils/categoryIcon';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

/**
 * Product picture. With no image (or a broken one) it shows a soft green tile with the category's
 * emoji instead of a generic box.
 */
export function ProductImage({
  uri,
  categoryName,
  style,
  emojiSize = 44,
}: {
  uri?: string | null;
  categoryName?: string | null;
  style?: StyleProp<ViewStyle | ImageStyle | TextStyle>;
  emojiSize?: number;
}) {
  const colors = Colors[useAppColorScheme()];
  const [failed, setFailed] = useState(false);

  if (uri && !failed) {
    return (
      <View style={[styles.frame, { backgroundColor: colors.background }, style as StyleProp<ViewStyle>]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={200}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.fallback, { backgroundColor: colors.primary + '14' }, style as StyleProp<ViewStyle>]}>
      <Text style={{ fontSize: emojiSize }}>{getCategoryIcon(categoryName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: 12 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
