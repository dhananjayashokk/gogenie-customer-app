import { Text } from '@/components/AppText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** "ADD" button that turns into a  − 1 +  stepper once the item is in the cart. */
export function QuantityStepper({
  quantity,
  onAdd,
  onChange,
}: {
  quantity: number;
  onAdd: () => void;
  onChange: (quantity: number) => void;
}) {
  const colors = Colors[useAppColorScheme()];

  if (quantity === 0) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { tap(); onAdd(); }}
        style={[styles.add, { borderColor: colors.primary, backgroundColor: colors.background }]}
      >
        <Text style={[styles.addText, { color: colors.primary }]}>ADD</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.stepper, { backgroundColor: colors.primary }]}>
      <TouchableOpacity hitSlop={8} onPress={() => { tap(); onChange(quantity - 1); }} style={styles.stepButton}>
        <IconSymbol name="minus" size={14} color={colors.textInverse} />
      </TouchableOpacity>
      <Text style={[styles.quantity, { color: colors.textInverse }]}>{quantity}</Text>
      <TouchableOpacity hitSlop={8} onPress={() => { tap(); onChange(quantity + 1); }} style={styles.stepButton}>
        <IconSymbol name="plus" size={14} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  add: { minWidth: 64, height: 32, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  addText: { fontSize: 13, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.5 },
  stepper: { height: 32, borderRadius: 10, flexDirection: 'row', alignItems: 'center', minWidth: 76 },
  stepButton: { width: 26, height: 32, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: Typography.fontWeight.bold },
});
