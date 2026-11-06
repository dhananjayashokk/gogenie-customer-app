/**
 * Typography System for AiSupermart
 * Consistent font styles across the app
 */

export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    mono: 'SpaceMono',
  },
  
  // Font Sizes
  fontSize: {
    xs: 11,      // Captions, labels
    sm: 13,      // Secondary text
    base: 15,    // Body text
    md: 17,      // Subheadings
    lg: 20,      // Headings
    xl: 24,      // Large headings
    xxl: 32,     // Display text
    xxxl: 40,    // Hero text
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
    loose: 2,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Predefined Text Styles
export const TextStyles = {
  // Headings
  h1: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.xxxl * Typography.lineHeight.tight,
  },
  h2: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.xxl * Typography.lineHeight.tight,
  },
  h3: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.normal,
  },
  h4: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.normal,
  },
  h5: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.relaxed,
  },
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  
  // Special Text
  caption: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  price: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  priceSmall: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  strikethrough: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    textDecorationLine: 'line-through' as const,
  },
};
/**
 * Poppins ships one file per weight, so the weight has to be baked into the family name
 * (React Native can't pick a weight from a custom family). Used by components/AppText.
 */
export function fontFamilyForWeight(weight?: string | number): string {
  switch (String(weight)) {
    case '700':
    case '800':
    case '900':
    case 'bold':
      return Typography.fontFamily.bold;
    case '600':
      return Typography.fontFamily.semibold;
    case '500':
      return Typography.fontFamily.medium;
    default:
      return Typography.fontFamily.regular;
  }
}
