import StoreSearchBar from "@/components/StoreSearchBar";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { StickyCartBar } from "@/components/ui/StickyCartBar";
import { getCategoryIcon } from "@/utils/categoryIcon";
import { getProductImageUri } from "@/utils/product";
import { useToast } from "@/contexts/ToastContext";
import { Colors } from "@/constants/Colors";
import { Layout, Spacing } from "@/constants/Layout";
import { TextStyles, Typography } from "@/constants/Typography";
import { useCart } from "@/contexts/CartContext";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { simulateDataFetch, useRefresh } from "@/hooks/useRefresh";
import { ApiService } from "@/services/api";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const {
    state: cartState,
    addItem,
    updateQuantity,
    getItemQuantity,
  } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previouslyBoughtProducts, setPreviouslyBoughtProducts] = useState<
    any[]
  >([]);
  const [loadingPreviouslyBought, setLoadingPreviouslyBought] = useState(false);
  const [previouslyBoughtSortBy, setPreviouslyBoughtSortBy] = useState<
    "last_purchased" | "frequency" | "name"
  >("last_purchased");
  const [previouslyBoughtPage, setPreviouslyBoughtPage] = useState(1);
  const [previouslyBoughtTotal, setPreviouslyBoughtTotal] = useState(0);

  // Fetch products for this store
  useEffect(() => {
    if (id) {
      fetchStoreProducts();
    }
  }, [id]);

  // Fetch previously bought products when category is selected
  useEffect(() => {
    if (
      selectedCategory === "previously_bought" &&
      previouslyBoughtProducts.length === 0
    ) {
      fetchPreviouslyBought(1, previouslyBoughtSortBy);
    }
  }, [selectedCategory]);

  const fetchStoreProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await ApiService.products.getStoreProducts({
        storeId: parseInt(id as string),
        limit: 100,
      });

      if (response.products) {
        setProducts(response.products);
      }

      // Use categories directly from API response
      if (response.categories) {
        const categoriesWithIcons = response.categories.map(
          (category: any) => ({
            id: category.id,
            name: category.name,
            icon: getCategoryIcon(category.name),
          })
        );
        setCategories(categoriesWithIcons);
      }
    } catch (error) {
      console.error("Error fetching store products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch previously bought products
  const fetchPreviouslyBought = async (
    page = 1,
    sortBy = previouslyBoughtSortBy
  ) => {
    try {
      setLoadingPreviouslyBought(true);
      const response = await ApiService.products.getPreviouslyBought({
        storeId: parseInt(id as string),
        page,
        limit: 20,
        sortBy,
      });

      if (response.success && response.data) {

        // Transform the data to match our product format
        const transformedProducts = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.currentPrice,
          mrp: item.mrp,
          image_url: item.image,
          categoryName: item.category?.name,
          unit: item.hasVariants ? "variant" : "piece",
          brand: item.brand,
          isAvailable: item.isAvailable,
          // Purchase history data
          purchaseHistory: {
            lastPurchased: item.purchaseHistory.lastPurchased,
            totalQuantity: item.purchaseHistory.totalQuantity,
            purchaseCount: item.purchaseHistory.purchaseCount,
            avgPurchasePrice: item.avgPurchasePrice,
          },
          // Additional fields for UI
          isPreviouslyBought: true,
        }));

        if (page === 1) {
          setPreviouslyBoughtProducts(transformedProducts);
        } else {
          setPreviouslyBoughtProducts((prev) => [
            ...prev,
            ...transformedProducts,
          ]);
        }

        setPreviouslyBoughtTotal(
          response.pagination?.total || transformedProducts.length
        );
        setPreviouslyBoughtPage(page);
        setPreviouslyBoughtSortBy(sortBy);
      }
    } catch (error) {
      console.error("Error fetching previously bought products:", error);
    } finally {
      setLoadingPreviouslyBought(false);
    }
  };

  // Pull-to-refresh functionality
  const { refreshing, onRefresh } = useRefresh(async () => {
    await fetchStoreProducts();
    await simulateDataFetch(500);
  });

  // Real store details (name, location) from the stores API
  const [store, setStore] = useState<{ id: string; name: string; location?: string }>({
    id: id as string,
    name: "",
  });
  useEffect(() => {
    let cancelled = false;
    ApiService.stores
      .getAllStores()
      .then((response: any) => {
        const match = (response.stores || []).find((s: any) => String(s.id) === String(id));
        if (match && !cancelled) setStore({ id: id as string, name: match.name, location: match.location });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Filter products by category and search query
  const filteredProducts =
    selectedCategory === "previously_bought"
      ? previouslyBoughtProducts.filter((p) => {
          const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description &&
              p.description.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchesSearch;
        })
      : products.filter((p) => {
          const matchesCategory =
            selectedCategory === "all" || p.categoryName === selectedCategory;
          const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description &&
              p.description.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchesCategory && matchesSearch;
        });

  const storeCategories = [
    { id: "all", name: "All Items", icon: "🛒" },
    ...categories,
  ];

  // Debug: log the final categories array
  if (storeCategories.length !== categories.length + 1) {
  }

  const { show: showToast } = useToast();

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: getProductImageUri(product.image_url) || "",
      category: product.categoryName,
      unit: product.unit || "piece",
      storeId: store.id,
      storeName: store.name,
    });
    showToast(`${product.name} added to cart`, "success");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Search Bar or Regular Header */}
      {showSearch ? (
        <StoreSearchBar
          onSearch={(query) => setSearchQuery(query)}
          onClose={() => {
            setShowSearch(false);
            setSearchQuery('');
          }}
          placeholder="Search for atta, dal, coke and more"
        />
      ) : (
        <>
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.divider,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                try {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    // Fallback to home if no history
                    router.push("/(tabs)");
                  }
                } catch (error) {
                  console.error("Navigation error:", error);
                  router.push("/(tabs)");
                }
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {store.name || "Store"}
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              >
                {store.location || " "}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setShowSearch(true)}
            >
              <IconSymbol
                name="magnifyingglass"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Main Content Area with Fixed Sidebar Layout */}
      <View style={styles.mainContent}>
        {/* Categories Sidebar - Fixed */}
        <View
          style={[
            styles.categoriesSidebar,
            {
              backgroundColor: colors.surface,
              borderRightColor: colors.divider,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.categoriesList}
          >
            {/* Previously Bought Section */}
            <TouchableOpacity
              style={[
                styles.previouslyBoughtItem,
                {
                  borderLeftColor:
                    selectedCategory === "previously_bought"
                      ? colors.success
                      : "transparent",
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory("previously_bought")}
            >
              <View
                style={[
                  styles.previouslyBoughtIcon,
                  { backgroundColor: colors.success + "15" },
                ]}
              >
                <IconSymbol name="cart" size={18} color={colors.success} />
              </View>
              <Text
                style={[
                  styles.previouslyBoughtText,
                  {
                    color:
                      selectedCategory === "previously_bought"
                        ? colors.success
                        : colors.text,
                    fontWeight:
                      selectedCategory === "previously_bought"
                        ? Typography.fontWeight.semibold
                        : Typography.fontWeight.medium,
                  },
                ]}
              >
                Previously{"\n"}Bought
              </Text>
            </TouchableOpacity>

            {/* Category Items */}
            {loadingProducts ? (
              // Skeleton loader for categories
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <View
                    key={`skeleton-${item}`}
                    style={[
                      styles.categoryItemSkeleton,
                      { backgroundColor: colors.border + "40" },
                    ]}
                  />
                ))}
              </>
            ) : (
              storeCategories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryItem,
                    {
                      borderLeftColor:
                        selectedCategory === item.id ||
                        selectedCategory === item.name
                          ? colors.primary
                          : "transparent",
                      backgroundColor:
                        selectedCategory === item.id ||
                        selectedCategory === item.name
                          ? colors.primary + "12"
                          : "transparent",
                    },
                  ]}
                  onPress={() =>
                    setSelectedCategory(item.id === "all" ? "all" : item.name)
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          selectedCategory === item.id ||
                          selectedCategory === item.name
                            ? colors.primary + "15"
                            : colors.background,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      {
                        color:
                          selectedCategory === item.id ||
                          selectedCategory === item.name
                            ? colors.primary
                            : colors.textSecondary,
                        fontWeight:
                          selectedCategory === item.id ||
                          selectedCategory === item.name
                            ? Typography.fontWeight.semibold
                            : Typography.fontWeight.regular,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Products Area - Scrollable */}
        <View style={styles.productsContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <View style={styles.productsHeader}>
              <View style={styles.headerLeft}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {selectedCategory === "all"
                    ? "All Products"
                    : selectedCategory === "previously_bought"
                    ? "Previously Bought"
                    : selectedCategory}
                </Text>
                <Text
                  style={[styles.productCount, { color: colors.textSecondary }]}
                >
                  {filteredProducts.length} items
                </Text>
              </View>

              {/* Sorting dropdown for Previously Bought */}
              {selectedCategory === "previously_bought" && (
                <View style={styles.sortingContainer}>
                  <TouchableOpacity
                    style={[styles.sortButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Cycle through sort options
                      const sortOptions: Array<'last_purchased' | 'frequency' | 'name'> = ['last_purchased', 'frequency', 'name'];
                      const currentIndex = sortOptions.indexOf(previouslyBoughtSortBy);
                      const nextIndex = (currentIndex + 1) % sortOptions.length;
                      const nextSort = sortOptions[nextIndex];
                      fetchPreviouslyBought(1, nextSort);
                    }}
                  >
                    <IconSymbol name="arrow.up.arrow.down" size={14} color={colors.primary} />
                    <Text style={[styles.sortButtonText, { color: colors.primary }]}>
                      {previouslyBoughtSortBy === 'last_purchased' && 'Recent'}
                      {previouslyBoughtSortBy === 'frequency' && 'Most Bought'}
                      {previouslyBoughtSortBy === 'name' && 'A-Z'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {(selectedCategory === "previously_bought" ? loadingPreviouslyBought : loadingProducts) ? (
              <View style={styles.productsGrid}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <ProductCardSkeleton key={n} />
                ))}
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {selectedCategory === "previously_bought"
                    ? "No previously bought items found"
                    : "No products found in this category"}
                </Text>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={getItemQuantity(product.id)}
                    onPress={() => router.push(`/product/${product.id}`)}
                    onAdd={() => handleAddToCart(product)}
                    onChangeQuantity={(quantity) => updateQuantity(product.id, quantity)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <StickyCartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerSubtitle: {
    ...TextStyles.caption,
  },
  searchButton: {
    padding: Spacing.xs,
  },
  previouslyBoughtItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    minHeight: 70,
  },
  previouslyBoughtIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  previouslyBoughtText: {
    ...TextStyles.caption,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
    fontWeight: Typography.fontWeight.medium,
    maxWidth: 65,
  },
  // New Sidebar Layout Styles
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  categoriesSidebar: {
    width: 80,
    borderRightWidth: 1,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginHorizontal: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    minHeight: 70,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...TextStyles.caption,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
    maxWidth: 65,
  },
  categoryItemSkeleton: {
    height: 70,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    opacity: 0.3,
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productsScrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...TextStyles.h5,
    flex: 1,
  },
  productCount: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 100, // room for the sticky cart bar
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  deliveryText: {
    ...TextStyles.caption,
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorText: {
    ...TextStyles.bodyLarge,
    textAlign: "center",
    marginTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...TextStyles.body,
    textAlign: "center",
  },
  headerLeft: {
    flex: 1,
  },
  sortingContainer: {
    justifyContent: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sortButtonText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...TextStyles.body,
    textAlign: "center",
  },
});
