// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation icons
  'house.fill': 'home',
  'house': 'home',
  'doc.text.fill': 'description',
  'doc.text': 'description',
  'bag.fill': 'shopping-bag',
  'bag': 'shopping-bag',
  'person.fill': 'person',
  'person': 'person',
  
  // Common icons used throughout the app
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'arrow.clockwise': 'refresh',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'plus': 'add',
  'minus': 'remove',
  'star': 'star-border',
  'star.fill': 'star',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'clock': 'access-time',
  'map': 'map',
  'phone': 'phone',
  'phone.fill': 'phone',
  'questionmark.circle': 'help',
  'magnifyingglass': 'search',
  'cart': 'shopping-cart',
  'cart.fill': 'shopping-cart',
  'location': 'location-on',
  'location.fill': 'location-on',
  'sun.max': 'wb-sunny',
  'moon': 'nightlight',
  'ellipsis.circle': 'more-horiz',
  'gear': 'settings',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'creditcard': 'credit-card',
  'exclamationmark.triangle.fill': 'warning',
  'arrow.right.square': 'logout',
  'shield': 'security',
  'circle': 'circle',
  'person.circle': 'account-circle',
  'building.2': 'business',
  'tag': 'local-offer',
  'tag.fill': 'local-offer',
  'list.bullet': 'list',
  'square.grid.2x2': 'grid-view',
  'slider.horizontal.3': 'tune',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  
  // Existing mappings
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
