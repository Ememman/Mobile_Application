// app/api/apiClient.ts - COMPLETE FILE WITH UPDATED INTERFACE
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  total?: number;
  category?: string;
  data: T;
  user?: {
    _id?: string;
    role?: string;
    isLoggedIn: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  role: string;
  isGuest: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
  expiresIn?: string;
  instructions?: string;
  cooldownRemaining?: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  passwordStrength?: {
    strength: string;
    color: string;
    score: number;
  };
}

export interface Service {
  _id: string;
  name: string;
  duration: string;
  priceRange: string;
  rating: number;
  totalRaters: number;
  totalBookings: number;
  category: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  totalRaters: number;
  inStock: boolean;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;
  userId: string;
  serviceId: string;
  status: string;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  serviceName: string;
}

export interface Stylist {
  _id: string;
  username: string;
  position: string;
  rating?: number;
  reviewCount?: number;
  topRated?: boolean;
  profileImage?: string;
}

export interface Booking {
  _id: string;
  customer: string;
  service: string;
  stylistPreference: string;
  selectedStylist?: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  totalAmount: number;
  customerNotes?: string;
}

export interface CartItem {
  _id: string;
  userId: string;
  productId: Product | string;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  _id: string;
  userId: string;
  productId: Product;
  addedAt: string;
}

export interface UserBooking {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    category?: string;
    duration?: string;
    priceRange?: string;
  };
  customerName: string;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  selectedStylistId?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  cancelledAt?: string;
  completedAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  totalAmount?: number;
}

