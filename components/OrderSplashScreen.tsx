import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { Text } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { Layout, Spacing } from '@/constants/Layout';
import { Typography, TextStyles } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface OrderSplashScreenProps {
  visible: boolean;
}

export default function OrderSplashScreen({ visible }: OrderSplashScreenProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [statusText, setStatusText] = useState('Processing your order...');

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Change status text over time
      const timer1 = setTimeout(() => {
        setStatusText('Confirming with store...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setStatusText('Preparing your order...');
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setStatusText('Processing your order...');
      };
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background + 'F5',
          opacity: fadeAnim,
        }
      ]}
    >
      <Animated.View
        style={[
          styles.splashCard,
          {
            backgroundColor: colors.surface,
            transform: [{ scale: scaleAnim }],
            ...Layout.shadow.xl
          }
        ]}
      >
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <IconSymbol name="cart.fill" size={48} color={colors.primary} />
        </View>

        {/* Loading Spinner */}
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />

        {/* Status Text */}
        <Text style={[styles.statusText, { color: colors.text }]}>
          {statusText}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This will just take a moment
        </Text>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {[1, 2, 3].map((dot) => (
            <Animated.View
              key={dot}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.primary,
                  opacity: fadeAnim,
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: Layout.borderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  spinner: {
    marginBottom: Spacing.xl,
  },
  statusText: {
    ...TextStyles.h5,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});