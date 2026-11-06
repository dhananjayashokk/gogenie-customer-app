import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Text as RNText } from 'react-native';
import { TextInput } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';

interface StoreSearchBarProps {
  onSearch?: (query: string) => void;
  onClose?: () => void;
  placeholder?: string;
}

export default function StoreSearchBar({ onSearch, onClose, placeholder = "Search for atta, dal, coke and more" }: StoreSearchBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [query, setQuery] = useState('');

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentWrapper}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: query.length > 0 ? colors.primary : colors.border,
          }
        ]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textTertiary} />

          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleTextChange}
            returnKeyType="search"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />

          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search results count */}
      {query.length > 0 && (
        <View style={styles.searchStats}>
          <RNText style={[styles.searchStatsText, { color: colors.textSecondary }]}>
            Searching for "{query}"
          </RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 20,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearButton: {
    padding: Spacing.xxs,
  },
  searchStats: {
    paddingTop: Spacing.sm,
  },
  searchStatsText: {
    ...TextStyles.caption,
    fontSize: 13,
  },
});