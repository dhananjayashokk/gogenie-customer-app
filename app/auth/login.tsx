import { Colors } from "@/constants/Colors";
import { useToast } from '@/contexts/ToastContext';
import { Spacing } from "@/constants/Layout";
import { TextStyles } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { ApiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  customerType: "regular" | "premium" | "vip";
  loyaltyPoints: number;
}

export default function LoginScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { show: showToast } = useToast();
  const { authenticateWithMobile, state } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [demoCustomers, setDemoCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showDemoSection, setShowDemoSection] = useState(true);
  const isLoading = state.isLoading;

  // Fetch actual customers from database
  useEffect(() => {
    fetchDemoCustomers();
  }, []);

  const fetchDemoCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await ApiService.customer.getDemoCustomers();
      setDemoCustomers(response.customers || []);
    } catch (error) {
      console.error("Error fetching demo customers:", error);
      // Fallback to empty array if fetch fails
      setDemoCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleDemoLogin = async (customer: Customer) => {
    try {
      // Use the new mobile auth with the demo customer's phone number and name
      const result = await authenticateWithMobile(
        customer.phone,
        customer.name
      );

      if (result.success) {
        showToast(`Welcome, ${customer.name}!`, 'success');
        router.replace("/(tabs)");
      } else {
        // Fallback to old demo login method if API fails
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: customer.id.toString(),
            name: customer.name,
            phone: customer.phone,
            email: customer.email || "",
            customerType: customer.customerType,
            loyaltyPoints: customer.loyaltyPoints,
            isDemo: true,
          })
        );

        await AsyncStorage.setItem("accessToken", `demo_token_${customer.id}`);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Error during demo login:", error);
      showToast("Failed to login with demo customer", 'error');
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case "vip":
        return "#FFD700";
      case "premium":
        return "#E6E6FA";
      default:
        return colors.textSecondary;
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case "vip":
        return "👑";
      case "premium":
        return "⭐";
      default:
        return "👤";
    }
  };

  const handleMobileAuth = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast("Please enter a valid phone number", 'error');
      return;
    }

    // First try without name to see if customer exists
    if (!showNameField) {
      const result = await authenticateWithMobile(phoneNumber);

      if (result.success) {
        showToast(result.message, 'success');
        router.replace("/(tabs)");
      } else if (
        result.message?.includes("new customer") ||
        result.isNewCustomer
      ) {
        // Customer doesn't exist, show name field
        setShowNameField(true);
        showToast("Please provide your name to create an account", 'info');
      } else {
        showToast(result.message, 'error');
      }
    } else {
      // Try with name for new customer
      if (!customerName.trim()) {
        showToast("Please enter your name", 'error');
        return;
      }

      const result = await authenticateWithMobile(
        phoneNumber,
        customerName.trim()
      );

      if (result.success) {
        showToast(result.message, 'success');
        router.replace("/(tabs)");
      } else {
        showToast(result.message, 'error');
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    showToast(`${provider} login integration would be implemented here`, 'info');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>GoGenie</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your Genie for Everyday Needs
          </Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Your Genie Awaits!
          </Text>
          {/* <Text
            style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}
          >
            Enter your phone number and let the magic begin
          </Text> */}
        </View>

        {/* Login Form */}
        {/* <ThemedCard style={styles.loginCard}>
          <ThemedInput
            label="Phone Number"
            placeholder="Enter your 10-digit phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            leftIcon="phone"
          />

          {showNameField && (
            <ThemedInput
              label="Full Name"
              placeholder="Enter your full name"
              value={customerName}
              onChangeText={setCustomerName}
              leftIcon="person"
              style={{ marginTop: Spacing.md }}
            />
          )}

          <ThemedButton
            title={
              isLoading
                ? "Processing..."
                : showNameField
                ? "Create Account & Login"
                : "Login"
            }
            onPress={handleMobileAuth}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.otpButton}
          />

          {showNameField && (
            <ThemedButton
              title="Back"
              onPress={() => {
                setShowNameField(false);
                setCustomerName("");
              }}
              variant="ghost"
              size="sm"
              style={{ marginTop: Spacing.sm }}
            />
          )}

          <Text style={[styles.otpInfo, { color: colors.textTertiary }]}>
            {showNameField
              ? "We'll create your account and log you in instantly"
              : "We'll log you in instantly or ask for your name if you're new"}
          </Text>
        </ThemedCard> */}

        {/* Demo Customers Section */}
        <View
          style={{
            padding: 16,
            backgroundColor: "#f0f0f0",
            margin: 16,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#000",
              marginBottom: 12,
            }}
          >
            🎭 Demo Login - Actual Customers from Database
          </Text>
          <Text style={{ color: "#666", marginBottom: 16 }}>
            Click to login as any customer:
          </Text>

          {loadingCustomers ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>Loading customers...</Text>
            </View>
          ) : demoCustomers.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>No customers available</Text>
            </View>
          ) : (
            demoCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={{
                  backgroundColor: "#fff",
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#ddd",
                }}
                onPress={() => handleDemoLogin(customer)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#000",
                      flex: 1,
                    }}
                  >
                    {customer.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: getCustomerTypeColor(customer.customerType),
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      backgroundColor: "#f5f5f5",
                      borderRadius: 4,
                    }}
                  >
                    {getCustomerTypeIcon(customer.customerType)}{" "}
                    {customer.customerType.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {customer.phone.replace("+91", "+91 ")} •{" "}
                  {customer.loyaltyPoints} points
                </Text>
                {customer.email && (
                  <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {customer.email}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            By continuing, you agree to our{" "}
            <Text style={{ color: colors.primary }}>Terms of Service</Text> and{" "}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl * 2,
  },
  logo: {
    ...TextStyles.h1,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...TextStyles.body,
    textAlign: "center",
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  welcomeTitle: {
    ...TextStyles.h3,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    ...TextStyles.body,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  loginCard: {
    marginBottom: Spacing.xl,
  },
  otpButton: {
    marginTop: Spacing.md,
  },
  otpInfo: {
    ...TextStyles.caption,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...TextStyles.bodySmall,
    paddingHorizontal: Spacing.lg,
  },
  socialContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    borderWidth: 1.5,
  },
  guestButton: {
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: Spacing.xxxl,
  },
  footerText: {
    ...TextStyles.caption,
    textAlign: "center",
    lineHeight: 18,
  },

  // Demo Customers Styles
  demoSection: {
    marginBottom: Spacing.xl,
  },
  demoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  demoTitle: {
    ...TextStyles.h4,
    fontWeight: "600",
  },
  demoToggle: {
    ...TextStyles.h4,
    fontWeight: "bold",
  },
  demoContent: {
    paddingTop: Spacing.md,
  },
  demoSubtitle: {
    ...TextStyles.bodySmall,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  demoLoadingContainer: {
    gap: Spacing.sm,
  },
  demoSkeleton: {
    borderRadius: 12,
  },
  demoCustomersContainer: {
    gap: Spacing.sm,
  },
  demoCustomerCard: {
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  demoCustomerInfo: {
    flex: 1,
  },
  demoCustomerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  demoCustomerName: {
    ...TextStyles.bodyLarge,
    fontWeight: "600",
    flex: 1,
  },
  demoCustomerType: {
    ...TextStyles.caption,
    fontWeight: "700",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  demoCustomerPhone: {
    ...TextStyles.bodySmall,
    marginBottom: Spacing.xs,
  },
  demoCustomerPoints: {
    ...TextStyles.bodySmall,
    fontWeight: "600",
  },
});
