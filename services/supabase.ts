import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration (EXPO_PUBLIC_* values are baked in at build time: .env.local for dev, eas.json / EAS env for builds)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a custom storage adapter for web
const createWebStorage = () => {
  return {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    },
  };
};

// Use web storage for web platform, AsyncStorage for native
const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

// Create the Supabase client with platform-specific storage for session persistence.
// Without configuration there is no client: live order updates are skipped instead of crashing the app.
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: storage as any,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (!supabase) {
  console.warn('Supabase is not configured (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY): live order updates are disabled.');
}

// Realtime channel types
export type RealtimeOrderUpdate = {
  id: number;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: string;
  deliveryCharge: string;
  totalAmount: string;
  deliverySlot: string;
  specialInstructions: string;
  updatedAt: string;
};

// Helper function to subscribe to order updates
export const subscribeToOrder = (
  orderId: number,
  callback: (payload: any) => void
) => {
  if (!supabase) return null;

  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'online_orders',
        filter: `id=eq.${orderId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

// Helper function to unsubscribe from order updates
export const unsubscribeFromOrder = async (channel: any) => {
  if (supabase && channel) await supabase.removeChannel(channel);
};

export default supabase;
