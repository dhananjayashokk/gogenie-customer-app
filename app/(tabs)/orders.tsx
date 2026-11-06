import { Text } from '@/components/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useCart } from '@/contexts/CartContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiService } from '@/services/api';
import { formatPrice } from '@/utils/product';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FINISHED = ['delivered', 'completed', 'rejected', 'cancelled'];
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

const STATUS: Record<string, { label: string; tone: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  pending: { label: 'Order placed', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'primary' },
  partially_accepted: { label: 'Confirmed', tone: 'primary' },
  preparing: { label: 'Preparing', tone: 'primary' },
  ready_to_dispatch: { label: 'Ready', tone: 'primary' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
  completed: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'error' },
  rejected: { label: 'Rejected', tone: 'error' },
};

interface OrderRow {
  id: number;
  orderNumber: string;
  storeName: string;
  date: string;
  status: string;
  total: number;
  paymentMethod?: string;
  deliverySlot?: string | null;
}

export default function OrdersScreen() {
  const colors = Colors[useAppColorScheme()];
  const { show: showToast } = useToast();
  const { state: cartState, addItem, updateQuantity, clearCart } = useCart();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  const fetchOrders = async (pageToLoad = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageToLoad === 1) setLoading(true);
      setError(null);

      const response = await ApiService.orders.getCustomerOrders({ page: pageToLoad, limit: 10, status: 'all' });
      const rows: OrderRow[] = (response.data || response.orders || []).map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        storeName: order.store?.name || 'Store',
        date: new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        }),
        status: String(order.orderStatus || 'pending').toLowerCase(),
        total: parseFloat(order.totalAmount || '0'),
        deliverySlot: order.deliverySlot,
      }));

      setOrders((previous) => (pageToLoad === 1 ? rows : [...previous, ...rows]));
      setPage(pageToLoad);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Put the items of a past order back in the cart
  const reorder = async (order: OrderRow) => {
    try {
      setReorderingId(order.id);
      const response = await ApiService.orders.getDeliveryOrderDetails(order.id);
      const details = response.data || response.order || response;

      const items = (details.items || [])
        .map((item: any) => {
          const rejected = ['rejected', 'out_of_stock'].includes(item.itemStatus);
          const quantity = rejected ? 0 : item.quantityAccepted > 0 ? item.quantityAccepted : item.quantityOrdered;
          return { item, quantity };
        })
        .filter(({ quantity }: any) => quantity > 0);

      if (items.length === 0) {
        showToast('There is nothing to reorder from this order', 'error');
        return;
      }

      // The cart holds one store at a time
      if (cartState.items.length > 0 && String(cartState.items[0].storeId) !== String(details.storeId)) clearCart();

      items.forEach(({ item, quantity }: any) => {
        addItem({
          id: item.storeProductId,
          name: item.product?.name || 'Product',
          price: parseFloat(item.storeProduct?.price || item.unitPrice || '0'),
          image: '',
          category: '',
          unit: 'piece',
          storeId: details.storeId,
          storeName: order.storeName,
        });
        updateQuantity(item.storeProductId, quantity);
      });

      showToast('Items added to your cart', 'success');
      router.push('/(tabs)/cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not reorder', 'error');
    } finally {
      setReorderingId(null);
    }
  };

  const visible = orders.filter((order) =>
    filter === 'all' ? true : filter === 'active' ? !FINISHED.includes(order.status) : FINISHED.includes(order.status)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        {FILTERS.map(({ key, label }) => {
          const selected = filter === key;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              onPress={() => setFilter(key)}
              style={[
                styles.chip,
                { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? colors.textInverse : colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(1, true)} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {loading &&
          [1, 2, 3].map((n) => (
            <View key={n} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider, gap: 10 }]}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="35%" height={12} />
              <Skeleton width="100%" height={36} radius={10} />
            </View>
          ))}

        {!loading && error && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load your orders</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => fetchOrders()}>
              <Text style={[styles.buttonText, { color: colors.textInverse }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && visible.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter === 'all' ? 'No orders yet' : filter === 'active' ? 'No active orders' : 'No past orders'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Your orders will show up here.</Text>
            {filter === 'all' && (
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)')}>
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>Start shopping</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading &&
          !error &&
          visible.map((order) => {
            const info = STATUS[order.status] || { label: order.status.replace(/_/g, ' '), tone: 'neutral' as const };
            const active = !FINISHED.includes(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/order/${order.id}`)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '1A' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{order.storeName[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>
                      {order.storeName}
                    </Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                      #{order.orderNumber} · {order.date}
                    </Text>
                  </View>
                  <Badge label={info.label} tone={info.tone} />
                </View>

                <View style={[styles.cardBottom, { borderTopColor: colors.divider }]}>
                  <Text style={[styles.total, { color: colors.text }]}>{formatPrice(order.total)}</Text>
                  {active ? (
                    <View style={styles.action}>
                      <Text style={[styles.actionText, { color: colors.primary }]}>Track order</Text>
                      <IconSymbol name="arrow.right" size={16} color={colors.primary} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={reorderingId === order.id}
                      onPress={() => reorder(order)}
                      style={[styles.reorder, { borderColor: colors.primary, opacity: reorderingId === order.id ? 0.6 : 1 }]}
                    >
                      <Text style={[styles.reorderText, { color: colors.primary }]}>
                        {reorderingId === order.id ? 'Adding…' : 'Reorder'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

        {!loading && !error && page < totalPages && (
          <TouchableOpacity style={styles.loadMore} onPress={() => fetchOrders(page + 1)} activeOpacity={0.7}>
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>Load older orders</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: Typography.fontWeight.semibold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 130 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  cardInfo: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: Typography.fontWeight.bold },
  meta: { fontSize: 12, marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  total: { fontSize: 16, fontWeight: Typography.fontWeight.bold },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  reorder: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  reorderText: { fontSize: 13, fontWeight: Typography.fontWeight.bold },
  loadMore: { alignItems: 'center', paddingVertical: 12 },
  loadMoreText: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32, gap: 6 },
  emptyEmoji: { fontSize: 48, marginBottom: 6 },
  emptyTitle: { fontSize: 17, fontWeight: Typography.fontWeight.bold },
  emptyText: { fontSize: 13, textAlign: 'center' },
  button: { marginTop: 14, paddingVertical: 11, paddingHorizontal: 26, borderRadius: 14 },
  buttonText: { fontSize: 14, fontWeight: Typography.fontWeight.semibold },
});
