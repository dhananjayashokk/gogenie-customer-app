// Product helpers shared by the store, category and product screens.

/** Image URL from the API, normalised for local development; null when the product has none. */
export function getProductImageUri(imageUrl?: string | null): string | null {
  if (!imageUrl || imageUrl.trim() === '') return null;
  return imageUrl.replace('127.0.0.1', 'localhost');
}

/** "Size: 1kg • Pack: 2" style text for a product's variant, or null. */
export function formatVariantAttributes(product: any): string | null {
  if (product.formattedVariantAttributes) return product.formattedVariantAttributes;

  const details = product.variantCombination?.attributeDetails;
  if (Array.isArray(details)) {
    const attributes = details
      .map((attr: any) => (attr.optionName && attr.valueName ? `${attr.optionName}: ${attr.valueName}` : attr.valueName || attr.value))
      .filter(Boolean);
    return attributes.length > 0 ? attributes.join(' • ') : null;
  }
  return null;
}

/** Percent off when the MRP is higher than the selling price, otherwise 0. */
export function discountPercent(price: number, mrp?: number | null): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export const formatPrice = (value: number | string) => `₹${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)}`;

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", "4 months ago". */
export function timeAgo(dateString: string): string {
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
