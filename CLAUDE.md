# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
AiSupermart (package name: `gogenie-customer-app`) is an Indian supermarket aggregator mobile app built with React Native and Expo. It connects to a `gogenie-retailer-portal` backend API. The app supports phone number-based authentication (no OTP in primary flow — uses `authenticateWithMobile` which auto-registers or logs in).

## Commands
```bash
npm start          # Start Expo dev server (interactive)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
npm run lint       # Run ESLint (expo lint)
```

There are no automated tests in this project.

## Environment Setup
Copy `.env.example` to `.env` and fill in values:
- `EXPO_PUBLIC_API_URL` — base URL for the gogenie-retailer-portal backend (e.g. `http://localhost:3000/api`)
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase credentials (used in `services/supabase.ts`)

All `EXPO_PUBLIC_*` vars are inlined at build time and accessible via `process.env.EXPO_PUBLIC_*`.

## Architecture

### Navigation (expo-router file-based)
- `app/_layout.tsx` — root layout; wraps app in `ThemeProvider > AuthProvider > CartProvider`; conditionally renders auth stack vs main stack based on `AuthContext.state.isAuthenticated`
- `app/(tabs)/` — main tab navigator (Home, Orders, Cart, Profile); uses `CustomTabBar`
- `app/auth/` — login, OTP, onboarding screens (shown when unauthenticated)
- `app/store/[id].tsx`, `app/product/[id].tsx`, `app/category/[id].tsx`, `app/order/[id].tsx` — dynamic detail screens

### State Management (React Context)
Three contexts, all provided in root layout:

1. **`ThemeContext`** (`contexts/ThemeContext.tsx`) — manages `light`/`dark`/`system` preference. Use `useAppColorScheme()` to get the resolved `'light' | 'dark'` value. Theme preference is in-memory only (not persisted to AsyncStorage yet).

2. **`AuthContext`** (`contexts/AuthContext.tsx`) — manages auth state. Primary auth method is `authenticateWithMobile(phone, name?)` which calls `POST /customer/auth/mobile`. Persists user/tokens in AsyncStorage. Also has legacy `sendOTP`/`verifyOTP` methods (deprecated). On app start, restores session from AsyncStorage.

3. **`CartContext`** (`contexts/CartContext.tsx`) — manages cart items using `useReducer`. In-memory only (no persistence). Cart items carry `storeId`/`storeName` — cart is not scoped per-store in the reducer, so mixed-store carts are technically possible.

### API Layer (`services/api.ts`)
- `ApiService` — namespaced fetch wrappers for `stores`, `products`, `orders`, `customer` endpoints
- `GoGenieAPI` — higher-level helpers: `transformProductsForMobile()`, `getMobileProducts()`, `placeMobileOrder()`
- Auth header helper reads `accessToken` from AsyncStorage and injects `Authorization: Bearer` header
- Two base URL patterns: `API_BASE_URL` (e.g. `/api`) and `MOBILE_API_BASE_URL` (e.g. `/api/mobile`)

### Supabase Realtime (`services/supabase.ts`)
Used exclusively for live order status updates. The main REST API is the gogenie-retailer-portal backend; Supabase is only for realtime.
- `subscribeToOrder(orderId, callback)` — subscribes to `postgres_changes` on `online_orders` table filtered by `id`
- `unsubscribeFromOrder(channel)` — removes the channel
- Storage adapter is platform-aware: `AsyncStorage` on native, `localStorage` on web

### Constants
- `constants/Colors.ts` — full light/dark color tokens. Access via `Colors[colorScheme].tokenName`
- `constants/Layout.ts` — spacing (`Spacing`), layout dimensions (`Layout`), breakpoints, animation timings, z-index layers
- `constants/Typography.ts` — typography scale

### Components
- `components/themed/` — reusable themed components: `ThemedButton`, `ThemedCard`, `ThemedInput`, `ThemeToggle`, `EmptyState`, `LoadingStates`
- `components/ui/` — `IconSymbol` (SF Symbols on iOS, fallback on Android/web), `TabBarBackground`
- `components/CustomTabBar.tsx` — custom tab bar renderer
- `components/Loading.tsx` — full-screen loading component used during auth restore and font loading
- `components/ConfirmModal.tsx` — reusable confirmation dialog
- `components/OrderSplashScreen.tsx` — animated splash shown after order placement
- `components/StoreFiltersBar.tsx` — horizontal filter chips for store listing
- `components/StoreSearchBar.tsx` — search input for store discovery

### Hooks
- `hooks/useRefresh.ts` — `useRefresh(callback, minRefreshTime?)` wraps pull-to-refresh; enforces a minimum display duration (default 1000 ms) for the refresh indicator

## Theming Pattern
Every component that uses color should follow this pattern:
```tsx
const colorScheme = useAppColorScheme(); // from ThemeContext
const colors = Colors[colorScheme];
// use colors.primary, colors.background, etc.
```

## Auth Flow
1. App starts → `AuthContext` restores user from AsyncStorage
2. If not authenticated → auth stack shown (`auth/login` → `auth/onboarding` for new users)
3. `authenticateWithMobile(phone)` → if new customer, backend returns error message containing "Name is required for new customer" → redirect to onboarding to collect name → retry with name
4. On success → user saved to AsyncStorage, `isAuthenticated = true`, main tab navigator shown

## Releasing (EAS Build + EAS Update)
Builds and over-the-air updates are configured in `eas.json` (profiles `preview` = installable APK on channel `preview`, `production` = Play Store bundle on channel `production`) and `app.json` (`runtimeVersion: { policy: "appVersion" }`).

One-time setup (needs an Expo account):
```bash
npm i -g eas-cli && eas login
eas init                    # links this app to an Expo project (adds extra.eas.projectId)
eas update:configure        # adds updates.url
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key> --environment preview --visibility sensitive   # already done; also for production
eas build -p android --profile preview   # the one APK people install by hand
```

Every release after that (JS / UI / logic changes):
```bash
eas update --channel preview --message "what changed"
```
Installed apps check on launch and when reopened (`useOtaUpdate`), download the update and offer "Restart".

Native changes (new native library, permissions, icon/splash, Expo SDK upgrade): bump `version` in `app.json` (this changes the runtime version), then `eas build` again and reinstall. Updates published for the old version will not reach the new build and vice versa.

## Web Deployment
Configured for Vercel via `vercel.json`. Build command: `npx expo export --platform web` → outputs to `dist/`. All routes rewrite to `index.html` (SPA mode). The app uses React Native New Architecture (`newArchEnabled: true` in `app.json`).

## Design System
- Brand: Kerala Forest Green (`#2E7D32` light / `#4CAF50` dark)
- Secondary: Warm Coral (`#FF8A65` light)
- Accent: Bright Yellow (`#FFD54F` light)
- All prices in ₹ (Indian Rupees)
- Phone numbers use Indian format (+91 prefix, 10-digit numbers)
