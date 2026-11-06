import { Text } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { StyleSheet, View } from 'react-native';

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Small pill for statuses and labels (e.g. "20% OFF", "Out of stock"). */
export function Badge({ label, tone = 'primary', solid = false }: { label: string; tone?: Tone; solid?: boolean }) {
  const colors = Colors[useAppColorScheme()];
  const color = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    neutral: colors.textSecondary,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: solid ? color : color + '1F' }]}>
      <Text style={[styles.text, { color: solid ? colors.textInverse : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 10, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.3 },
});
