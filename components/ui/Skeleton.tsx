import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View } from 'react-native';

/** Pulsing placeholder block shown while content loads. */
export function Skeleton({ width = '100%', height = 16, radius = 8 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const colors = Colors[useAppColorScheme()];
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }} />;
}

/** Loading placeholder with the same footprint as a ProductCard. */
export function ProductCardSkeleton() {
  const colors = Colors[useAppColorScheme()];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      <Skeleton height={110} radius={12} />
      <View style={{ height: 10 }} />
      <Skeleton width="85%" height={13} />
      <View style={{ height: 6 }} />
      <Skeleton width="45%" height={11} />
      <View style={{ height: 14 }} />
      <View style={styles.footer}>
        <Skeleton width={48} height={16} />
        <Skeleton width={64} height={32} radius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', padding: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
