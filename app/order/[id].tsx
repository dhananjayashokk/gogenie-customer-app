import { Text } from '@/components/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { ApiService } from '@/services/api';
import { subscribeToOrder, unsubscribeFromOrder } from '@/services/supabase';
import { formatPrice } from '@/utils/product';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The steps a delivery goes through, in the order the store and delivery partner move it along
const STEPS = [
  { key: 'pending', title: 'Order placed', description: 'Waiting for the store to confirm' },
  { key: 'preparing', title: 'Preparing', description: 'The store is packing your order' },
  { key: 'confirmed', title: 'Confirmed', description: 'The store accepted your order' },
  { key: 'ready_to_dispatch', title: 'Ready for pickup', description: 'Waiting for a delivery partner' },
  { key: 'out_for_delivery', title: 'Out for delivery', description: 'On the way to you' },
  { key: 'delivered', title: 'Delivered', description: 'Enjoy your order!' },
];

// Server status -> step index
const STEP_INDEX: Record<string, number> = {
  pending: 0,
  preparing: 1,
  confirmed: 2,
  partially_accepted: 2,
  ready_to_dispatch: 3,
  out_for_delivery: 4,
  delivered: 5,
  completed: 5,
};

const HERO: Record<string, { emoji: string; title: string; description: string }> = {
  pending: { emoji: '🧾', title: 'Order placed', description: 'Waiting for the store to confirm your order' },
  preparing: { emoji: '👩‍🍳', title: 'Preparing your order', description: 'The store is packing your items' },
  confirmed: { emoji: '✅', title: 'Order confirmed', description: 'The store accepted your order' },
  partially_accepted: { emoji: '✅', title: 'Order confirmed', description: 'The store accepted most of your order' },
  ready_to_dispatch: { emoji: '📦', title: 'Packed and ready', description: 'Waiting for a delivery partner to pick it up' },
  out_for_delivery: { emoji: '🛵', title: 'Out for delivery', description: 'Your order is on the way to you' },
  delivered: { emoji: '🎉', title: 'Delivered', description: 'Your order has been delivered' },
  completed: { emoji: '🎉', title: 'Delivered', description: 'Your order has been delivered' },
  cancelled: { emoji: '✖️', title: 'Order cancelled', description: 'This order was cancelled' },
  rejected: { emoji: '✖️', title: 'Order rejected', description: 'The store could not accept this order' },
};

