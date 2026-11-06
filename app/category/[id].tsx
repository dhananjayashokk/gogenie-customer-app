import { StyleSheet, ScrollView, View, TouchableOpacity, Image, FlatList } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state: cartState, addItem, updateQuantity, getItemQuantity } = useCart();
  const [sortBy, setSortBy] = useState('popular');
  const [filterBy, setFilterBy] = useState('all');

  // Temporary category object - will be fetched from API
  const category = {
    id: id,
    name: 'Category',
    icon: '🛍️',
  };

  // Empty products array - will be fetched from API
  const categoryProducts: any[] = [];
  let filteredProducts = categoryProducts;

  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'price_low', label: 'Price: Low to High' },
    { id: 'price_high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Top Rated' },
  ];

  const filterOptions = [
    { id: 'all', label: 'All Items' },
    { id: 'discount', label: 'On Sale' },
    { id: 'instock', label: 'In Stock' },
  ];

  const handleAddToCart = (product: any) => {
    // Temporary store object
    const store = {
      id: '1',
      name: 'Store',
    };

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      unit: product.unit,
      storeId: store.id,
      storeName: store.name,
    });
  };

  const renderProduct = ({ item }: { item: any }) => {
    const quantity = getItemQuantity(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.surface }]}
        activeOpacity={0.8}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        
        {item.discount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.discount }]}>
            <Text style={[styles.discountText, { color: colors.textInverse }]}>
              {item.discount}% OFF
            </Text>
          </View>
        )}

        {!item.inStock && (
          <View style={[styles.outOfStockOverlay, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.outOfStockText, { color: colors.textInverse }]}>
              Out of Stock
            </Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          
          {item.brand && (
            <Text style={[styles.productBrand, { color: colors.textSecondary }]}>
              {item.brand}
            </Text>
          )}
          
          <Text style={[styles.productUnit, { color: colors.textSecondary }]}>
            {item.unit}
          </Text>
          
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={[styles.productPrice, { color: colors.text }]}>
                ₹{item.price}
              </Text>
              {item.originalPrice && (
                <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                  ₹{item.originalPrice}
                </Text>
              )}
            </View>
            
            {quantity === 0 ? (
              <TouchableOpacity 
                style={[
                  styles.addButton, 
                  { 
                    backgroundColor: item.inStock ? colors.primary : colors.border,
                  }
                ]}
                activeOpacity={0.8}
                disabled={!item.inStock}
                onPress={() => handleAddToCart(item)}
              >
                <IconSymbol 
                  name="plus" 
                  size={16} 
                  color={item.inStock ? colors.textInverse : colors.textTertiary} 
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.quantityButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateQuantity(item.id, quantity - 1)}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="minus" size={14} color={colors.textInverse} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityText, { color: colors.text }]}>
                  {quantity}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.quantityButton, { backgroundColor: colors.primary }]}
                  onPress={() => updateQuantity(item.id, quantity + 1)}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="plus" size={14} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {item.rating && (
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={12} color={colors.rating} />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {item.rating}
              </Text>
              {item.reviews && (
                <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>
                  ({item.reviews})
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChip = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: filterBy === item.id ? colors.primary : colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={() => setFilterBy(item.id)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: filterBy === item.id ? colors.textInverse : colors.text }
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
            <View style={styles.categoryTitleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {filteredProducts.length} products
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => {}}
        >
          <IconSymbol name="magnifyingglass" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Sort & Filter Bar */}
      <View style={[styles.sortFilterBar, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            // Would open sort modal in real app
          }}
        >
          <IconSymbol name="arrow.up.arrow.down" size={16} color={colors.text} />
          <Text style={[styles.sortButtonText, { color: colors.text }]}>
            Sort
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.separator, { backgroundColor: colors.divider }]} />
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // Would open filter modal in real app
          }}
        >
          <IconSymbol name="line.horizontal.3.decrease" size={16} color={colors.text} />
          <Text style={[styles.filterButtonText, { color: colors.text }]}>
            Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.productsContainer}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Products Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productsGrid}
              columnWrapperStyle={styles.productRow}
            />
          )}
        </View>
      </ScrollView>

      {/* Sticky Cart Summary Bar */}
      {cartState.totalItems > 0 && (
        <TouchableOpacity 
          style={[styles.cartSummaryBar, { 
            backgroundColor: colors.primary,
            ...Layout.shadow.lg 
          }]}
          activeOpacity={0.8}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.cartInfo}>
            <Text style={[styles.cartItemCount, { color: colors.textInverse }]}>
              {cartState.totalItems} item{cartState.totalItems !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.cartTotal, { color: colors.textInverse }]}>
              ₹{Math.round(cartState.totalAmount)}
            </Text>
          </View>
          
          <View style={styles.cartAction}>
            <Text style={[styles.cartActionText, { color: colors.textInverse }]}>
              View Cart
            </Text>
            <IconSymbol name="arrow.right" size={16} color={colors.textInverse} />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  categoryTitleContainer: {
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
  filtersContainer: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersList: {
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterChipText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
  sortFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortButtonText: {
    ...TextStyles.body,
    marginLeft: Spacing.sm,
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: Spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterButtonText: {
    ...TextStyles.body,
    marginLeft: Spacing.sm,
  },
  productsContainer: {
    padding: Spacing.lg,
    paddingBottom: 100, // Account for cart bar
  },
  productsGrid: {
    gap: Spacing.md,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    borderRadius: Layout.productCard.borderRadius,
    padding: Layout.productCard.padding,
    marginBottom: Spacing.md,
    ...Layout.shadow.sm,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: Layout.productCard.imageHeight,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.sm,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.xs,
    zIndex: 1,
  },
  discountText: {
    ...TextStyles.caption,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    bottom: 0,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  outOfStockText: {
    ...TextStyles.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...TextStyles.body,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xxs,
    minHeight: 40,
  },
  productBrand: {
    ...TextStyles.caption,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xxs,
  },
  productUnit: {
    ...TextStyles.caption,
    marginBottom: Spacing.sm,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    ...TextStyles.priceSmall,
  },
  originalPrice: {
    ...TextStyles.caption,
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    marginHorizontal: Spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TextStyles.caption,
    marginLeft: Spacing.xxs,
  },
  reviewsText: {
    ...TextStyles.caption,
    marginLeft: Spacing.xs,
  },
  cartSummaryBar: {
    position: 'absolute',
    bottom: Spacing.lg + 60, // Above tab bar
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemCount: {
    ...TextStyles.bodySmall,
  },
  cartTotal: {
    ...TextStyles.price,
  },
  cartAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartActionText: {
    ...TextStyles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyTitle: {
    ...TextStyles.h4,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
  },
  errorText: {
    ...TextStyles.bodyLarge,
    textAlign: 'center',
    marginTop: 100,
  },
});