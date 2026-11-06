import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInputProps, ViewStyle } from 'react-native';
import { TextInput, Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  isPassword?: boolean;
}

export function ThemedInput({
  label,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  isPassword = false,
  ...props
}: ThemedInputProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordIcon = isPassword;
  const actualRightIcon = showPasswordIcon 
    ? (isPasswordVisible ? 'eye.slash' : 'eye')
    : rightIcon;

  const handleRightIconPress = () => {
    if (showPasswordIcon) {
      setIsPasswordVisible(!isPasswordVisible);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error 
              ? colors.error 
              : isFocused 
              ? colors.primary 
              : colors.border,
            borderWidth: isFocused || error ? 2 : 1,
          },
        ]}
      >
        {leftIcon && (
          <IconSymbol
            name={leftIcon}
            size={20}
            color={colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              flex: 1,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />
        
        {actualRightIcon && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={actualRightIcon}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...TextStyles.body,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.input.borderRadius,
    paddingHorizontal: Layout.input.paddingHorizontal,
    height: Layout.input.height,
  },
  input: {
    ...TextStyles.body,
    height: '100%',
    paddingVertical: 0, // Remove default padding on Android
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  rightIcon: {
    marginLeft: Spacing.md,
    padding: Spacing.xs,
  },
  errorText: {
    ...TextStyles.caption,
    marginTop: Spacing.xs,
  },
});