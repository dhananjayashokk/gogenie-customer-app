import AsyncStorage from "@react-native-async-storage/async-storage";

// API Configuration - Use environment variable with fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const MOBILE_API_BASE_URL = `${API_BASE_URL}/mobile`;

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
};

export const ApiService = {
  // Stores API
  stores: {
    // Get nearby stores
    getNearbyStores: async (
      latitude?: number,
      longitude?: number,
      radius = 10
    ) => {
      const params = new URLSearchParams();
      if (latitude) params.append("latitude", latitude.toString());
      if (longitude) params.append("longitude", longitude.toString());
      params.append("radius", radius.toString());

      const response = await fetch(`${MOBILE_API_BASE_URL}/stores?${params}`);
      return handleResponse(response);
    },

    // Get all stores for customer using gogenie-retailer-portal customer API
    getAllStores: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/customer/stores`, {
          method: "GET",
          headers: await getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return handleResponse(response);
      } catch (error) {
        console.error("Error fetching stores from customer API:", error);
        throw error;
      }
    },

    // Get specific store details
    getStoreDetails: async (storeId: number) => {
      const response = await fetch(`${MOBILE_API_BASE_URL}/stores/${storeId}`);
      return handleResponse(response);
    },
  },

  // Products API - Using existing POS endpoints
  products: {
    // Get products for a store (using POS API)
    getStoreProducts: async (params: {
      storeId?: number;
      search?: string;
      category?: string;
      barcode?: string;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params.storeId) searchParams.append("storeId", params.storeId.toString());
      if (params.search) searchParams.append("search", params.search);
      if (params.category && params.category !== "all")
        searchParams.append("category", params.category);
      if (params.barcode) searchParams.append("barcode", params.barcode);
      if (params.limit) searchParams.append("limit", params.limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/pos/products?${searchParams}`,
        {
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },

    // Get product categories (using mobile API)
    getCategories: async (storeId: number) => {
      const response = await fetch(
        `${MOBILE_API_BASE_URL}/products/categories?storeId=${storeId}`
      );
      return handleResponse(response);
    },

    // Search products by barcode
    searchByBarcode: async (barcode: string) => {
      const response = await fetch(
        `${API_BASE_URL}/pos/products?barcode=${barcode}`,
        {
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },

    // Get previously bought products for a customer in a store
    getPreviouslyBought: async (params: {
      storeId: number;
      page?: number;
      limit?: number;
      sortBy?: 'last_purchased' | 'frequency' | 'name';
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append("page", (params.page || 1).toString());
      searchParams.append("limit", (params.limit || 10).toString());
      searchParams.append("sortBy", params.sortBy || "last_purchased");

      const response = await fetch(
        `${API_BASE_URL}/customer/stores/${params.storeId}/purchased-products?${searchParams}`,
        {
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },
  },

  // Orders API - Using existing POS endpoints
  orders: {
    // Place order (using POS API)
    placeOrder: async (orderData: {
      items: Array<{
        productId: number;
        quantity: number;
        price?: number;
        discount?: number;
      }>;
      customerId?: number;
      customerInfo?: {
        name?: string;
        phone?: string;
        email?: string;
      };
      paymentMethod: string;
      totalAmount: number;
      taxAmount?: number;
      discountAmount?: number;
      notes?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/pos/orders`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(orderData),
      });
      return handleResponse(response);
    },

    // Place delivery order (new customer delivery API)
    placeDeliveryOrder: async (orderData: {
      storeId: number;
      items: Array<{
        storeProductId: number;
        quantity: number;
      }>;
      deliverySlot: string;
      specialInstructions?: string;
      paymentMethodId: number;
    }) => {
      const { storeId, ...body } = orderData;
      const response = await fetch(`${API_BASE_URL}/store/${storeId}/delivery/orders`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse(response);
    },

    // Get delivery order details (using customer orders API)
    getDeliveryOrderDetails: async (orderId: string | number) => {
      const response = await fetch(
        `${API_BASE_URL}/customer/orders/${orderId}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },

    // Get customer orders list
    getCustomerOrders: async (
      params: {
        page?: number;
        limit?: number;
        status?: string;
      } = {}
    ) => {
      const searchParams = new URLSearchParams();
      searchParams.append("page", (params.page || 1).toString());
      searchParams.append("limit", (params.limit || 10).toString());
      searchParams.append("status", params.status || "all");

      const response = await fetch(
        `${API_BASE_URL}/customer/orders?${searchParams}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },

    // Get customer's order history
    getOrderHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/pos/orders`, {
        headers: await getAuthHeaders(),
      });
      return handleResponse(response);
    },
  },

  // Customer API
  customer: {
    // Mobile authentication - register or login
    authenticateWithMobile: async (authData: {
      phone: string;
      name?: string; // Required only for new customers
    }) => {
      const response = await fetch(`${API_BASE_URL}/customer/auth/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authData),
      });
      return handleResponse(response);
    },

    // Update customer profile
    updateProfile: async (customerData: {
      name?: string;
      email?: string;
      address?: any;
    }) => {
      const response = await fetch(`${MOBILE_API_BASE_URL}/customer/profile`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify(customerData),
      });
      return handleResponse(response);
    },

    // Get customer profile
    getProfile: async () => {
      const response = await fetch(`${MOBILE_API_BASE_URL}/customer/profile`, {
        headers: await getAuthHeaders(),
      });
      return handleResponse(response);
    },

    // Get demo customers for login (no auth required for demo purposes)
    getDemoCustomers: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/pos/customers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // For demo purposes, we'll handle unauthorized responses gracefully
        if (response.status === 401) {
          // Return mock data if API is not accessible
          return {
            customers: [
              {
                id: 1,
                name: "Arjun Menon",
                phone: "+91-9876543210",
                email: "arjun.menon@email.com",
                customerType: "premium",
                loyaltyPoints: 456,
              },
            ],
          };
        }

        return handleResponse(response);
      } catch (error) {
        // Fallback to mock data if API is not reachable
        console.log("API not reachable, using mock data:", error);
        return {
          customers: [
            {
              id: 1,
              name: "Arjun Menon",
              phone: "+919876543210",
              email: "arjun.menon@email.com",
              customerType: "premium",
              loyaltyPoints: 456,
            },
            {
              id: 2,
              name: "Deepa Nair",
              phone: "+919876543211",
              email: "deepa.nair@email.com",
              customerType: "vip",
              loyaltyPoints: 892,
            },
            {
              id: 3,
              name: "Ravi Kumar",
              phone: "+919876543212",
              customerType: "regular",
              loyaltyPoints: 184,
            },
            {
              id: 4,
              name: "Priya Varma",
              phone: "+919876543213",
              email: "priya.varma@email.com",
              customerType: "vip",
              loyaltyPoints: 1568,
            },
            {
              id: 6,
              name: "Maya Pillai",
              phone: "+919876543215",
              email: "maya.pillai@email.com",
              customerType: "premium",
              loyaltyPoints: 234,
            },
          ],
        };
      }
    },
  },
};

// Helper functions for GoGenie mobile app
export const GoGenieAPI = {
  // Transform POS product data for mobile consumption
  transformProductsForMobile: (posResponse: any) => {
    if (!posResponse.products) return [];

    return posResponse.products.map((product: any) => ({
      id: product.id,
      productId: product.productId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      price: parseFloat(product.price),
      mrp: product.mrp ? parseFloat(product.mrp) : null,
      costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
      discount: product.mrp
        ? Math.round(
            ((parseFloat(product.mrp) - parseFloat(product.price)) /
              parseFloat(product.mrp)) *
              100
          )
        : 0,
      category: {
        id: product.categoryId,
        name: product.categoryName,
      },
      brand: {
        name: product.brandName,
      },
      images: product.variantCombination?.images || {
        primary:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
      },
      inventory: {
        available: Math.max(
          0,
          (product.availableQuantity || 0) - (product.reservedQuantity || 0)
        ),
        total: product.availableQuantity || 0,
        reserved: product.reservedQuantity || 0,
        inStock: (product.availableQuantity || 0) > 0,
      },
      variant: product.variantCombination
        ? {
            id: product.variantCombination.id,
            attributes: product.formattedVariantAttributes,
          }
        : null,
      unit: "piece",
    }));
  },

  // Get products for mobile app
  getMobileProducts: async (params: {
    search?: string;
    category?: string;
    limit?: number;
  }) => {
    const posResponse = await ApiService.products.getStoreProducts(params);
    return {
      ...posResponse,
      products: GoGenieAPI.transformProductsForMobile(posResponse),
    };
  },

  // Place order for mobile customer
  placeMobileOrder: async (params: {
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    paymentMethod: string;
    deliveryAddress?: any;
    notes?: string;
  }) => {
    // Get customer info from AsyncStorage
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      throw new Error("User not logged in");
    }

    // Calculate totals
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxAmount = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + taxAmount;

    const orderData = {
      items: params.items,
      customerId: parseInt(user.id),
      paymentMethod: params.paymentMethod,
      totalAmount,
      taxAmount,
      discountAmount: 0,
      notes: params.notes,
    };

    return ApiService.orders.placeOrder(orderData);
  },
};

export default ApiService;