export interface Payment {
  _id: string;
  booking?: string;
  order?: string;
  customer: string;
  amount: number;
  paymentMethod: string;
  status: string;
  qrCode?: {
    data: string;
    imageUrl?: string;
    expiresAt: Date;
  };
  paymentReference: string;
  proofOfPayment?: {
    imageUrl: string;
    uploadedAt: Date;
  };
  processingNotes?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OrderItem {
  product: Product | string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  customer: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  deliveryInfo: {
    type: "pickup" | "delivery";
    address?: string;
    contactNumber: string;
    specialInstructions?: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment?: string;
  paymentStatus?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 🔔 UPDATED: Interface for ApiClient with notifyStaffBooking
export interface ApiClientInterface {
  // Password Reset
  forgotPassword: (emailOrPhone: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (
    token: string,
    newPassword: string,
    emailOrPhone: string,
  ) => Promise<ResetPasswordResponse>;

  // Profile Management
  updateProfile: (profileData: UpdateProfileData) => Promise<ApiResponse<User>>;
  changePassword: (
    passwordData: ChangePasswordData,
  ) => Promise<ApiResponse<{ message: string }>>;
  updateProfilePicture: (imageUri: string) => Promise<ApiResponse<User>>;

  // Authentication
  createGuestSession: () => Promise<AuthResponse>;
  getCurrentUser: () => Promise<{ success: boolean; user: User }>;
  getUserProfile: () => Promise<{ success: boolean; user: User }>;
  getUserFromStorage: () => Promise<User | null>;
  isAuthenticated: () => Promise<boolean>;
  login: (
    emailOrPhone: string,
    password: string,
    role: string,
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  convertGuestToUser: (
    userId: string,
    email: string,
    username: string,
    password: string,
    phoneNumber: string,
  ) => Promise<AuthResponse>;

  // Bookings
  getUserAppointments: () => Promise<ApiResponse<Appointment[]>>;
  getUserBookings: () => Promise<ApiResponse<UserBooking[]>>;
  cancelBooking: (bookingId: string) => Promise<ApiResponse<UserBooking>>;
  createBooking: (bookingData: {
    serviceId: string;
    stylistPreference: string;
    selectedStylistId?: string;
    preferredDate: string;
    preferredTime: string;
    customerNotes?: string;
  }) => Promise<ApiResponse<Booking>>;

  // 🔔 ADDED: Notify staff about new booking
  notifyStaffBooking: (bookingId: string) => Promise<any>;

  // Services
  getAllServices: (
    sortBy?: string,
    sortOrder?: string,
  ) => Promise<ApiResponse<Service[]>>;
  getServicesByCategory: (
    category: string,
    sortBy?: string,
    sortOrder?: string,
  ) => Promise<ApiResponse<Service[]>>;
  getServiceCategories: () => Promise<ApiResponse<string[]>>;
  getStylists: () => Promise<ApiResponse<Stylist[]>>;
  bookService: (serviceId: string) => Promise<ApiResponse<any>>;
  getAvailableTimeSlots: (
    date: string,
  ) => Promise<{ success: boolean; availableSlots: string[] }>;

  // Products
  getAllProducts: () => Promise<ApiResponse<Product[]>>;
  getProductsByCategory: (category: string) => Promise<ApiResponse<Product[]>>;
  getProductCategories: () => Promise<ApiResponse<string[]>>;

  // Payments
  createPayment: (paymentData: {
    bookingId?: string;
    orderId?: string;
    paymentMethod: string;
  }) => Promise<ApiResponse<Payment>>;
  uploadProofOfPayment: (
    paymentId: string,
    formData: FormData,
  ) => Promise<ApiResponse<any>>;
  getPaymentStatus: (paymentId: string) => Promise<ApiResponse<Payment>>;

  // Cart Functions
  getCart: () => Promise<ApiResponse<Cart>>;
  addToCart: (
    productId: string,
    quantity?: number,
  ) => Promise<ApiResponse<CartItem>>;
  updateCartItemQuantity: (
    cartItemId: string,
    quantity: number,
  ) => Promise<ApiResponse<CartItem>>;
  removeFromCart: (cartItemId: string) => Promise<ApiResponse<any>>;
  clearCart: () => Promise<ApiResponse<any>>;

  // Favorites Functions
  getFavorites: () => Promise<ApiResponse<FavoriteItem[]>>;
  addToFavorites: (productId: string) => Promise<ApiResponse<FavoriteItem>>;
  removeFromFavorites: (favoriteId: string) => Promise<ApiResponse<any>>;
  isFavorite: (productId: string) => Promise<{ isFavorite: boolean }>;

  // Order Functions
  createOrder: (orderData: {
    items: Array<{ productId: string; quantity: number }>;
    deliveryType: "pickup" | "delivery";
    deliveryAddress?: string;
    contactNumber: string;
    specialInstructions?: string;
    customerNotes?: string;
  }) => Promise<ApiResponse<Order>>;
  getOrders: () => Promise<ApiResponse<Order[]>>;
  getOrderById: (orderId: string) => Promise<ApiResponse<Order>>;
  cancelOrder: (
    orderId: string,
    cancellationReason?: string,
  ) => Promise<ApiResponse<Order>>;
  getOrderTracking: (orderId: string) => Promise<ApiResponse<any>>;
}

const API_BASE_URL = "https://sandrealeesalon.onrender.com/api";

const convertTimeTo24HourFormat = (timeString: string): string => {
  console.log("⏰ Converting time:", timeString);

  try {
    let time = timeString.trim().toUpperCase();
    time = time.replace(/\s+/g, " ");

    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return time;
    }

    const match = time.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
    if (!match) {
      console.warn("⚠️ Invalid time format, using default:", timeString);
      return "09:30";
    }

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3].toUpperCase();

    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    console.log("✅ Time converted:", timeString, "->", formattedTime);

    return formattedTime;
  } catch (error) {
    console.error("❌ Error converting time:", error);
    return "09:30";
  }
};

const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      console.log("🔑 Token retrieved:", token.substring(0, 30) + "...");
    } else {
      console.log("⚠️ No token found in storage");
    }
    return token;
  } catch (error) {
    console.error("❌ Error retrieving token:", error);
    return null;
  }
};

