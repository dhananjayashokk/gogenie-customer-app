import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';

interface StoreFiltersBarProps {
  onFilterPress?: () => void;
  onSortPress?: () => void;
  onBrandPress?: () => void;
  selectedBrand?: string;
}

export default function StoreFiltersBar({
  onFilterPress,
  onSortPress,
  onBrandPress,
  selectedBrand,
}: StoreFiltersBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const filterButtons = [
    {
      label: 'Filters',
      icon: 'slider.horizontal.3',
      onPress: onFilterPress,
    },
    {
      label: 'Sort',
      icon: 'arrow.up.arrow.down',
      onPress: onSortPress,
    },
    {
      label: selectedBrand || 'Brand',
      icon: 'chevron.down',
      onPress: onBrandPress,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterButtons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={button.onPress}
            activeOpacity={0.7}
          >
            <IconSymbol name={button.icon} size={16} color={colors.text} />
            <Text style={[styles.filterButtonText, { color: colors.text }]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <TouchableOpacity
          style={[
            styles.nameButton,
            {
              backgroundColor: colors.warning + '20',
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.nameButtonText, { color: colors.text }]}>
            🥘 Namkeen
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  filterButtonText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Spacing.sm,
  },
  nameButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Layout.borderRadius.md,
  },
  nameButtonText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
});