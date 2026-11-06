import { StyleSheet, ScrollView, View, TouchableOpacity, Image, Platform, RefreshControl } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { ApiService } from '@/services/api';
import { useRefresh, simulateDataFetch } from '@/hooks/useRefresh';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state: cartState, addItem, updateQuantity, getItemQuantity } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch product details
  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // For now, create a temporary product object
      // TODO: Replace with actual API call when product detail endpoint is available
      setProduct({
        id: id,
        name: 'Product',
        price: 0,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
        category: 'General',
        unit: 'piece',
        description: 'Product details will be loaded from API',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh functionality
  const { refreshing, onRefresh } = useRefresh(async () => {
    await fetchProductDetails();
    await simulateDataFetch(500);
  });

  // Temporary store object
  const store = {
    id: '1',
    name: 'Store',
    logo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
    rating: 4.5,
    deliveryTime: '20-30 min',
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Product Not Found</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuantity = getItemQuantity(product.id);

  // Product images (for demo, using same image multiple times)
  const productImages = [
    product.image,
    product.image,
    product.image,
  ];

  const handleAddToCart = () => {
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

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      updateQuantity(product.id, 0);
    } else {
      updateQuantity(product.id, newQuantity);
    }
  };

  const discountedPrice = product.discount 
    ? product.price - (product.price * product.discount / 100)
    : product.price;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity 
          style={styles.shareButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="square.and.arrow.up" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / Layout.screen.width);
              setSelectedImageIndex(newIndex);
            }}
          >
            {productImages.map((imageUrl, index) => (
              <View key={index} style={styles.imageSlide}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.productImage}
                  resizeMode="contain"
                  {...Platform.select({
                    web: {
                      draggable: false,
                      onDragStart: (e: any) => e.preventDefault(),
                    },
                  })}
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Image indicators */}
          <View style={styles.imageIndicators}>
            {productImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === selectedImageIndex 
                      ? colors.primary 
                      : colors.border
                  }
                ]}
              />
            ))}
          </View>

          {/* Discount Badge */}
          {product.discount && (
            <View style={[styles.discountBadge, { backgroundColor: colors.discount }]}>
              <Text style={[styles.discountText, { color: colors.textInverse }]}>
                {product.discount}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.productInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>
          
          <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
            {product.category} • {product.unit}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={[styles.currentPrice, { color: colors.text }]}>
              ₹{discountedPrice.toFixed(2)}
            </Text>
            {product.discount && (
              <>
                <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                  ₹{product.price.toFixed(2)}
                </Text>
                <Text style={[styles.savingsText, { color: colors.success }]}>
                  Save ₹{(product.price - discountedPrice).toFixed(2)}
                </Text>
              </>
            )}
          </View>

          <Text style={[styles.productDescription, { color: colors.textSecondary }]}>
            Fresh and high-quality {product.name.toLowerCase()}. Perfect for your daily cooking needs. 
            Sourced directly from trusted suppliers to ensure the best quality and freshness.
          </Text>
        </View>

        {/* Store Info */}
        <View style={[styles.storeInfo, { backgroundColor: colors.surface }]}>
          <View style={styles.storeHeader}>
            <Image 
              source={{ uri: store.logo }} 
              style={styles.storeLogo}
              {...Platform.select({
                web: {
                  draggable: false,
                  onDragStart: (e: any) => e.preventDefault(),
                },
              })}
            />
            <View style={styles.storeDetails}>
              <Text style={[styles.storeName, { color: colors.text }]}>
                {store.name}
              </Text>
              <View style={styles.storeMetrics}>
                <View style={styles.ratingContainer}>
                  <IconSymbol name="star.fill" size={14} color={colors.rating} />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {store.rating}
                  </Text>
                </View>
                <Text style={[styles.deliveryTime, { color: colors.textSecondary }]}>
                  • {store.deliveryTime}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.viewStoreButton, { borderColor: colors.primary }]}
              onPress={() => router.push(`/store/${store.id}`)}
            >
              <Text style={[styles.viewStoreText, { color: colors.primary }]}>
                View Store
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutritional Info */}
        <View style={[styles.nutritionInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Product Details
          </Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Weight/Volume
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {product.unit}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Category
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                {product.category}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Storage
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                Cool & Dry Place
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                Shelf Life
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text }]}>
                7-10 Days
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { 
        backgroundColor: colors.background,
        borderTopColor: colors.divider 
      }]}>
        {currentQuantity === 0 ? (
          <TouchableOpacity
            style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToCart}
          >
            <IconSymbol name="cart" size={20} color={colors.textInverse} />
            <Text style={[styles.addToCartText, { color: colors.textInverse }]}>
              Add to Cart - ₹{discountedPrice.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityContainer}>
            <View style={styles.quantityInfo}>
              <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>
                In Cart
              </Text>
              <Text style={[styles.quantityTotal, { color: colors.text }]}>
                ₹{(discountedPrice * currentQuantity).toFixed(2)}
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }]}
                onPress={() => handleUpdateQuantity(currentQuantity - 1)}
              >
                <IconSymbol name="minus" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: colors.text }]}>
                {currentQuantity}
              </Text>
              <TouchableOpacity
                style={[styles.quantityButton, { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary 
                }]}
                onPress={() => handleUpdateQuantity(currentQuantity + 1)}
              >
                <IconSymbol name="plus" size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.xs, // Compensate for padding to align with edge
    borderRadius: Layout.borderRadius.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      },
    }),
  },
  headerTitle: {
    ...TextStyles.h5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  shareButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.xs, // Compensate for padding to align with edge
    borderRadius: Layout.borderRadius.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TextStyles.body,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  imageSlide: {
    width: Layout.screen?.width || 375,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  productImage: {
    width: '80%',
    height: '80%',
    ...Platform.select({
      web: {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitUserDrag: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: 'none',
      },
    }),
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing.xs,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
  discountText: {
    ...TextStyles.caption,
    fontWeight: Typography.fontWeight.bold,
  },
  productInfo: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.sm,
  },
  productName: {
    ...TextStyles.h4,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  productCategory: {
    ...TextStyles.body,
    marginBottom: Spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  currentPrice: {
    ...TextStyles.h5,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.md,
  },
  originalPrice: {
    ...TextStyles.body,
    textDecorationLine: 'line-through',
    marginRight: Spacing.sm,
  },
  savingsText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  productDescription: {
    ...TextStyles.body,
    lineHeight: 24,
  },
  storeInfo: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.sm,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Spacing.md,
    ...Platform.select({
      web: {
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitUserDrag: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: 'none',
      },
    }),
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  storeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TextStyles.caption,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  deliveryTime: {
    ...TextStyles.caption,
  },
  viewStoreButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.sm,
  },
  viewStoreText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  nutritionInfo: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.sm,
  },
  sectionTitle: {
    ...TextStyles.h6,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    width: '50%',
    marginBottom: Spacing.md,
  },
  nutritionLabel: {
    ...TextStyles.caption,
    marginBottom: Spacing.xs,
  },
  nutritionValue: {
    ...TextStyles.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    ...Layout.shadow.md,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  addToCartText: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityInfo: {
    flex: 1,
  },
  quantityLabel: {
    ...TextStyles.caption,
    marginBottom: Spacing.xs,
  },
  quantityTotal: {
    ...TextStyles.h6,
    fontWeight: Typography.fontWeight.bold,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
    marginHorizontal: Spacing.lg,
    minWidth: 30,
    textAlign: 'center',
  },
});