import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useCart } from '@/contexts/CartContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/product';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom bar with item count and total; slides up when the cart has something in it. */
export function StickyCartBar() {
  const colors = Colors[useAppColorScheme()];
  const insets = useSafeAreaInsets();
  const { state } = useCart();
  const visible = state.totalItems > 0;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, useNativeDriver: true, bounciness: 6 }).start();
  }, [visible, slide]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12),
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/cart')}
        style={[styles.bar, { backgroundColor: colors.primary }]}
      >
        <View>
          <Text style={[styles.count, { color: colors.textInverse }]}>
            {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
          </Text>
          <Text style={[styles.total, { color: colors.textInverse }]}>{formatPrice(state.totalAmount)}</Text>
        </View>
        <View style={styles.action}>
          <Text style={[styles.actionText, { color: colors.textInverse }]}>View cart</Text>
          <IconSymbol name="arrow.right" size={18} color={colors.textInverse} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 12, right: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  count: { fontSize: 11, opacity: 0.85, fontWeight: Typography.fontWeight.medium },
  total: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 15, fontWeight: Typography.fontWeight.semibold },
});
