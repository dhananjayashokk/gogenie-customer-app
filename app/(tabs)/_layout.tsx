import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Text } from '@/components/AppText';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import CustomTabBar from '@/components/CustomTabBar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { TabBarHeightProvider } from '@/contexts/TabBarHeightContext';

export default function TabLayout() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state: cartState } = useCart();

  return (
    <TabBarHeightProvider>
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerTitle: '',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          headerTitle: '',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={Layout.tabBar.iconSize} 
              name={focused ? "house.fill" : "house"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={Layout.tabBar.iconSize} 
              name={focused ? "doc.text.fill" : "doc.text"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <IconSymbol 
                size={Layout.tabBar.iconSize} 
                name={focused ? "bag.fill" : "bag"} 
                color={color} 
              />
              {cartState.totalItems > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: colors.error,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: colors.background,
                }}>
                  <Text style={{
                    color: colors.textInverse,
                    fontSize: 12,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                    {cartState.totalItems > 99 ? '99+' : cartState.totalItems}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={Layout.tabBar.iconSize} 
              name={focused ? "person.fill" : "person"} 
              color={color} 
            />
          ),
        }}
      />
      {/* Hide the old explore tab */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // This hides the tab
        }}
      />
    </Tabs>
    </TabBarHeightProvider>
  );
}
