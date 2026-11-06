# AiSupermart Project Structure

## Directory Overview

```
gogenie-customer-app/
├── app/                        # Expo Router screens
│   ├── (auth)/                # Authentication flow
│   ├── (tabs)/                # Tab-based navigation
│   ├── store/                 # Store detail screens
│   ├── category/              # Category browsing
│   ├── product/               # Product details
│   ├── order/                 # Order management
│   └── _layout.tsx            # Root layout
├── components/                 # Reusable components
│   ├── cards/                 # Card components
│   ├── cart/                  # Cart-related components
│   ├── common/                # Shared components
│   ├── onboarding/           # Onboarding flow
│   └── themed/               # Theme-aware components
├── constants/                  # App constants
├── hooks/                      # Custom React hooks
├── contexts/                   # React contexts
├── data/                       # Mock data
├── utils/                      # Utility functions
├── assets/                     # Images, fonts
└── types/                      # TypeScript definitions
```

## Key Files

### Navigation Structure
- `app/_layout.tsx` - Root layout with theme provider
- `app/(tabs)/_layout.tsx` - Bottom tab navigation
- `app/(auth)/_layout.tsx` - Auth stack navigator

### Screen Files
- `app/(tabs)/index.tsx` - Home/Nearby stores
- `app/(tabs)/orders.tsx` - Order history
- `app/(tabs)/cart.tsx` - Shopping cart
- `app/(tabs)/profile.tsx` - User profile
- `app/(auth)/onboarding.tsx` - Welcome screens
- `app/(auth)/login.tsx` - Phone login
- `app/(auth)/otp.tsx` - OTP verification
- `app/store/[id].tsx` - Store details
- `app/category/[id].tsx` - Product listing
- `app/product/[id].tsx` - Product details
- `app/order/[id].tsx` - Order tracking

### Components Organization

#### Cards (`components/cards/`)
- `StoreCard.tsx` - Store display in home
- `ProductCard.tsx` - Product grid item
- `OrderCard.tsx` - Order history item
- `CategoryCard.tsx` - Category selection

#### Cart (`components/cart/`)
- `CartItem.tsx` - Individual cart item
- `CartSummary.tsx` - Price breakdown
- `CartFloatingBar.tsx` - Sticky bottom bar
- `QuantitySelector.tsx` - +/- controls

#### Common (`components/common/`)
- `SearchBar.tsx` - Search input
- `FilterChips.tsx` - Filter options
- `LoadingStates.tsx` - Skeleton loaders
- `EmptyState.tsx` - No data displays
- `ErrorBoundary.tsx` - Error handling

#### Themed (`components/themed/`)
- `ThemedView.tsx` - Theme-aware container
- `ThemedText.tsx` - Theme-aware text
- `ThemedCard.tsx` - Theme-aware card
- `ThemedButton.tsx` - Theme-aware button
- `ThemedInput.tsx` - Theme-aware input
- `ThemeToggle.tsx` - Theme switcher

### Configuration Files

#### Constants (`constants/`)
- `Colors.ts` - Theme colors
- `Typography.ts` - Font styles
- `Layout.ts` - Spacing, sizes
- `Shadows.ts` - Shadow styles
- `Config.ts` - App configuration

#### Hooks (`hooks/`)
- `useTheme.ts` - Theme management
- `useCart.ts` - Cart state
- `useAuth.ts` - Authentication
- `useLocation.ts` - User location
- `useApi.ts` - API calls (mock)

#### Contexts (`contexts/`)
- `ThemeContext.tsx` - Theme provider
- `CartContext.tsx` - Cart provider
- `AuthContext.tsx` - Auth provider
- `LocationContext.tsx` - Location provider

#### Data (`data/`)
- `mockStores.ts` - Store data
- `mockProducts.ts` - Product catalog
- `categories.ts` - Category list
- `mockOrders.ts` - Order history
- `mockOffers.ts` - Promotional offers

#### Utils (`utils/`)
- `storage.ts` - AsyncStorage helpers
- `formatters.ts` - Price, date formatting
- `validators.ts` - Input validation
- `themeHelpers.ts` - Theme utilities
- `navigation.ts` - Navigation helpers

#### Types (`types/`)
- `store.types.ts` - Store interfaces
- `product.types.ts` - Product interfaces
- `cart.types.ts` - Cart interfaces
- `user.types.ts` - User interfaces
- `order.types.ts` - Order interfaces
- `theme.types.ts` - Theme interfaces

## Data Flow

### State Management
1. **Global State** (Context API)
   - Theme (light/dark)
   - Authentication
   - Cart items
   - User location

2. **Local State** (Component)
   - Form inputs
   - Loading states
   - UI interactions

### Navigation Flow
```
App Launch
    ├── Splash Screen
    ├── Check Auth Status
    │   ├── Not Authenticated → Onboarding
    │   │   ├── Welcome Slides
    │   │   └── Login/Signup
    │   └── Authenticated → Home
    └── Main App
        ├── Home (Nearby Stores)
        ├── Store Details
        ├── Product Listing
        ├── Product Details
        ├── Cart
        ├── Checkout
        ├── Order Tracking
        └── Profile
```

## API Structure (Mock)

### Endpoints Pattern
- `GET /stores/nearby` - Nearby stores
- `GET /stores/:id` - Store details
- `GET /stores/:id/products` - Store products
- `GET /products/:id` - Product details
- `GET /categories` - All categories
- `POST /auth/login` - Phone login
- `POST /auth/verify` - OTP verify
- `GET /orders` - Order history
- `POST /orders` - Place order
- `GET /orders/:id` - Order details

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

## Build Configuration

### Environment Variables
- `API_BASE_URL` - Backend URL
- `MAP_API_KEY` - Maps API key
- `SENTRY_DSN` - Error tracking
- `ANALYTICS_ID` - Analytics

### Build Scripts
- `npm start` - Development
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Code linting

## Deployment

### iOS
- Requires Xcode 14+
- iOS 13+ support
- App Store guidelines

### Android
- Min SDK 21 (Android 5.0)
- Target SDK 33 (Android 13)
- Google Play guidelines

## Performance Optimization

### Code Splitting
- Lazy load heavy screens
- Dynamic imports for features
- Optimize bundle size

### Image Optimization
- Use appropriate formats
- Implement lazy loading
- Cache strategically

### State Optimization
- Minimize re-renders
- Use memo/callback
- Optimize context usage