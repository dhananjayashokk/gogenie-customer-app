import { Text, TextInput } from '@/components/AppText';
import OrderSplashScreen from '@/components/OrderSplashScreen';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ProductImage } from '@/components/ui/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useCart } from '@/contexts/CartContext';
import { useTabBarHeight } from '@/contexts/TabBarHeightContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiService } from '@/services/api';
import { formatPrice } from '@/utils/product';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FALLBACK_TAB_BAR_HEIGHT = 90;
const NOTE_MAX_LENGTH = 200;

export default function CartScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { show: showToast } = useToast();
  const { state: cartState, updateQuantity, clearCart } = useCart();
  const { height: measuredTabBarHeight } = useTabBarHeight();
  const tabBarHeight = measuredTabBarHeight || FALLBACK_TAB_BAR_HEIGHT;
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [note, setNote] = useState('');

  const subtotal = cartState.totalAmount;
  // The server does not charge for delivery yet ("free delivery for now"), so neither does the bill.
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const storeId = cartState.items[0]?.storeId;
  const storeName = cartState.items[0]?.storeName;

  const handlePlaceOrder = async () => {
    if (cartState.items.length === 0 || !storeId) {
      showToast('Your cart is empty', 'error');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const startTime = Date.now();
      const orderData = {
        storeId: typeof storeId === 'string' ? parseInt(storeId) : storeId,
        items: cartState.items.map((item) => ({
          storeProductId: item.id as any,
          quantity: item.quantity,
        })),
        deliverySlot: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        specialInstructions: note.trim() || undefined,
        paymentMethodId: 1, // cash on delivery
      };

      const [response] = await Promise.all([
        ApiService.orders.placeDeliveryOrder(orderData),
        // keep the order animation up for a moment so it doesn't flash
        new Promise((resolve) => setTimeout(resolve, Math.max(3500 - (Date.now() - startTime), 0))),
      ]);

      clearCart();
      setNote('');

      const orderId = response.orderId || response.id || response.order?.id;
      showToast('Order placed! You can track its progress now.', 'success');
      router.push(orderId ? `/order/${orderId}` : '/(tabs)/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      showToast(error instanceof Error ? error.message : 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartState.items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <OrderSplashScreen visible={isPlacingOrder} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
        </View>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '14' }]}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add items from a store to get started.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>Browse stores</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <OrderSplashScreen visible={isPlacingOrder} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {cartState.totalItems} item{cartState.totalItems !== 1 ? 's' : ''}
            {storeName ? ` · ${storeName}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={clearCart} hitSlop={8} activeOpacity={0.7}>
          <Text style={[styles.clear, { color: colors.error }]}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: tabBarHeight + 110 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Items */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            {cartState.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
                ]}
              >
                <ProductImage uri={item.image || null} categoryName={item.category} style={styles.itemImage} emojiSize={28} />
                <View style={styles.itemBody}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemUnit, { color: colors.textSecondary }]}>
                    {item.unit} · {formatPrice(item.price)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <QuantityStepper
                    quantity={item.quantity}
                    onAdd={() => updateQuantity(item.id, 1)}
                    onChange={(quantity) => updateQuantity(item.id, quantity)}
                  />
                  <Text style={[styles.itemTotal, { color: colors.text }]}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addMore}
            activeOpacity={0.7}
            onPress={() => router.push(`/store/${storeId}`)}
          >
            <IconSymbol name="plus" size={16} color={colors.primary} />
            <Text style={[styles.addMoreText, { color: colors.primary }]}>Add more items</Text>
          </TouchableOpacity>

          {/* Delivery notes (optional) */}
          <View style={[styles.card, styles.cardPadded, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery instructions</Text>
            <TextInput
              value={note}
              onChangeText={(value) => setNote(value.slice(0, NOTE_MAX_LENGTH))}
              placeholder="e.g. Please call when you arrive (optional)"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={NOTE_MAX_LENGTH}
              style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <Text style={[styles.noteCount, { color: colors.textTertiary }]}>
              {note.length}/{NOTE_MAX_LENGTH}
            </Text>
          </View>

          {/* Bill */}
          <View style={[styles.card, styles.cardPadded, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Bill details</Text>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Item total</Text>
              <Text style={[styles.billValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Delivery fee</Text>
              <Text style={[styles.billValue, { color: colors.success }]}>Free</Text>
            </View>
            <View style={[styles.totalRow, { borderTopColor: colors.divider }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>To pay</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(total)}</Text>
            </View>
            <View style={[styles.payNote, { backgroundColor: colors.primary + '10' }]}>
              <IconSymbol name="creditcard" size={16} color={colors.primary} />
              <Text style={[styles.payNoteText, { color: colors.textSecondary }]}>Pay with cash on delivery</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Place order bar, pinned above the tab bar */}
      <View style={[styles.checkout, { bottom: tabBarHeight + Spacing.sm }]} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isPlacingOrder}
          onPress={handlePlaceOrder}
          style={[styles.checkoutButton, { backgroundColor: colors.primary, opacity: isPlacingOrder ? 0.7 : 1 }]}
        >
          <View>
            <Text style={[styles.checkoutCount, { color: colors.textInverse }]}>
              {cartState.totalItems} item{cartState.totalItems !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.checkoutTotal, { color: colors.textInverse }]}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.checkoutAction}>
            <Text style={[styles.checkoutText, { color: colors.textInverse }]}>
              {isPlacingOrder ? 'Placing order…' : 'Place order'}
            </Text>
            {!isPlacingOrder && <IconSymbol name="arrow.right" size={18} color={colors.textInverse} />}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  headerSub: { fontSize: 13, marginTop: 2 },
  clear: { fontSize: 13, fontWeight: Typography.fontWeight.semibold },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, overflow: 'hidden' },
  cardPadded: { padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: Typography.fontWeight.bold, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 12 },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: Typography.fontWeight.semibold, lineHeight: 19 },
  itemUnit: { fontSize: 12, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  itemTotal: { fontSize: 14, fontWeight: Typography.fontWeight.bold },
  addMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 12 },
  addMoreText: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  noteInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  noteCount: { alignSelf: 'flex-end', fontSize: 11, marginTop: 6 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { fontSize: 14 },
  billValue: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  totalValue: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  payNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginTop: 14 },
  payNoteText: { fontSize: 12 },
  checkout: { position: 'absolute', left: 0, right: 0, paddingHorizontal: Spacing.lg },
  checkoutButton: {
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
  checkoutCount: { fontSize: 11, opacity: 0.85, fontWeight: Typography.fontWeight.medium },
  checkoutTotal: { fontSize: 17, fontWeight: Typography.fontWeight.bold },
  checkoutAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutText: { fontSize: 16, fontWeight: Typography.fontWeight.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  emptyText: { fontSize: 14, textAlign: 'center' },
  primaryButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  primaryButtonText: { fontSize: 15, fontWeight: Typography.fontWeight.semibold },
});
