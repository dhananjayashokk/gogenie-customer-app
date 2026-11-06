import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useToast } from '@/contexts/ToastContext';
import { Text, TextInput } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedButton, ThemedCard } from '@/components/themed';
import { useAppColorScheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { Spacing, Layout } from '@/constants/Layout';
import { TextStyles, Typography } from '@/constants/Typography';
import { useState, useEffect, useRef } from 'react';

export default function OTPScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { show: showToast } = useToast();
  const { state, verifyOTP, sendOTP, clearPhoneNumber, getSampleCustomers, loginWithSampleCustomer } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sampleCustomers, setSampleCustomers] = useState<any[]>([]);
  const [showSamples, setShowSamples] = useState(true);
  const inputRefs = useRef<TextInput[]>([]);
  const isLoading = state.isLoading;

  // Fetch sample customers on component mount
  useEffect(() => {
    const fetchSamples = async () => {
      const result = await getSampleCustomers();
      if (result.success && result.customers) {
        setSampleCustomers(result.customers);
      }
    };
    fetchSamples();
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0 && !canResend) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft, canResend]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showToast('Please enter complete 6-digit OTP', 'error');
      return;
    }

    const result = await verifyOTP(otpString);
    
    if (result.success) {
      showToast('Login successful!', 'success');
      router.replace('/(tabs)');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleResendOTP = async () => {
    if (!state.phoneNumber) {
      showToast('Phone number not found. Please go back and try again.', 'error');
      return;
    }

    const result = await sendOTP(state.phoneNumber);
    
    if (result.success) {
      setTimeLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      showToast('A new verification code has been sent to your phone', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleSampleCustomerLogin = async (customer: any) => {
    const result = await loginWithSampleCustomer(customer);
    
    if (result.success) {
      showToast(`Welcome back, ${customer.name}!`, 'success');
      router.replace('/(tabs)');
    } else {
      showToast(result.message, 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return '#FFD700';
      case 'premium': return '#FF6B6B';
      case 'regular': return '#4ECDC4';
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          title=""
          onPress={() => router.back()}
          variant="ghost"
          leftIcon="arrow.left"
          size="sm"
          style={styles.backButton}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Verify Phone
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <View style={styles.content}>
        {/* Illustration */}
        <View style={[styles.illustrationContainer, { backgroundColor: colors.primary + '10' }]}>
          <IconSymbol name="message.fill" size={64} color={colors.primary} />
        </View>

        {/* Title and Description */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Enter verification code
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a 6-digit code to
          </Text>
          <Text style={[styles.phoneNumber, { color: colors.text }]}>
            {state.phoneNumber ? `+91 ${state.phoneNumber}` : '+91 XXXXXXXXXX'}
          </Text>
        </View>

        {/* OTP Input */}
        <ThemedCard style={styles.otpCard}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <ThemedButton
            title={isLoading ? "Verifying..." : "Verify OTP"}
            onPress={handleVerifyOTP}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.verifyButton}
          />
        </ThemedCard>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Didn't receive the code?
          </Text>
          
          {canResend ? (
            <ThemedButton
              title="Resend OTP"
              onPress={handleResendOTP}
              variant="ghost"
              size="sm"
            />
          ) : (
            <Text style={[styles.timerText, { color: colors.primary }]}>
              Resend in {formatTime(timeLeft)}
            </Text>
          )}
        </View>

        {/* Help Text */}
        <Text style={[styles.helpText, { color: colors.textTertiary }]}>
          Enter "123456" for demo purposes
        </Text>

        {/* Sample Customers Section */}
        {showSamples && sampleCustomers.length > 0 && (
          <View style={styles.sampleSection}>
            <View style={styles.sampleHeader}>
              <Text style={[styles.sampleTitle, { color: colors.text }]}>
                Quick Login (Demo)
              </Text>
              <TouchableOpacity onPress={() => setShowSamples(false)}>
                <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.sampleSubtitle, { color: colors.textSecondary }]}>
              Tap any customer below to login instantly
            </Text>

            <View style={styles.customersGrid}>
              {sampleCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[styles.customerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleSampleCustomerLogin(customer)}
                  disabled={isLoading}
                >
                  <View style={[styles.customerAvatar, { backgroundColor: getCustomerTypeColor(customer.customerType) + '20' }]}>
                    <Text style={[styles.customerAvatarText, { color: getCustomerTypeColor(customer.customerType) }]}>
                      {customer.avatar}
                    </Text>
                  </View>
                  
                  <View style={styles.customerInfo}>
                    <Text style={[styles.customerName, { color: colors.text }]}>
                      {customer.name}
                    </Text>
                    <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                      {customer.displayPhone}
                    </Text>
                    <View style={styles.customerMeta}>
                      <View style={[styles.customerTypeBadge, { backgroundColor: getCustomerTypeColor(customer.customerType) + '20' }]}>
                        <Text style={[styles.customerTypeText, { color: getCustomerTypeColor(customer.customerType) }]}>
                          {customer.customerType.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.customerPoints, { color: colors.primary }]}>
                        {customer.loyaltyPoints} pts
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xxxl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...TextStyles.h3,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  phoneNumber: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
  },
  otpCard: {
    marginBottom: Spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resendText: {
    ...TextStyles.body,
    marginBottom: Spacing.sm,
  },
  timerText: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  helpText: {
    ...TextStyles.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Sample customers styles
  sampleSection: {
    marginTop: Spacing.xxl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sampleTitle: {
    ...TextStyles.h4,
    fontWeight: Typography.fontWeight.semibold,
  },
  sampleSubtitle: {
    ...TextStyles.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  customersGrid: {
    gap: Spacing.md,
  },
  customerCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  customerAvatarText: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.bold,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TextStyles.bodyLarge,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  customerPhone: {
    ...TextStyles.bodySmall,
    marginBottom: Spacing.sm,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  customerTypeText: {
    ...TextStyles.caption,
    fontWeight: Typography.fontWeight.semibold,
  },
  customerPoints: {
    ...TextStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
});
