import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useTabBarHeight } from '@/contexts/TabBarHeightContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { ApiService } from '@/services/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/AppText';

// Orders that are finished one way or another are not "active"
const FINISHED_STATUSES = ['delivered', 'completed', 'rejected', 'cancelled'];
const POLL_MS = 15000;
const MAX_VISIBLE_ROWS = 3; // the expanded list shows this many orders at once; the rest scroll
const ROW_HEIGHT = 64;
const FALLBACK_TAB_BAR_HEIGHT = 90; // used until the floating tab bar has reported its measured height

// The order closest to arriving is the one worth showing first
const PROGRESS_RANK: Record<string, number> = {
  pending: 1, confirmed: 2, partially_accepted: 2, preparing: 3, ready_to_dispatch: 4, out_for_delivery: 5,
};

const STATUS_INFO: Record<string, { label: string; hint: string }> = {
  pending: { label: 'Order placed', hint: 'Waiting for the store to confirm' },
  confirmed: { label: 'Confirmed', hint: 'The store accepted your order' },
  partially_accepted: { label: 'Confirmed', hint: 'Some items are unavailable' },
  preparing: { label: 'Preparing', hint: 'The store is packing your order' },
  ready_to_dispatch: { label: 'Ready', hint: 'Waiting for a delivery partner' },
  out_for_delivery: { label: 'Out for delivery', hint: 'On the way to you' },
};

interface ActiveOrder {
  id: number;
  orderNumber: string;
  storeName: string;
  status: string;
}

/**
 * Pinned just above the bottom tab bar for orders that are still in progress.
 * - One active order: a card with its status and a Track button.
 * - Several: a narrow summary strip that expands (toggle) into the full list.
 * Renders nothing when there are none. `refreshKey` lets the parent trigger a reload (pull-to-refresh);
 * `onCountChange` lets the parent leave room for it.
 */
export default function ActiveOrders({
  refreshKey = 0,
  onCountChange,
}: {
  refreshKey?: number;
  onCountChange?: (count: number) => void;
}) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { height: measuredTabBarHeight } = useTabBarHeight();
  const tabBarHeight = measuredTabBarHeight || FALLBACK_TAB_BAR_HEIGHT;

  const statusColor = (status: string) => {
    switch (status) {
      case 'out_for_delivery': return colors.info;
      case 'pending': return colors.warning;
      default: return colors.primary;
    }
  };

  const infoFor = (status: string) =>
    STATUS_INFO[status] || { label: status.replace(/_/g, ' '), hint: '' };

  const load = useCallback(async () => {
    try {
      const response = await ApiService.orders.getCustomerOrders({ page: 1, limit: 20, status: 'all' });
      const list = response.data || response.orders || [];
      setOrders(
        list
          .map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            storeName: order.store?.name || 'Store',
            status: String(order.orderStatus || order.status?.current || 'pending').toLowerCase(),
          }))
          .filter((order: ActiveOrder) => !FINISHED_STATUSES.includes(order.status))
          .sort((a: ActiveOrder, b: ActiveOrder) => (PROGRESS_RANK[b.status] || 0) - (PROGRESS_RANK[a.status] || 0))
      );
    } catch {
      // Not logged in yet or a network blip: keep whatever we have, this card is optional
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load, refreshKey]);

  useEffect(() => {
    onCountChange?.(orders.length);
    if (orders.length <= 1) setExpanded(false);
  }, [orders.length]);

  if (orders.length === 0) return null;

  const first = orders[0];
  const firstColor = statusColor(first.status);

  const openOrder = (id: number) => router.push(`/order/${id}`);

  return (
    <View style={[styles.container, { bottom: tabBarHeight + Spacing.sm }]} pointerEvents="box-none">
      {orders.length === 1 ? (
        // Single active order: full card
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openOrder(first.id)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: firstColor, ...Layout.shadow.md }]}
        >
          <View style={[styles.dot, { backgroundColor: firstColor }]} />
          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {infoFor(first.status).label} · {first.storeName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {infoFor(first.status).hint ? `${infoFor(first.status).hint} · ` : ''}#{first.orderNumber}
            </Text>
          </View>
          <Text style={[styles.track, { color: firstColor }]}>Track</Text>
          <IconSymbol name="arrow.right" size={16} color={firstColor} />
        </TouchableOpacity>
      ) : (
        <>
          {/* Expanded list: every active order */}
          {expanded && (
            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, ...Layout.shadow.md }]}>
              <ScrollView
                style={{ maxHeight: ROW_HEIGHT * MAX_VISIBLE_ROWS }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={orders.length > MAX_VISIBLE_ROWS}
              >
              {orders.map((order, index) => {
                const color = statusColor(order.status);
                return (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.8}
                    onPress={() => openOrder(order.id)}
                    style={[
                      styles.row,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <View style={styles.body}>
                      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {infoFor(order.status).label} · {order.storeName}
                      </Text>
                      <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        #{order.orderNumber}
                      </Text>
                    </View>
                    <Text style={[styles.track, { color }]}>Track</Text>
                    <IconSymbol name="arrow.right" size={16} color={color} />
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            </View>
          )}

          {/* Narrow summary strip (toggle) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setExpanded((open) => !open)}
            style={[styles.strip, { backgroundColor: colors.surface, borderColor: firstColor, ...Layout.shadow.md }]}
          >
            <View style={[styles.countBadge, { backgroundColor: firstColor }]}>
              <Text style={[styles.countText, { color: colors.textInverse }]}>{orders.length}</Text>
            </View>
            <Text style={[styles.stripText, { color: colors.text }]} numberOfLines={1}>
              {orders.length} active orders · {expanded && orders.length > MAX_VISIBLE_ROWS ? `scroll for all ${orders.length}` : infoFor(first.status).label}
            </Text>
            <IconSymbol name={expanded ? 'chevron.down' : 'chevron.up'} size={20} color={firstColor} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 10,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },
  stripText: {
    flex: 1,
    fontSize: 13,
    fontWeight: Typography.fontWeight.semibold,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.semibold,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  track: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.semibold,
  },
});