const handleApiResponse = async (response: Response) => {
  let data;
  const responseText = await response.text();

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    console.error("❌ Failed to parse API response:", parseError);
    console.log("📄 Raw response:", responseText);
    throw new Error("Invalid response from server");
  }

  console.log("📡 API Response:", {
    status: response.status,
    ok: response.ok,
    success: data.success,
    message: data.message,
    data: data.data ? "present" : "missing",
  });

  if (!response.ok) {
    console.error("❌ API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    if (response.status === 401 || response.status === 403) {
      console.warn("⚠️ Authentication failed. Clearing session...");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      throw new Error("Authentication failed. Please login again.");
    } else if (response.status === 400) {
      throw new Error(data.message || "Invalid request data");
    } else if (response.status === 500) {
      throw new Error(data.message || "Server error. Please try again later.");
    } else {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }
  }

  return data;
};

export const apiClient: ApiClientInterface = {
  // ==================== PASSWORD RESET ====================

  forgotPassword: async (
    emailOrPhone: string,
  ): Promise<ForgotPasswordResponse> => {
    try {
      console.log("🔐 Requesting password reset for:", emailOrPhone);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password reset request successful");
        return {
          success: true,
          message:
            data.message || "Password reset instructions sent successfully",
          resetToken: data.resetToken,
          expiresIn: data.expiresIn,
          instructions: data.instructions,
          cooldownRemaining: data.cooldownRemaining,
        };
      } else {
        console.error("❌ Password reset request failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to send password reset instructions",
        };
      }
    } catch (error: any) {
      console.error("❌ Error requesting password reset:", error.message);
      return {
        success: false,
        message: error.message || "Failed to process password reset request",
      };
    }
  },

  resetPassword: async (
    token: string,
    newPassword: string,
    emailOrPhone: string,
  ): Promise<ResetPasswordResponse> => {
    try {
      console.log("🔄 Resetting password...");

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          emailOrPhone,
        }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password reset successful");
        return {
          success: true,
          message: data.message || "Password reset successfully",
          passwordStrength: data.passwordStrength,
        };
      } else {
        console.error("❌ Password reset failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to reset password",
        };
      }
    } catch (error: any) {
      console.error("❌ Error resetting password:", error.message);
      return {
        success: false,
        message: error.message || "Failed to reset password",
      };
    }
  },

  // ==================== PROFILE MANAGEMENT ====================

  updateProfile: async (
    profileData: UpdateProfileData,
  ): Promise<ApiResponse<User>> => {
    try {
      console.log("👤 Updating user profile...");
      console.log("📤 Profile data:", JSON.stringify(profileData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      console.log("📥 Profile update response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Profile updated successfully:", data.user.username);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        return {
          success: true,
          data: data.user,
          message: data.message || "Profile updated successfully",
        };
      } else {
        console.error("❌ Profile update failed:", data.message);
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("❌ Error updating profile:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  changePassword: async (
    passwordData: ChangePasswordData,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log("🔒 Changing user password...");

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      console.log("📥 Password change response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password changed successfully");
        return {
          success: true,
          data: { message: data.message || "Password changed successfully" },
          message: data.message || "Password changed successfully",
        };
      } else {
        console.error("❌ Password change failed:", data.message);
        throw new Error(data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("❌ Error changing password:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  updateProfilePicture: async (
    imageUri: string,
  ): Promise<ApiResponse<User>> => {
    try {
      console.log("📸 Updating profile picture...");

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const formData = new FormData();
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `profile_${Date.now()}.${fileExtension}`;

      formData.append("profileImage", {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      console.log("📤 Uploading profile picture:", fileName);

      const response = await fetch(`${API_BASE_URL}/auth/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log(
        "📥 Profile picture upload response status:",
        response.status,
      );

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Profile picture updated successfully");
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("customProfileImage", imageUri);

        return {
          success: true,
          data: data.user,
          message: data.message || "Profile picture updated successfully",
        };
      } else {
        console.error("❌ Profile picture update failed:", data.message);
        await AsyncStorage.setItem("customProfileImage", imageUri);

        return {
          success: true,
          data: data.user,
          message: "Profile picture saved locally",
        };
      }
    } catch (error: any) {
      console.error("❌ Error updating profile picture:", error.message);
      console.error("Stack trace:", error.stack);

      try {
        await AsyncStorage.setItem("customProfileImage", imageUri);
        console.log("✅ Profile picture saved to AsyncStorage as fallback");
      } catch (storageError) {
        console.error("❌ Failed to save to AsyncStorage:", storageError);
      }

      throw error;
    }
  },

  // ==================== AUTHENTICATION ====================

  createGuestSession: async (): Promise<AuthResponse> => {
    try {
      console.log("🎭 Creating guest session...");

      const response = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await handleApiResponse(response);

      if (data.token) {
        console.log(
          "✅ Guest token received:",
          data.token.substring(0, 30) + "...",
        );
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        console.log("💾 Guest session saved to storage");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error creating guest session:", error.message);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    try {
      console.log("👤 Getting current user...");

      const token = await getToken();
      if (!token) {
        console.log("⚠️ No token available, creating guest session...");
        const guestData = await apiClient.createGuestSession();
        if (guestData.user) {
          return { success: true, user: guestData.user };
        }
        throw new Error("Failed to create guest session");
      }

      console.log("📡 Fetching user profile with token...");
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 404
      ) {
        console.warn(
          "⚠️ Token invalid or user not found. Creating new guest session...",
        );
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        const guestData = await apiClient.createGuestSession();
        if (guestData.user) {
          console.log("✅ Guest user created:", guestData.user.username);
          return { success: true, user: guestData.user };
        }

        throw new Error("Failed to create guest session");
      }

      const data = await handleApiResponse(response);

      if (data.user) {
        console.log(
          "✅ User profile retrieved:",
          data.user.username,
          "(Guest:",
          data.user.isGuest,
          ")",
        );
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user profile:", error.message);
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("404")
      ) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }
      throw error;
    }
  },

  getUserProfile: async (): Promise<{ success: boolean; user: User }> => {
    return await apiClient.getCurrentUser();
  },

  getUserFromStorage: async (): Promise<User | null> => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log(
          "📱 User from storage:",
          user.username,
          "(Guest:",
          user.isGuest,
          ")",
        );
        return user;
      }
      console.log("⚠️ No user in storage");
      return null;
    } catch (error: any) {
      console.error("❌ Error getting user from storage:", error.message);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getToken();
    const isAuth = !!token;
    console.log("🔐 Is authenticated:", isAuth);
    return isAuth;
  },

  login: async (
    emailOrPhone: string,
    password: string,
    role: string,
  ): Promise<AuthResponse> => {
    try {
      console.log("🔑 Attempting login for:", emailOrPhone, "Role:", role);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password, role }),
      });

      const data = await handleApiResponse(response);

      if (data.token) {
        console.log(
          "✅ Login successful! Token received:",
          data.token.substring(0, 30) + "...",
        );
        console.log(
          "👤 User:",
          data.user?.username,
          "(Guest:",
          data.user?.isGuest,
          ")",
        );

        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        console.log("💾 Credentials saved to storage");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error logging in:", error.message);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      console.log("🚪 Logging out...");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      console.log("✅ Logout successful");
    } catch (error: any) {
      console.error("❌ Error logging out:", error.message);
      throw error;
    }
  },

  convertGuestToUser: async (
    userId: string,
    email: string,
    username: string,
    password: string,
    phoneNumber: string,
  ): Promise<AuthResponse> => {
    try {
      console.log("🔄 Converting guest to user:", userId);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/auth/convert-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          email,
          username,
          password,
          phoneNumber,
        }),
      });

      const data = await handleApiResponse(response);

      if (data.token) {
        console.log("✅ Guest converted successfully!");
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error converting guest account:", error.message);
      throw error;
    }
  },

  // ==================== BOOKINGS ====================

  getUserAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
    try {
      console.log("📅 Fetching user appointments...");

      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Appointments fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching appointments:", error.message);
      throw error;
    }
  },

  getUserBookings: async (): Promise<ApiResponse<UserBooking[]>> => {
    try {
      console.log("📅 Fetching user bookings...");

      const token = await getToken();
      if (!token) {
        console.warn("⚠️ No token found, user not authenticated");
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      let response;
      let data;

      try {
        console.log("📡 Trying endpoint: /bookings/my-bookings");
        response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /my-bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ Endpoint /my-bookings failed, trying alternative...");
      }

      try {
        console.log("📡 Trying endpoint: /bookings");
        response = await fetch(`${API_BASE_URL}/bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ Endpoint /bookings failed, trying user-specific...");
      }

      try {
        console.log("📡 Trying endpoint: /users/me/bookings");
        response = await fetch(`${API_BASE_URL}/users/me/bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /users/me/bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ All booking endpoints failed");
      }

      console.warn("⚠️ Could not fetch bookings from any endpoint");
      return {
        success: false,
        message: "Booking endpoint not available",
        data: [],
      };
    } catch (error: any) {
      console.error("❌ Error fetching user bookings:", error.message);
      return {
        success: false,
        data: [],
        message: error.message || "Failed to fetch bookings",
      };
    }
  },

  cancelBooking: async (
    bookingId: string,
  ): Promise<ApiResponse<UserBooking>> => {
    try {
      console.log("❌ Cancelling booking:", bookingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      let response;

      try {
        console.log("📡 Trying endpoint: /bookings/:id/cancel");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via /cancel");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ /cancel endpoint failed, trying PATCH...");
      }

      try {
        console.log("📡 Trying endpoint: PATCH /bookings/:id");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via PATCH");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ PATCH endpoint failed, trying PUT...");
      }

      try {
        console.log("📡 Trying endpoint: PUT /bookings/:id");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via PUT");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ All cancellation endpoints failed");
      }

      throw new Error("Could not cancel booking - endpoint not available");
    } catch (error: any) {
      console.error("❌ Error cancelling booking:", error.message);
      throw error;
    }
  },

  createBooking: async (bookingData: {
    serviceId: string;
    stylistPreference: string;
    selectedStylistId?: string;
    preferredDate: string;
    preferredTime: string;
    customerNotes?: string;
  }): Promise<ApiResponse<Booking>> => {
    try {
      console.log("📝 Creating booking...");
      console.log(
        "📤 Original booking data:",
        JSON.stringify(bookingData, null, 2),
      );

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const user = await apiClient.getUserFromStorage();
      console.log(
        "👤 Current user:",
        user?.username,
        "(Guest:",
        user?.isGuest,
        ")",
      );

      if (!user || user.isGuest) {
        console.error("❌ Invalid user or guest account");
        throw new Error("Valid user account required to create booking");
      }

      const convertedBookingData = {
        ...bookingData,
        preferredTime: convertTimeTo24HourFormat(bookingData.preferredTime),
      };

      console.log(
        "🔄 Converted booking data:",
        JSON.stringify(convertedBookingData, null, 2),
      );

      let response;
      let endpoint = `${API_BASE_URL}/bookings/create`;

      console.log("📡 Sending request to:", endpoint);

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(convertedBookingData),
      });

      console.log("📥 Booking response status:", response.status);

      if (!response.ok && response.status === 404) {
        console.log("🔄 Trying alternative booking endpoint...");
        endpoint = `${API_BASE_URL}/bookings`;

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(convertedBookingData),
        });

        console.log(
          "📥 Alternative endpoint response status:",
          response.status,
        );
      }

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Booking created successfully:", data.data._id);
        return data;
      } else {
        console.error("❌ Booking creation failed:", data.message);
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("❌ Error creating booking:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("Network request failed")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      } else if (error.message.includes("Time must be in HH:MM format")) {
        throw new Error("Invalid time format. Please select a valid time.");
      } else if (error.message.includes("Failed to create booking")) {
        throw new Error(
          "Booking creation failed. Please try again or contact support.",
        );
      } else {
        throw error;
      }
    }
  },

  // 🔔 ADDED: Notify staff about new booking
  notifyStaffBooking: async (bookingId: string): Promise<any> => {
    try {
      console.log("🔔 Notifying staff about booking:", bookingId);

      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/notify-staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      const data = await response.json();
      console.log("✅ Staff notification response:", data);
      return data;
    } catch (error: any) {
      console.error("❌ Error notifying staff:", error.message);
      // Silent fail - don't throw error
      return { success: false };
    }
  },

  // ==================== SERVICES ====================

  getAllServices: async (
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<Service[]>> => {
    try {
      console.log("🔧 Fetching all services...");

      let url = `${API_BASE_URL}/services`;
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log("✅ Services fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching services:", error.message);
      throw error;
    }
  },

  getServicesByCategory: async (
    category: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<Service[]>> => {
    try {
      console.log("🔧 Fetching services by category:", category);

      let url = `${API_BASE_URL}/services/category/${category}`;
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log("✅ Services fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching services by category:", error.message);
      throw error;
    }
  },

  getServiceCategories: async (): Promise<ApiResponse<string[]>> => {
    try {
      console.log("📂 Fetching service categories...");

      const response = await fetch(`${API_BASE_URL}/services/categories`);
      const data = await handleApiResponse(response);
      console.log("✅ Categories fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching service categories:", error.message);
      throw error;
    }
  },

  getStylists: async (): Promise<ApiResponse<Stylist[]>> => {
    try {
      console.log("💇 Fetching stylists...");

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/stylists`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Stylists fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching stylists:", error.message);
      throw error;
    }
  },

  bookService: async (serviceId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📝 Booking service:", serviceId);

      const token = await getToken();

      const response = await fetch(
        `${API_BASE_URL}/services/${serviceId}/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Service booked successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error booking service:", error.message);
      throw error;
    }
  },

  getAvailableTimeSlots: async (
    date: string,
  ): Promise<{ success: boolean; availableSlots: string[] }> => {
    try {
      console.log("⏰ Fetching available time slots for:", date);

      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/bookings/available-slots/${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (response.status === 404) {
        console.warn(
          "⚠️ Available time slots route not found. Using default slots.",
        );
        return {
          success: true,
          availableSlots: [
            "09:30 AM",
            "10:00 AM",
            "10:30 AM",
            "11:00 AM",
            "11:30 AM",
            "12:00 PM",
            "12:30 PM",
            "01:00 PM",
            "01:30 PM",
            "02:00 PM",
            "02:30 PM",
            "03:00 PM",
            "03:30 PM",
            "04:00 PM",
            "04:30 PM",
            "05:00 PM",
            "05:30 PM",
            "06:00 PM",
            "06:30 PM",
            "07:00 PM",
            "07:30 PM",
            "08:00 PM",
            "08:30 PM",
          ],
        };
      }

      const data = await handleApiResponse(response);
      console.log("✅ Available slots:", data.availableSlots?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching available time slots:", error.message);
      return {
        success: true,
        availableSlots: [
          "09:30 AM",
          "10:00 AM",
          "10:30 AM",
          "11:00 AM",
          "11:30 AM",
          "12:00 PM",
          "12:30 PM",
          "01:00 PM",
          "01:30 PM",
          "02:00 PM",
          "02:30 PM",
          "03:00 PM",
          "03:30 PM",
          "04:00 PM",
          "04:30 PM",
          "05:00 PM",
          "05:30 PM",
          "06:00 PM",
          "06:30 PM",
          "07:00 PM",
          "07:30 PM",
          "08:00 PM",
          "08:30 PM",
        ],
      };
    }
  },

  // ==================== PRODUCTS ====================

  getAllProducts: async (): Promise<ApiResponse<Product[]>> => {
    try {
      console.log("🛍️ Fetching all products...");

      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await handleApiResponse(response);
      console.log("✅ Products fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching products:", error.message);
      throw error;
    }
  },

  getProductsByCategory: async (
    category: string,
  ): Promise<ApiResponse<Product[]>> => {
    try {
      console.log("🛍️ Fetching products by category:", category);

      const response = await fetch(
        `${API_BASE_URL}/products/category/${category}`,
      );
      const data = await handleApiResponse(response);
      console.log("✅ Products fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching products by category:", error.message);
      throw error;
    }
  },

  getProductCategories: async (): Promise<ApiResponse<string[]>> => {
    try {
      console.log("📂 Fetching product categories...");

      const response = await fetch(`${API_BASE_URL}/products/categories`);
      const data = await handleApiResponse(response);
      console.log("✅ Categories fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching product categories:", error.message);
      throw error;
    }
  },

  // ==================== PAYMENTS ====================

  createPayment: async (paymentData: {
    bookingId?: string;
    orderId?: string;
    paymentMethod: string;
  }): Promise<ApiResponse<Payment>> => {
    try {
      console.log("💳 Creating payment...");
      console.log("📤 Payment data:", JSON.stringify(paymentData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      console.log("📥 Payment response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Payment created successfully:", data.data._id);
        return data;
      } else {
        console.error("❌ Payment creation failed:", data.message);
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("❌ Error creating payment:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  uploadProofOfPayment: async (
    paymentId: string,
    formData: FormData,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📤 Uploading proof of payment for:", paymentId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");
      console.log(
        "🌐 Upload URL:",
        `${API_BASE_URL}/payments/${paymentId}/upload-proof`,
      );

      const debugInfo: any = {};
      for (const pair of (formData as any).entries()) {
        const key = pair[0];
        const value = pair[1];
        if (typeof value === "object" && "uri" in value) {
          debugInfo[key] = {
            uri: value.uri?.substring(0, 50) + "...",
            type: value.type,
            name: value.name,
          };
        } else {
          debugInfo[key] = value;
        }
      }
      console.log("📋 FormData contents:", JSON.stringify(debugInfo, null, 2));

      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/upload-proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      console.log("📥 Upload response status:", response.status);

      const responseText = await response.text();
      console.log("📄 Raw response:", responseText.substring(0, 500));

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        console.log("📄 Full response text:", responseText);
        throw new Error(
          `Invalid server response: ${responseText.substring(0, 100)}`,
        );
      }

      if (!response.ok) {
        console.error("❌ Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        const errorMessage =
          data.message ||
          data.error ||
          `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("✅ Proof of payment uploaded successfully");
      return {
        success: true,
        data: data.data || data,
        message: data.message || "Upload successful",
      };
    } catch (error: any) {
      console.error("❌ Error uploading proof of payment:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("Network request failed")) {
        throw new Error("Network error. Please check your connection.");
      } else if (error.message.includes("timeout")) {
        throw new Error("Upload timed out. Please try again.");
      }

      throw error;
    }
  },

  getPaymentStatus: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      console.log("🔍 [API CLIENT] Checking payment status for:", paymentId);

      const token = await getToken();
      if (!token) {
        console.error("❌ [API CLIENT] No authentication token available");
        throw new Error("Authentication required");
      }

      console.log(
        "🌐 [API CLIENT] Calling endpoint:",
        `${API_BASE_URL}/payments/${paymentId}/status`,
      );

      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("📥 [API CLIENT] Response status:", response.status);

      const data = await handleApiResponse(response);

      console.log("✅ [API CLIENT] Payment status response:", {
        success: data.success,
        status: data.data?.status,
        fullData: JSON.stringify(data.data, null, 2),
      });

      return data;
    } catch (error: any) {
      console.error(
        "❌ [API CLIENT] Error fetching payment status:",
        error.message,
      );
      throw error;
    }
  },

  // ==================== CART FUNCTIONS ====================

  getCart: async (): Promise<ApiResponse<Cart>> => {
    try {
      console.log("🛒 Fetching user cart...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: {} as Cart,
        };
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Cart fetched:", data.data?.items?.length || 0, "items");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching cart:", error.message);
      throw error;
    }
  },

  addToCart: async (
    productId: string,
    quantity: number = 1,
  ): Promise<ApiResponse<CartItem>> => {
    try {
      console.log("➕ Adding to cart:", productId, "Quantity:", quantity);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Item added to cart successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error adding to cart:", error.message);
      throw error;
    }
  },

  updateCartItemQuantity: async (
    cartItemId: string,
    quantity: number,
  ): Promise<ApiResponse<CartItem>> => {
    try {
      console.log(
        "🔄 Updating cart item:",
        cartItemId,
        "New quantity:",
        quantity,
      );

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/update/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Cart item quantity updated");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating cart item:", error.message);
      throw error;
    }
  },

  removeFromCart: async (cartItemId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Removing from cart:", cartItemId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/remove/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Item removed from cart");
      return data;
    } catch (error: any) {
      console.error("❌ Error removing from cart:", error.message);
      throw error;
    }
  },

  clearCart: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Clearing cart...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Cart cleared");
      return data;
    } catch (error: any) {
      console.error("❌ Error clearing cart:", error.message);
      throw error;
    }
  },

  // ==================== FAVORITES FUNCTIONS ====================

  getFavorites: async (): Promise<ApiResponse<FavoriteItem[]>> => {
    try {
      console.log("⭐ Fetching user favorites...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Favorites fetched:", data.data?.length || 0, "items");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching favorites:", error.message);
      throw error;
    }
  },

  addToFavorites: async (
    productId: string,
  ): Promise<ApiResponse<FavoriteItem>> => {
    try {
      console.log("⭐ Adding to favorites:", productId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/favorites/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Item added to favorites successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error adding to favorites:", error.message);
      throw error;
    }
  },

  removeFromFavorites: async (
    favoriteId: string,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Removing from favorites:", favoriteId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/remove/${favoriteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Item removed from favorites");
      return data;
    } catch (error: any) {
      console.error("❌ Error removing from favorites:", error.message);
      throw error;
    }
  },

  isFavorite: async (productId: string): Promise<{ isFavorite: boolean }> => {
    try {
      console.log("🔍 Checking if product is favorite:", productId);

      const token = await getToken();
      if (!token) {
        return { isFavorite: false };
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/check/${productId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      return { isFavorite: data.isFavorite };
    } catch (error: any) {
      console.error("❌ Error checking favorite status:", error.message);
      return { isFavorite: false };
    }
  },

  // ==================== ORDER FUNCTIONS ====================

  createOrder: async (orderData: {
    items: Array<{ productId: string; quantity: number }>;
    deliveryType: "pickup" | "delivery";
    deliveryAddress?: string;
    contactNumber: string;
    specialInstructions?: string;
    customerNotes?: string;
  }): Promise<ApiResponse<Order>> => {
    try {
      console.log("🛒 Creating order...");
      console.log("📤 Order data:", JSON.stringify(orderData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log("📥 Order response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Order created successfully:", data.data._id);
        return {
          success: true,
          data: data.data,
          message: data.message || "Order created successfully",
        };
      } else {
        console.error("❌ Order creation failed:", data.message);
        throw new Error(data.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("❌ Error creating order:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  getOrders: async (): Promise<ApiResponse<Order[]>> => {
    try {
      console.log("📦 Fetching user orders...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Orders fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching orders:", error.message);
      throw error;
    }
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      console.log("📦 Fetching order:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Order fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching order:", error.message);
      throw error;
    }
  },

  cancelOrder: async (
    orderId: string,
    cancellationReason?: string,
  ): Promise<ApiResponse<Order>> => {
    try {
      console.log("❌ Cancelling order:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellationReason }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Order cancelled successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error cancelling order:", error.message);
      throw error;
    }
  },

  getOrderTracking: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📍 Fetching order tracking:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/tracking`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Order tracking fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching order tracking:", error.message);
      throw error;
    }
  },
};

export default apiClient;
