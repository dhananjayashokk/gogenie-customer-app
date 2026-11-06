import ActiveOrders from "@/components/ActiveOrders";
import { Text } from "@/components/AppText";
import ThemeToggle from "@/components/themed/ThemeToggle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StoreCard, StoreSummary } from "@/components/ui/StoreCard";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Layout";
import { Typography } from "@/constants/Typography";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { simulateDataFetch, useRefresh } from "@/hooks/useRefresh";
import { ApiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function HomeScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  useEffect(() => {
    loadUserData();
    fetchStores();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) setUser(JSON.parse(userStr));
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const response = await ApiService.stores.getAllStores();
      setStores(
        (response.stores || []).map((store: any) => ({
          id: store.id,
          name: store.name,
          location: store.location,
          address: store.address,
          phone: store.phone,
        }))
      );
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoadingStores(false);
    }
  };

  // Pull-to-refresh
  const { refreshing, onRefresh } = useRefresh(async () => {
    setOrdersRefreshKey((key) => key + 1);
    await Promise.all([fetchStores(), loadUserData(), simulateDataFetch(500)]);
  });

  const firstName = user?.name?.trim()?.split(" ")[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greetingLabel, { color: colors.textInverse + "CC" }]}>{greeting()}</Text>
            <Text style={[styles.greetingName, { color: colors.textInverse }]} numberOfLines={1}>
              {firstName ? `Hello, ${firstName}` : "Welcome"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
              <IconSymbol name="person.circle" size={30} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.tagline, { color: colors.textInverse + "E6" }]}>
          What would you like to order today?
        </Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          // leave room for the tab bar, and for the active-orders strip above it
          { paddingBottom: (Platform.OS === "web" ? 140 : 120) + (activeOrderCount > 0 ? 70 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <SectionHeader
          title="Stores near you"
          subtitle={stores.length > 0 ? `${stores.length} available` : undefined}
        />

        {loadingStores &&
          [1, 2, 3].map((n) => (
            <View key={n} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              <Skeleton width={56} height={56} radius={16} />
              <View style={styles.skeletonBody}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
                <Skeleton width="80%" height={12} />
              </View>
            </View>
          ))}

        {!loadingStores &&
          stores.map((store) => <StoreCard key={store.id} store={store} onPress={() => router.push(`/store/${store.id}`)} />)}

        {!loadingStores && stores.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No stores available yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Pull down to refresh, or check back soon.</Text>
          </View>
        )}
      </ScrollView>

      {/* Orders in progress: pinned just above the bottom tab bar */}
      <ActiveOrders refreshKey={ordersRefreshKey} onCountChange={setActiveOrderCount} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingBlock: { flex: 1, marginRight: Spacing.md },
  greetingLabel: { fontSize: 13, fontWeight: Typography.fontWeight.medium },
  greetingName: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  headerActions: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  tagline: { marginTop: Spacing.md, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    gap: 14,
  },
  skeletonBody: { flex: 1, gap: 8 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 6 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontWeight: Typography.fontWeight.semibold },
  emptyText: { fontSize: 13, textAlign: "center" },
});
