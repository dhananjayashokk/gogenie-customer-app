import { Text } from '@/components/AppText';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { ProductImage } from '@/components/ui/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { discountPercent, formatVariantAttributes, getProductImageUri, timeAgo } from '@/utils/product';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

/** One product in a 2-column grid: image, name, unit, price, and an ADD / stepper control. */
export function ProductCard({
  product,
  quantity,
  onPress,
  onAdd,
  onChangeQuantity,
}: {
  product: any;
  quantity: number;
  onPress: () => void;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const colors = Colors[useAppColorScheme()];
  const scale = useRef(new Animated.Value(1)).current;
  const price = parseFloat(product.price);
  const mrp = product.mrp ? parseFloat(product.mrp) : null;
  const off = discountPercent(price, mrp);
  const unavailable = product.isAvailable === false;
  const variant = formatVariantAttributes(product);
  const history = product.isPreviouslyBought ? product.purchaseHistory : null;

  const press = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }], opacity: unavailable ? 0.55 : 1 }]}>
      <Pressable
        disabled={unavailable}
        onPress={onPress}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
      >
        <View>
          <ProductImage
            uri={getProductImageUri(product.image_url)}
            categoryName={product.categoryName}
            style={styles.image}
          />
          {off > 0 && (
            <View style={styles.offBadge}>
              <Badge label={`${off}% OFF`} tone="error" solid />
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {[product.unit || 'piece', variant].filter(Boolean).join(' · ')}
        </Text>
        {history && (
          <Text style={[styles.history, { color: colors.primary }]} numberOfLines={1}>
            Bought {history.purchaseCount}x · {timeAgo(history.lastPurchased)}
          </Text>
        )}

        <View style={styles.footer}>
          <PriceTag price={price} mrp={mrp} />
          {unavailable ? (
            <Badge label="Out of stock" tone="neutral" />
          ) : (
            <QuantityStepper quantity={quantity} onAdd={onAdd} onChange={onChangeQuantity} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '48%', marginBottom: 12 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: '100%', height: 112, borderRadius: 12 },
  offBadge: { position: 'absolute', top: 6, left: 6 },
  name: { marginTop: 10, fontSize: 13, lineHeight: 18, minHeight: 36, fontWeight: Typography.fontWeight.semibold },
  meta: { fontSize: 11, marginTop: 2 },
  history: { fontSize: 10, marginTop: 2, fontWeight: Typography.fontWeight.medium },
  footer: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
});
