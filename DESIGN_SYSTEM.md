# AiSupermart Design System

## Principles
1. **Clarity first** - clear hierarchy and readable type
2. **Honest data** - show only what the backend really knows (no invented ratings, fees or ETAs)
3. **Speed** - skeleton loaders, quick feedback on every tap
4. **Native feel** - spring press animations, haptics on add-to-cart
5. **Consistency** - one set of components and tokens across screens

## Colors (`constants/Colors.ts`, unchanged)
Kerala green palette with light/dark themes.

| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | `#2E7D32` | `#4CAF50` | CTAs, active states, ADD button |
| `secondary` | `#FF8A65` | `#FFAB91` | warm coral accents |
| `accent` | `#FFD54F` | `#FFE082` | highlights |
| `success / error / warning / info` | semantic | semantic | statuses, toasts, badges |

Always read colors from `Colors[useAppColorScheme()]`; do not hardcode hex values.

## Typography (`constants/Typography.ts`)
**Poppins** (400 / 500 / 600 / 700), loaded in `app/_layout.tsx`.
Import `Text` and `TextInput` from `@/components/AppText`, not from `react-native`: they pick the right Poppins file for the style's `fontWeight` (Poppins has one file per weight, so React Native cannot do this on its own).

## Shape and elevation
- Cards: radius 16, hairline border (`colors.divider`), soft shadow (`shadowOpacity` ~0.06)
- Buttons and steppers: radius 10; pills and badges: radius 8-20
- Spacing from `Spacing` in `constants/Layout.ts`

## Shared components (`components/ui/`)
| Component | Purpose |
|---|---|
| `ProductCard` | Product tile for 2-column grids: image, name, unit, price, ADD / stepper, out-of-stock state |
| `ProductImage` | Image with a category-emoji tile fallback (no more grey box) |
| `QuantityStepper` | ADD button that becomes `- n +`; haptic tap on native |
| `PriceTag` | Price with struck-through MRP |
| `Badge` | Status/label pill (`% OFF`, `Out of stock`) |
| `StoreCard` | Store row on the home screen (real fields only) |
| `StickyCartBar` | Slide-up bar with item count and total, opens the cart |
| `Skeleton`, `ProductCardSkeleton` | Loading placeholders |
| `SectionHeader` | Section title with optional subtitle |

`components/ActiveOrders.tsx` pins active orders above the tab bar (height measured via `contexts/TabBarHeightContext`).

## Feedback
Use `useToast()` from `@/contexts/ToastContext` for non-blocking messages. `Alert.alert` is reserved for real confirmation dialogs (it does nothing on web).

## Utilities (`utils/`)
`categoryIcon.ts` (emoji per category), `product.ts` (image URL, variant text, discount %, price formatting, "time ago").