const POLL_MS = 8000;

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors[useAppColorScheme()];
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEarlierSteps, setShowEarlierSteps] = useState(false);
  const realtimeChannelRef = useRef<any>(null);

  // silent = background refresh (realtime event / polling): no loading screen, and a failure keeps the current order
  const fetchOrder = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const response = await ApiService.orders.getDeliveryOrderDetails(id || '');
        const data = response.data || response.order || response;
        setOrder({
          ...data,
          status: String(data.orderStatus || 'pending').toLowerCase(),
          subtotal: parseFloat(data.subtotal || '0'),
          deliveryCharge: parseFloat(data.deliveryCharge || '0'),
          totalAmount: parseFloat(data.totalAmount || '0'),
        });
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Failed to load order details');
          setOrder(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  // Initial load + live updates from Supabase realtime
  useEffect(() => {
    if (!id) return;
    fetchOrder();

    const orderId = parseInt(id);
    if (!isNaN(orderId)) {
      realtimeChannelRef.current = subscribeToOrder(orderId, (payload: any) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') fetchOrder(true);
      });
    }
    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromOrder(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [id, fetchOrder]);

  // Fallback for when realtime is unavailable: refresh every few seconds until the order is finished
  useEffect(() => {
    if (!id || ['delivered', 'completed', 'cancelled', 'rejected'].includes(order?.status)) return;
    const timer = setInterval(() => fetchOrder(true), POLL_MS);
    return () => clearInterval(timer);
  }, [id, order?.status, fetchOrder]);

  // Back always lands on the orders list, wherever the order was opened from (cart, home strip, list)
  const goBack = useCallback(() => router.replace('/(tabs)/orders'), []);

  // Same for the Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack])
  );

  const Header = ({ subtitle }: { subtitle?: string }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={[styles.backButton, { backgroundColor: colors.surface }]}>
        <IconSymbol name="arrow.left" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order tracking</Text>
        {!!subtitle && <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider, gap: 10 }]}>
            <Skeleton width={48} height={48} radius={24} />
            <Skeleton width="55%" height={20} />
            <Skeleton width="80%" height={13} />
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider, gap: 14 }]}>
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} width="70%" height={14} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.bigEmoji}>{error ? '⚠️' : '🔎'}</Text>
          <Text style={[styles.centeredTitle, { color: colors.text }]}>
            {error ? 'Unable to load order' : 'Order not found'}
          </Text>
          <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
            {error || "The order you're looking for could not be found."}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => (error ? fetchOrder() : goBack())}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{error ? 'Try again' : 'Go back'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status: string = order.status;
  const hero = HERO[status] || { emoji: '⏳', title: 'Processing', description: 'Your order is being processed' };
  const stopped = status === 'cancelled' || status === 'rejected';
  const stepIndex = STEP_INDEX[status] ?? 0;
  const tone = stopped ? colors.error : status === 'delivered' || status === 'completed' ? colors.success : colors.primary;
  const paid = ['success', 'paid'].includes(String(order.paymentStatus).toLowerCase());
  const storeAddress = typeof order.store?.address === 'string' ? order.store.address : '';

  // From "Out for delivery" on, the finished stages fold into one tappable row
  const collapsible = !stopped && stepIndex >= 4;
  const hiddenCount = collapsible && !showEarlierSteps ? stepIndex : 0;

  const timeFor = (index: number) => {
    if (index === 0) return timeOf(order.createdAt);
    if (index === stepIndex && !stopped) return `Updated ${timeOf(order.updatedAt)}`;
    return '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header subtitle={`#${order.orderNumber}`} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrder(true);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Status hero */}
        <View style={[styles.hero, { backgroundColor: tone + '14', borderColor: tone + '40' }]}>
          <View style={[styles.heroIcon, { backgroundColor: tone + '22' }]}>
            <Text style={styles.heroEmoji}>{hero.emoji}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{hero.title}</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>{hero.description}</Text>
          {!stopped && (
            <View style={[styles.progressTrack, { backgroundColor: tone + '26' }]}>
              <View style={[styles.progressFill, { backgroundColor: tone, width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} />
            </View>
          )}
        </View>

        {/* Store the order was placed with */}
        {!!order.store?.name && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.overline, { color: colors.textSecondary }]}>Ordered from</Text>
            <View style={styles.row}>
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primary + '1A' }]}>
                <Text style={[styles.partnerInitial, { color: colors.primary }]}>{order.store.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.partnerName, { color: colors.text }]}>{order.store.name}</Text>
                {!!storeAddress && (
                  <Text style={[styles.muted, { color: colors.textSecondary }]} numberOfLines={3}>
                    {storeAddress}
                  </Text>
                )}
                {!!order.store.phone && (
                  <Text style={[styles.muted, { color: colors.textSecondary }]}>{order.store.phone}</Text>
                )}
              </View>
            </View>
            {(!!order.store.phone || !!storeAddress) && (
              <View style={styles.storeActions}>
                {!!order.store.phone && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`tel:${order.store.phone}`)}
                    style={[styles.storeAction, { borderColor: colors.primary }]}
                  >
                    <IconSymbol name="phone.fill" size={16} color={colors.primary} />
                    <Text style={[styles.storeActionText, { color: colors.primary }]}>Call store</Text>
                  </TouchableOpacity>
                )}
                {!!storeAddress && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.store.name}, ${storeAddress}`)}`
                      )
                    }
                    style={[styles.storeAction, { borderColor: colors.primary }]}
                  >
                    <IconSymbol name="location.fill" size={16} color={colors.primary} />
                    <Text style={[styles.storeActionText, { color: colors.primary }]}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Delivery OTP: shown while a delivery partner is on the way */}
        {!!order.deliveryOtp && status === 'out_for_delivery' && (
          <View style={[styles.otpCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.otpTitle, { color: colors.text }]}>Share this OTP with your delivery partner</Text>
            <View style={styles.otpDigits}>
              {String(order.deliveryOtp)
                .split('')
                .map((digit: string, index: number) => (
                  <View key={index} style={[styles.otpBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                    <Text style={[styles.otpDigit, { color: colors.primary }]}>{digit}</Text>
                  </View>
                ))}
            </View>
            <Text style={[styles.otpHint, { color: colors.textSecondary }]}>Only share it when you receive your order.</Text>
          </View>
        )}

        {/* Items the store could not accept */}
        {order.isPartiallyAccepted && order.unacceptedItems?.length > 0 && (
          <View style={[styles.warnCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <View style={styles.warnHeader}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
              <Text style={[styles.warnTitle, { color: colors.text }]}>Some items couldn't be accepted</Text>
            </View>
            <Text style={[styles.warnText, { color: colors.textSecondary }]}>
              The store accepted the rest of your order. These items won't be delivered:
            </Text>
            {order.unacceptedItems.map((item: any) => (
              <View key={item.id} style={styles.warnRow}>
                <Text style={[styles.warnName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.warnMeta, { color: colors.textSecondary }]}>
                  {item.quantityNotAccepted} of {item.quantityOrdered} · {item.reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delivery partner: only once one has accepted the order */}
        {!!order.deliveryAgent && (
          <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <View style={[styles.partnerAvatar, { backgroundColor: colors.primary + '1A' }]}>
              <Text style={[styles.partnerInitial, { color: colors.primary }]}>
                {order.deliveryAgent.name?.[0]?.toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.partnerName, { color: colors.text }]}>{order.deliveryAgent.name}</Text>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>Your delivery partner</Text>
            </View>
            {!!order.deliveryAgent.phone && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${order.deliveryAgent.phone}`)}
                style={[styles.callButton, { backgroundColor: colors.success + '1F' }]}
              >
                <IconSymbol name="phone.fill" size={20} color={colors.success} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Timeline */}
        {!stopped && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Order status</Text>

            {collapsible && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowEarlierSteps((open) => !open)}
                style={styles.stepRow}
              >
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, { backgroundColor: colors.success }]}>
                    <IconSymbol name="checkmark" size={14} color={colors.textInverse} />
                  </View>
                  <View style={[styles.stepLine, { backgroundColor: colors.success }]} />
                </View>
                <View style={[styles.stepBody, styles.foldRow]}>
                  <View style={styles.flex}>
                    <Text style={[styles.stepTitle, { color: colors.text, fontWeight: Typography.fontWeight.semibold }]}>
                      {stepIndex} earlier step{stepIndex !== 1 ? 's' : ''} completed
                    </Text>
                    <Text style={[styles.muted, { color: colors.textSecondary }]}>
                      {showEarlierSteps ? 'Tap to hide details' : 'Tap to see details'}
                    </Text>
                  </View>
                  <IconSymbol name={showEarlierSteps ? 'chevron.up' : 'chevron.down'} size={22} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}

            {STEPS.map((step, index) => {
              if (index < hiddenCount) return null;
              const done = index < stepIndex || status === 'delivered' || status === 'completed';
              const current = index === stepIndex && !done;
              const reached = done || current;
              const time = timeFor(index);
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        { backgroundColor: done ? colors.success : current ? colors.primary : colors.border },
                      ]}
                    >
                      {done ? (
                        <IconSymbol name="checkmark" size={14} color={colors.textInverse} />
                      ) : current ? (
                        <View style={[styles.stepPulse, { backgroundColor: colors.textInverse }]} />
                      ) : null}
                    </View>
                    {index < STEPS.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: done ? colors.success : colors.border }]} />
                    )}
                  </View>
                  <View style={styles.stepBody}>
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: reached ? colors.text : colors.textSecondary,
                          fontWeight: current ? Typography.fontWeight.bold : Typography.fontWeight.semibold,
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={[styles.muted, { color: reached ? colors.textSecondary : colors.textTertiary }]}>
                      {step.description}
                    </Text>
                    {!!time && <Text style={[styles.stepTime, { color: colors.textTertiary }]}>{time}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items and bill */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Items ({order.items?.length || 0})
          </Text>
          {(order.items || []).map((item: any, index: number) => {
            const notAccepted = ['rejected', 'out_of_stock'].includes(item.itemStatus);
            const ordered = item.quantityOrdered;
            const accepted = item.quantityAccepted;
            return (
              <View
                key={item.id ?? index}
                style={[styles.itemRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}
              >
                <View style={[styles.qtyBadge, { backgroundColor: colors.primary + '14' }]}>
                  <Text style={[styles.qtyText, { color: colors.primary }]}>{ordered}×</Text>
                </View>
                <View style={styles.flex}>
                  <Text
                    style={[
                      styles.itemName,
                      { color: notAccepted ? colors.textTertiary : colors.text },
                      notAccepted && { textDecorationLine: 'line-through' },
                    ]}
                    numberOfLines={2}
                  >
                    {item.product?.name || 'Item'}
                  </Text>
                  {notAccepted ? (
                    <Badge label="Not available" tone="error" />
                  ) : (
                    accepted > 0 && accepted < ordered && <Badge label={`Only ${accepted} accepted`} tone="warning" />
                  )}
                </View>
                <Text style={[styles.itemPrice, { color: notAccepted ? colors.textTertiary : colors.text }]}>
                  {formatPrice(parseFloat(item.totalPrice || '0'))}
                </Text>
              </View>
            );
          })}

          <View style={[styles.billDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.billRow}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>Delivery</Text>
            <Text style={[styles.billValue, { color: order.deliveryCharge > 0 ? colors.text : colors.success }]}>
              {order.deliveryCharge > 0 ? formatPrice(order.deliveryCharge) : 'Free'}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(order.totalAmount)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>Payment</Text>
            <Badge label={paid ? 'Paid' : 'Pay on delivery'} tone={paid ? 'success' : 'warning'} />
          </View>
        </View>

        {!!order.specialInstructions && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery instructions</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{order.specialInstructions}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  bigEmoji: { fontSize: 52 },
  centeredTitle: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  centeredText: { fontSize: 14, textAlign: 'center' },
  button: { marginTop: 14, paddingVertical: 11, paddingHorizontal: 28, borderRadius: 14 },
  buttonText: { fontSize: 15, fontWeight: Typography.fontWeight.semibold },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: Typography.fontWeight.bold, marginBottom: 12 },
  overline: { fontSize: 11, fontWeight: Typography.fontWeight.semibold, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  storeActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  storeAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  storeActionText: { fontSize: 13, fontWeight: Typography.fontWeight.semibold },
  muted: { fontSize: 12, lineHeight: 17 },
  hero: { alignItems: 'center', borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 12 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 20, fontWeight: Typography.fontWeight.bold, textAlign: 'center' },
  heroText: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  progressTrack: { alignSelf: 'stretch', height: 6, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  otpCard: { borderRadius: 18, borderWidth: 1.5, padding: 18, alignItems: 'center', marginBottom: 12 },
  otpTitle: { fontSize: 15, fontWeight: Typography.fontWeight.bold, textAlign: 'center', marginBottom: 14 },
  otpDigits: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  otpBox: { width: 52, height: 60, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  otpDigit: { fontSize: 28, fontWeight: Typography.fontWeight.bold },
  otpHint: { fontSize: 12, textAlign: 'center' },
  warnCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  warnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  warnTitle: { fontSize: 15, fontWeight: Typography.fontWeight.bold },
  warnText: { fontSize: 12, marginBottom: 10 },
  warnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 5 },
  warnName: { flex: 1, fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  warnMeta: { fontSize: 12 },
  partnerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  partnerInitial: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  partnerName: { fontSize: 15, fontWeight: Typography.fontWeight.bold },
  callButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center', width: 26 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepPulse: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { width: 2, flex: 1, minHeight: 22, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: 18 },
  foldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepTitle: { fontSize: 14 },
  stepTime: { fontSize: 11, marginTop: 3 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  qtyBadge: { minWidth: 34, paddingVertical: 4, borderRadius: 8, alignItems: 'center' },
  qtyText: { fontSize: 12, fontWeight: Typography.fontWeight.bold },
  itemName: { fontSize: 14, fontWeight: Typography.fontWeight.medium, marginBottom: 2 },
  itemPrice: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  billDivider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  billValue: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  totalLabel: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  totalValue: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
});
