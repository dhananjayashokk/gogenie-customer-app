import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';
interface ToastState { id: number; message: string; type: ToastType }

const ToastContext = createContext<{ show: (message: string, type?: ToastType) => void }>({ show: () => {} });

/** Non-blocking message at the top of the screen. Works the same on web and native (unlike Alert.alert). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = Colors[useAppColorScheme()];
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, type });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    Animated.spring(slide, { toValue: toast ? 1 : 0, useNativeDriver: true, bounciness: 4 }).start();
  }, [toast, slide]);

  const tone = toast?.type === 'success' ? colors.success : toast?.type === 'error' ? colors.error : colors.info;
  const icon = toast?.type === 'success' ? 'checkmark.circle' : toast?.type === 'error' ? 'exclamationmark.triangle.fill' : 'questionmark.circle';

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          { top: insets.top + 8, opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] },
        ]}
      >
        {toast && (
          <View style={[styles.toast, { backgroundColor: colors.surface, borderLeftColor: tone }]}>
            <IconSymbol name={icon as any} size={20} color={tone} />
            <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>{toast.message}</Text>
          </View>
        )}
      </Animated.View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, zIndex: 1000, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  message: { flexShrink: 1, fontSize: 13, fontWeight: Typography.fontWeight.medium },
});
