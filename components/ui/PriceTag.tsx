import { Text } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { formatPrice } from '@/utils/product';
import { StyleSheet, View } from 'react-native';

/** Selling price, with the struck-through MRP next to it when there is a discount. */
export function PriceTag({ price, mrp, size = 'md' }: { price: number; mrp?: number | null; size?: 'md' | 'lg' }) {
  const colors = Colors[useAppColorScheme()];
  const hasDiscount = !!mrp && mrp > price;
  return (
    <View style={styles.row}>
      <Text style={[styles.price, size === 'lg' && styles.priceLarge, { color: colors.text }]}>{formatPrice(price)}</Text>
      {hasDiscount && <Text style={[styles.mrp, { color: colors.textTertiary }]}>{formatPrice(mrp!)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 },
  price: { fontSize: 15, fontWeight: Typography.fontWeight.bold },
  priceLarge: { fontSize: 20 },
  mrp: { fontSize: 11, textDecorationLine: 'line-through' },
});
