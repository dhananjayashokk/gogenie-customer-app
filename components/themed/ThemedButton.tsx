import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}: ThemedButtonProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const sizeStyles = {
    sm: Layout.buttonSmall,
    md: Layout.button,
    lg: Layout.buttonLarge,
  }[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? colors.border : colors.primary,
          color: colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? colors.border : colors.secondary,
          color: colors.textInverse,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? colors.border : colors.primary,
          color: disabled ? colors.textTertiary : colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: disabled ? colors.textTertiary : colors.primary,
        };
      default:
        return {
          backgroundColor: disabled ? colors.border : colors.primary,
          color: colors.textInverse,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const iconSize = {
    sm: sizeStyles.iconSize,
    md: sizeStyles.iconSize,
    lg: sizeStyles.iconSize,
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth || 0,
          width: fullWidth ? '100%' : undefined,
          opacity: (disabled || loading) ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.color} 
        />
      ) : (
        <>
          {leftIcon && (
            <IconSymbol 
              name={leftIcon} 
              size={iconSize} 
              color={variantStyles.color} 
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              TextStyles.button,
              { color: variantStyles.color },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && (
            <IconSymbol 
              name={rightIcon} 
              size={iconSize} 
              color={variantStyles.color} 
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});