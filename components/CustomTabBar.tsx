import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useCart } from '@/contexts/CartContext';
import { useTabBarHeight } from '@/contexts/TabBarHeightContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: Record<string, { label: string; icon: string; iconFocused: string }> = {
  index: { label: 'Home', icon: 'house', iconFocused: 'house.fill' },
  orders: { label: 'Orders', icon: 'doc.text', iconFocused: 'doc.text.fill' },
  cart: { label: 'Cart', icon: 'cart', iconFocused: 'cart.fill' },
  profile: { label: 'Profile', icon: 'person', iconFocused: 'person.fill' },
};

/** One tab: the active one gets a tinted pill behind its icon that springs in. */
function TabItem({
  routeName,
  focused,
  badge,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  routeName: string;
  focused: boolean;
  badge: number;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
}) {
  const colors = Colors[useAppColorScheme()];
  const tab = TABS[routeName] ?? { label: routeName, icon: 'circle', iconFocused: 'circle' };
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
  }, [focused, progress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel || tab.label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      <View style={styles.iconSlot}>
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: colors.primary + '1F',
              opacity: progress,
              transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
            },
          ]}
        />
        <Animated.View
          style={{ transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}
        >
          <IconSymbol
            name={(focused ? tab.iconFocused : tab.icon) as any}
            size={24}
            color={focused ? colors.primary : colors.textTertiary}
          />
        </Animated.View>

        {badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.textInverse }]}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused ? colors.primary : colors.textTertiary,
            fontWeight: focused ? Typography.fontWeight.semibold : Typography.fontWeight.medium,
          },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = Colors[useAppColorScheme()];
  const insets = useSafeAreaInsets();
  const { state: cartState } = useCart();
  const { setHeight: reportTabBarHeight } = useTabBarHeight();

  return (
    <View
      // screens pin things (cart button, active-orders strip) just above the bar, so report the real height
      onLayout={(event) => reportTabBarHeight(event.nativeEvent.layout.height)}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        if (route.name === 'explore') return null; // hidden tab

        const { options } = descriptors[route.key];
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            focused={focused}
            badge={route.name === 'cart' ? cartState.totalItems : 0}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  iconSlot: { width: 60, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', width: 60, height: 32, borderRadius: 16 },
  label: { fontSize: 11, marginTop: 3 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: Typography.fontWeight.bold },
});
