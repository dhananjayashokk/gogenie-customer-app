import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

export interface StoreSummary {
  id: number;
  name: string;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
}

/** Store in the home list. Shows only what the API really knows: name, area, address and phone. */
export function StoreCard({ store, onPress }: { store: StoreSummary; onPress: () => void }) {
  const colors = Colors[useAppColorScheme()];
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => press(0.98)}
        onPressOut={() => press(1)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{store.name?.[0]?.toUpperCase() || 'S'}</Text>
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {store.name}
          </Text>
          {!!store.location && (
            <View style={styles.row}>
              <IconSymbol name="location.fill" size={13} color={colors.primary} />
              <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                {store.location}
              </Text>
            </View>
          )}
          {!!store.address && (
            <Text style={[styles.address, { color: colors.textTertiary }]} numberOfLines={2}>
              {store.address}
            </Text>
          )}
        </View>

        <View style={[styles.go, { backgroundColor: colors.primary }]}>
          <IconSymbol name="arrow.right" size={16} color={colors.textInverse} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13, fontWeight: Typography.fontWeight.medium, flexShrink: 1 },
  address: { fontSize: 12, lineHeight: 17 },
  go: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
