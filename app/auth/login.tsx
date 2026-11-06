import { Text, TextInput } from '@/components/AppText';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiService } from '@/services/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  customerType: 'regular' | 'premium' | 'vip';
  loyaltyPoints: number;
}

const TYPE_ICON: Record<string, string> = { vip: '👑', premium: '⭐', regular: '👤' };

export default function LoginScreen() {
  const colors = Colors[useAppColorScheme()];
  const { show: showToast } = useToast();
  const { authenticateWithMobile, state } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [quickCustomers, setQuickCustomers] = useState<Customer[]>([]);
  const isLoading = state.isLoading;

  const isPhoneValid = /^\d{10}$/.test(phone);
  const canSubmit = isPhoneValid && (!isNewCustomer || name.trim().length > 0) && !isLoading;

  // Team quick access: customers that already exist in the database
  useEffect(() => {
    ApiService.customer
      .getDemoCustomers()
      .then((response: any) => setQuickCustomers(response.customers || []))
      .catch(() => setQuickCustomers([]));
  }, []);

  const submit = async () => {
    if (!canSubmit) return;
    // The backend asks for a name only when the number is new, so try without one first
    const result = await authenticateWithMobile(phone, isNewCustomer ? name.trim() : undefined);

    if (result.success) {
      showToast(result.message, 'success');
      router.replace('/(tabs)');
    } else if (!isNewCustomer && (result.message?.includes('new customer') || result.isNewCustomer)) {
      setIsNewCustomer(true);
      showToast('Welcome! Tell us your name to create your account', 'info');
    } else {
      showToast(result.message, 'error');
    }
  };

  const quickLogin = async (customer: Customer) => {
    const result = await authenticateWithMobile(customer.phone, customer.name);
    if (result.success) {
      showToast(`Welcome, ${customer.name}!`, 'success');
      router.replace('/(tabs)');
    } else {
      showToast(result.message || 'Could not log in as this customer', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 'padding' on Android as well: with edge-to-edge the window no longer resizes for the keyboard */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Text style={[styles.logoText, { color: colors.textInverse }]}>G</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>GoGenie</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Genie for Everyday Needs</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isNewCustomer ? 'Create your account' : 'Log in or sign up'}
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile number *</Text>
            <View style={[styles.phoneRow, { borderColor: phone && !isPhoneValid ? colors.error : colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.prefix, { color: colors.text, borderRightColor: colors.border }]}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={10}
                editable={!isNewCustomer && !isLoading}
                style={[styles.phoneInput, { color: colors.text }]}
              />
            </View>
            {phone.length > 0 && !isPhoneValid && (
              <Text style={[styles.error, { color: colors.error }]}>Mobile number must be exactly 10 digits</Text>
            )}

            {isNewCustomer && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Full name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  maxLength={60}
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                />
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canSubmit}
              onPress={submit}
              style={[styles.button, { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                  {isNewCustomer ? 'Create account & continue' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {isNewCustomer && (
              <TouchableOpacity
                onPress={() => {
                  setIsNewCustomer(false);
                  setName('');
                }}
                style={styles.back}
              >
                <Text style={[styles.backText, { color: colors.textSecondary }]}>Use a different number</Text>
              </TouchableOpacity>
            )}
          </View>

          {quickCustomers.length > 0 && !isNewCustomer && (
            <View style={styles.quick}>
              <View style={styles.quickDivider}>
                <View style={[styles.line, { backgroundColor: colors.divider }]} />
                <Text style={[styles.quickLabel, { color: colors.textTertiary }]}>QUICK ACCESS</Text>
                <View style={[styles.line, { backgroundColor: colors.divider }]} />
              </View>
              {quickCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  onPress={() => quickLogin(customer)}
                  style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '1A' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{customer.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.quickName, { color: colors.text }]} numberOfLines={1}>
                      {TYPE_ICON[customer.customerType] || '👤'} {customer.name}
                    </Text>
                    <Text style={[styles.quickMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {customer.phone.replace('+91', '+91 ')} · {customer.loyaltyPoints} points
                    </Text>
                  </View>
                  <View style={[styles.go, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.goText, { color: colors.textInverse }]}>Login</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 36, fontWeight: Typography.fontWeight.bold },
  brandName: { fontSize: 30, fontWeight: Typography.fontWeight.bold },
  tagline: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  title: { fontSize: 18, fontWeight: Typography.fontWeight.bold, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: Typography.fontWeight.semibold, marginBottom: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' },
  prefix: { paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontWeight: Typography.fontWeight.semibold, borderRightWidth: 1 },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  nameInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 12, marginTop: 6 },
  button: { marginTop: 20, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: Typography.fontWeight.semibold },
  back: { alignItems: 'center', marginTop: 14 },
  backText: { fontSize: 14, fontWeight: Typography.fontWeight.medium },
  quick: { marginTop: 24 },
  quickDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  line: { flex: 1, height: 1 },
  quickLabel: { fontSize: 11, fontWeight: Typography.fontWeight.bold, letterSpacing: 1 },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: Typography.fontWeight.bold },
  quickName: { fontSize: 15, fontWeight: Typography.fontWeight.semibold },
  quickMeta: { fontSize: 12, marginTop: 2 },
  go: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  goText: { fontSize: 13, fontWeight: Typography.fontWeight.bold },
});
