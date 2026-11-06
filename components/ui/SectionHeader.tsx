import { Text } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { StyleSheet, View } from 'react-native';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = Colors[useAppColorScheme()];
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  subtitle: { fontSize: 13 },
});
