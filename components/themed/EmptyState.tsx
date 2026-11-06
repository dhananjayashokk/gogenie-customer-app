import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedButton } from './ThemedButton';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { TextStyles } from '@/constants/Typography';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: any;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, style]}>
      <IconSymbol 
        name={icon} 
        size={64} 
        color={colors.textTertiary} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
      
      {actionLabel && onActionPress && (
        <ThemedButton
          title={actionLabel}
          onPress={onActionPress}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxxl * 2,
  },
  icon: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...TextStyles.h4,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  actionButton: {
    paddingHorizontal: Spacing.xxl,
  },
});