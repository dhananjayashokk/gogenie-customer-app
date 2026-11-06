import { ApiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  phoneNumber: string | null; // For OTP flow
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PHONE_NUMBER"; payload: string }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGOUT" }
  | { type: "RESTORE_USER"; payload: User | null };

interface AuthContextType {
  state: AuthState;
  authenticateWithMobile: (
    phone: string,
    name?: string
  ) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    isNewCustomer?: boolean;
  }>;
  logout: () => Promise<void>;
  /** Re-read the saved customer (used by pull-to-refresh on the profile screen) */
  refreshUser: () => Promise<void>;
  // Legacy methods - will be deprecated
  sendOTP: (
    phoneNumber: string
  ) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (
    otp: string
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  clearPhoneNumber: () => void;
  getSampleCustomers: () => Promise<{
    success: boolean;
    customers?: any[];
    message?: string;
  }>;
  loginWithSampleCustomer: (
    customer: any
  ) => Promise<{ success: boolean; message: string; user?: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_PHONE_NUMBER":
      return { ...state, phoneNumber: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        phoneNumber: null,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        phoneNumber: null,
      };

    case "RESTORE_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  phoneNumber: null,
};

// API Configuration - Use environment variable with fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Real API functions that connect to gogenie-retailer-portal backend
const sendOTPToBackend = async (
  phoneNumber: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Failed to send OTP" };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

const verifyOTPWithBackend = async (
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Failed to verify OTP" };
    }

    // Store access token for future API calls
    if (data.accessToken) {
      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("refreshToken", data.refreshToken);
    }

    const user: User = {
      id: data.customer.id.toString(),
      phoneNumber: data.customer.phone,
      name: data.customer.name,
      email: data.customer.email,
      createdAt: data.customer.createdAt,
    };

    return { success: true, message: data.message, user };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

const fetchSampleCustomers = async (): Promise<{
  success: boolean;
  customers?: any[];
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/sample-customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || "Failed to fetch sample customers",
      };
    }

    return { success: true, customers: data.customers };
  } catch (error) {
    console.error("Error fetching sample customers:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore user session on app start
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user: User = JSON.parse(userData);
          dispatch({ type: "RESTORE_USER", payload: user });
        } else {
          dispatch({ type: "RESTORE_USER", payload: null });
        }
      } catch (error) {
        console.error("Error restoring user:", error);
        dispatch({ type: "RESTORE_USER", payload: null });
      }
    };

    restoreUser();
  }, []);

  const sendOTP = async (
    phoneNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const result = await sendOTPToBackend(phoneNumber);

      if (result.success) {
        dispatch({ type: "SET_PHONE_NUMBER", payload: phoneNumber });
      }

      dispatch({ type: "SET_LOADING", payload: false });
      return result;
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
      };
    }
  };

  const verifyOTP = async (
    otp: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    if (!state.phoneNumber) {
      return {
        success: false,
        message: "Phone number not found. Please restart the login process.",
      };
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const result = await verifyOTPWithBackend(state.phoneNumber, otp);

      if (result.success && result.user) {
        // Save user data to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(result.user));
        dispatch({ type: "LOGIN_SUCCESS", payload: result.user });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }

      return result;
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      return {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
      dispatch({ type: "LOGOUT" });
      // Navigate to login page
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error during logout:", error);
      dispatch({ type: "LOGOUT" });
      // Navigate to login page even if there was an error
      router.replace("/auth/login");
    }
  };

  const clearPhoneNumber = () => {
    dispatch({ type: "SET_PHONE_NUMBER", payload: "" });
  };

  const authenticateWithMobile = async (
    phone: string,
    name?: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
    isNewCustomer?: boolean;
  }> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Format phone number - remove spaces and ensure it has country code
      let formattedPhone = phone.replace(/\s+/g, ""); // Remove all spaces

      // Add country code if not present
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.length === 10) {
          formattedPhone = "+91" + formattedPhone; // Default to India
        } else if (
          formattedPhone.length === 11 &&
          formattedPhone.startsWith("91")
        ) {
          formattedPhone = "+" + formattedPhone;
        }
      }

      const authData: { phone: string; name?: string } = {
        phone: formattedPhone,
      };
      if (name) {
        authData.name = name;
      }

      const response = await ApiService.customer.authenticateWithMobile(
        authData
      );

      if (response.success !== false && response.customer) {
        // Store access token if provided
        if (response.token) {
          await AsyncStorage.setItem("accessToken", response.token);
        }

        const user: User = {
          id: response.customer.id.toString(),
          phoneNumber: response.customer.phone,
          name: response.customer.name,
          email: response.customer.email,
          createdAt: response.customer.createdAt || new Date().toISOString(),
        };

        // Save user data to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(user));
        dispatch({ type: "LOGIN_SUCCESS", payload: user });

        return {
          success: true,
          message: response.isNewCustomer
            ? "Welcome! Account created successfully."
            : "Welcome back!",
          user,
          isNewCustomer: response.isNewCustomer,
        };
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
        const errorMessage =
          response.error || "Authentication failed. Please try again.";

        // Check if it's a new customer registration error
        const isNewCustomerError = errorMessage.includes(
          "Name is required for new customer"
        );

        return {
          success: false,
          message: isNewCustomerError ? "new customer" : errorMessage,
          isNewCustomer: isNewCustomerError,
        };
      }
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      console.error("Mobile auth error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please try again.",
      };
    }
  };

  const getSampleCustomers = async (): Promise<{
    success: boolean;
    customers?: any[];
    message?: string;
  }> => {
    return await fetchSampleCustomers();
  };

  const loginWithSampleCustomer = async (
    customer: any
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // First send OTP for the customer's phone number
      const otpResult = await sendOTPToBackend(customer.phone);

      if (!otpResult.success) {
        dispatch({ type: "SET_LOADING", payload: false });
        return { success: false, message: otpResult.message };
      }

      // Auto-verify with demo OTP "123456"
      const verifyResult = await verifyOTPWithBackend(customer.phone, "123456");

      if (verifyResult.success && verifyResult.user) {
        // Save user data to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(verifyResult.user));
        dispatch({ type: "LOGIN_SUCCESS", payload: verifyResult.user });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }

      return verifyResult;
    } catch (error) {
      dispatch({ type: "SET_LOADING", payload: false });
      return {
        success: false,
        message: "Failed to login with sample customer. Please try again.",
      };
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      dispatch({ type: "RESTORE_USER", payload: userData ? (JSON.parse(userData) as User) : null });
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value: AuthContextType = {
    state,
    authenticateWithMobile,
    logout,
    refreshUser,
    // Legacy methods - will be deprecated
    sendOTP,
    verifyOTP,
    clearPhoneNumber,
    getSampleCustomers,
    loginWithSampleCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
