import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { Text } from '@/components/AppText';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useTabBarHeight } from '@/contexts/TabBarHeightContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state: cartState } = useCart();
  const insets = useSafeAreaInsets();
  const { setHeight: reportTabBarHeight } = useTabBarHeight();

  // Animation values for each tab
  const animatedValues = useRef(
    state.routes.map((_, index) => new Animated.Value(state.index === index ? 1 : 0))
  ).current;

  // Animated indicator position
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate all tabs
    state.routes.forEach((_, index) => {
      Animated.timing(animatedValues[index], {
        toValue: state.index === index ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // Animate indicator
    const tabWidth = (width - Spacing.md * 2) / state.routes.filter(r => r.name !== 'explore').length;
    Animated.spring(indicatorPosition, {
      toValue: state.index * tabWidth + tabWidth / 2 - 20,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [state.index]);

  const getIconName = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'index':
        return focused ? 'house.fill' : 'house';
      case 'orders':
        return focused ? 'doc.text.fill' : 'doc.text';
      case 'cart':
        return focused ? 'bag.fill' : 'bag';
      case 'profile':
        return focused ? 'person.fill' : 'person';
      default:
        return 'circle';
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'orders':
        return 'Orders';
      case 'cart':
        return 'Cart';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View
      onLayout={(event) => reportTabBarHeight(event.nativeEvent.layout.height)}
      style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.divider,
        paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 5,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
          android: {
            elevation: 20,
          },
        }),
      },
    ]}>
      {/* Animated Active Indicator */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: indicatorPosition }],
          },
        ]}
      />

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          if (route.name === 'explore') return null; // Hide explore tab

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const isCart = route.name === 'cart';
          const hasCartItems = isCart && cartState.totalItems > 0;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [
                      {
                        scale: animatedValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                      {
                        translateY: animatedValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                  {isFocused && (
                    <Animated.View style={[
                      styles.iconBackground,
                      {
                        backgroundColor: colors.primary + '15',
                        opacity: animatedValues[index],
                        transform: [{
                          scale: animatedValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        }],
                      }
                    ]} />
                  )}
                  <Animated.View
                    style={{
                      transform: [{
                        scale: animatedValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      }],
                    }}
                  >
                    <IconSymbol
                      name={getIconName(route.name, isFocused)}
                      size={24}
                      color={isFocused ? colors.primary : colors.textTertiary}
                    />
                  </Animated.View>

                  {/* Cart Badge */}
                  {hasCartItems && (
                    <View style={[
                      styles.badge,
                      {
                        backgroundColor: colors.error,
                        borderColor: colors.surface,
                      },
                    ]}>
                      <Text style={[styles.badgeText, { color: colors.textInverse }]}>
                        {cartState.totalItems > 99 ? '99+' : cartState.totalItems}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Label */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? colors.primary : colors.textTertiary,
                      fontWeight: isFocused ? '600' : '500',
                    },
                  ]}
                >
                  {getTabLabel(route.name)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: Spacing.md,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 56,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    position: 'absolute',
    width: 48,
    height: 36,
    borderRadius: 18,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.2,
    fontFamily: Typography.fontFamily.regular,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 3,
  },
});