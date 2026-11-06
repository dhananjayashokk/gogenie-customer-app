import { StyleSheet, ScrollView, View, Dimensions, Image } from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedButton } from '@/components/themed';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { TextStyles } from '@/constants/Typography';
import { useState, useRef } from 'react';
import { FlatList } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onboardingData = [
    {
      id: '1',
      title: 'Your Wish, Our Command',
      subtitle: 'Discover everything you need, just like magic',
      description: 'From groceries to daily essentials, your genie grants every wish with ease',
      icon: '🧞‍♂️',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop&crop=center',
      color: colors.primary,
    },
    {
      id: '2',
      title: 'Lightning Fast Service',
      subtitle: 'Faster than you can rub the lamp',
      description: 'Skip the queues and enjoy instant delivery from your favorite stores',
      icon: '⚡',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=300&fit=crop&crop=center',
      color: colors.secondary,
    },
    {
      id: '3',
      title: 'Quality Guaranteed',
      subtitle: 'Premium products, magical experience',
      description: 'Fresh vegetables, dairy, and daily essentials delivered with genie-level care',
      icon: '✨',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop&crop=center',
      color: colors.accent,
    },
  ];

  const renderOnboardingItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.slide, { width: screenWidth }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.slideIcon}>{item.icon}</Text>
      </View>
      
      <Text style={[styles.slideTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      
      <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>
        {item.subtitle}
      </Text>
      
      <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/auth/login');
    }
  };

  const skip = () => {
    router.replace('/auth/login');
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.primary }]}>
          GoGenie
        </Text>
        <ThemedButton
          title="Skip"
          onPress={skip}
          variant="ghost"
          size="sm"
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.slidesList}
      />

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex 
                  ? colors.primary 
                  : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <ThemedButton
          title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          onPress={goToNext}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={currentIndex === onboardingData.length - 1 ? undefined : "arrow.right"}
        />
        
        <Text style={[styles.termsText, { color: colors.textTertiary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  logo: {
    ...TextStyles.h3,
    fontWeight: '700',
  },
  slidesList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  slideIcon: {
    fontSize: 64,
  },
  slideTitle: {
    ...TextStyles.h1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  slideSubtitle: {
    ...TextStyles.h5,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  slideDescription: {
    ...TextStyles.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  termsText: {
    ...TextStyles.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 16,
  },
});