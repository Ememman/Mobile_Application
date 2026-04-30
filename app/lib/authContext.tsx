import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  staffApiClient,
  type StaffUser,
  type AuthResponse,
} from "@/app/lib/staffApiClient";

export interface User extends StaffUser {
  role: "salon_staff";
  isGuest: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    emailOrPhone: string,
    password: string,
    role?: string
  ) => Promise<AuthResponse>;
  adminLogin: (emailOrPhone: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("🔄 Initializing staff auth...");

        // Check if we have stored auth data
        const storedToken = await AsyncStorage.getItem("staff_token");
        const storedUser = await AsyncStorage.getItem("staff_user");

        if (storedToken && storedUser) {
          console.log("📱 Found stored staff auth data");
          setToken(storedToken);

          // Verify the token is still valid by making an API call
          try {
            const currentUser = await staffApiClient.getCurrentUser();
            // Fix: currentUser is StaffUser | null, not AuthResponse
            if (currentUser) {
              console.log(
                "✅ Token is valid, setting user:",
                currentUser.username
              );
              setUser({
                ...currentUser,
                role: "salon_staff",
                isGuest: false,
              });
              // Update stored user data
              await AsyncStorage.setItem(
                "staff_user",
                JSON.stringify(currentUser)
              );
            } else {
              throw new Error("Invalid user data");
            }
          } catch (apiError) {
            console.error("❌ Token validation failed:", apiError);
            // Token is invalid, clear storage
            await clearAuthData();
          }
        } else {
          console.log("⚠️ No stored staff auth data found");
        }
      } catch (error) {
        console.error("❌ Error initializing staff auth:", error);
        await clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = async () => {
    await AsyncStorage.removeItem("staff_token");
    await AsyncStorage.removeItem("staff_user");
    setToken(null);
    setUser(null);
  };

  const clearError = () => setError(null);

  const login = async (
    emailOrPhone: string,
    password: string,
    role: string = "salon_staff"
  ): Promise<AuthResponse> => {
    try {
      setIsLoggingIn(true);
      setError(null);
      console.log("🔑 Staff login attempt for:", emailOrPhone);

      const response = await staffApiClient.login({
        emailOrPhone,
        password,
        role: role as "salon_staff",
      });

      // Fix: response is AuthResponse, so we can safely access success, token, user
      if (response.success && response.token && response.user) {
        console.log("✅ Staff login successful:", response.user.username);

        // Store auth data
        await AsyncStorage.setItem("staff_token", response.token);
        await AsyncStorage.setItem("staff_user", JSON.stringify(response.user));

        // Update state
        setToken(response.token);
        setUser({
          ...response.user,
          role: "salon_staff",
          isGuest: false,
        });

        return response;
      } else {
        const errorMessage = response.message || "Login failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Staff login error:", error.message);

      let userMessage = error.message;

      // Handle specific error cases
      if (error.message.includes("Network request failed")) {
        userMessage = "Network error. Please check your connection.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Invalid credentials")
      ) {
        userMessage = "Invalid email/phone or password.";
      } else if (error.message.includes("Account locked")) {
        userMessage =
          "Account temporarily locked. Please try again later or contact administrator.";
      } else if (error.message.includes("Password change required")) {
        userMessage = "Password change required. Please use forgot password.";
      }

      setError(userMessage);
      throw new Error(userMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const adminLogin = async (
    emailOrPhone: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      setIsLoggingIn(true);
      setError(null);
      console.log("🔑 Staff admin login attempt for:", emailOrPhone);

      const response = await staffApiClient.adminLogin({
        emailOrPhone,
        password,
      });

      // Fix: response is AuthResponse
      if (response.success && response.token && response.user) {
        console.log("✅ Staff admin login successful:", response.user.username);

        // Store auth data
        await AsyncStorage.setItem("staff_token", response.token);
        await AsyncStorage.setItem("staff_user", JSON.stringify(response.user));

        // Update state
        setToken(response.token);
        setUser({
          ...response.user,
          role: "salon_staff",
          isGuest: false,
        });

        return response;
      } else {
        const errorMessage = response.message || "Admin login failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Staff admin login error:", error.message);

      let userMessage = error.message;

      if (error.message.includes("Network request failed")) {
        userMessage = "Network error. Please check your connection.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Invalid credentials")
      ) {
        userMessage = "Invalid credentials or insufficient permissions.";
      }

      setError(userMessage);
      throw new Error(userMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("🚪 Staff logout initiated");

      // Call API logout if needed
      await staffApiClient.logout();

      // Clear local storage and state
      await clearAuthData();

      console.log("✅ Staff logout successful");
    } catch (error: any) {
      console.error("❌ Staff logout error:", error.message);
      // Still clear local data even if API call fails
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      if (!token) {
        console.log("⚠️ No token available for getCurrentUser");
        return;
      }

      console.log("👤 Fetching current staff user...");
      const currentUser = await staffApiClient.getCurrentUser();

      // Fix: currentUser is StaffUser | null, not AuthResponse
      if (currentUser) {
        console.log("✅ Current staff user fetched:", currentUser.username);
        setUser({
          ...currentUser,
          role: "salon_staff",
          isGuest: false,
        });
        await AsyncStorage.setItem("staff_user", JSON.stringify(currentUser));
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error: any) {
      console.error("❌ Error fetching current staff user:", error.message);

      // If we get an auth error, logout the user
      if (
        error.message.includes("401") ||
        error.message.includes("Authentication")
      ) {
        console.warn("🔄 Authentication failed, logging out...");
        await clearAuthData();
      }

      setError("Failed to refresh user data");
    }
  };

  const refreshUser = async () => {
    try {
      console.log("🔄 Refreshing staff user data...");
      await getCurrentUser();
    } catch (error: any) {
      console.error("❌ Error refreshing staff user:", error.message);
      setError("Failed to refresh user data");
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user && user.role === "salon_staff",
    login,
    adminLogin,
    logout,
    getCurrentUser,
    refreshUser,
    error,
    clearError,
    isLoggingIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Hook for staff-specific authentication
export function useStaffAuth() {
  const auth = useAuth();

  // Additional staff-specific validation
  if (auth.user && auth.user.role !== "salon_staff") {
    console.warn("⚠️ User is not staff, clearing auth...");
    auth.logout();
    throw new Error("Staff authentication required");
  }

  return auth;
}

// Hook to check if user has staff permissions
export function useStaffPermissions() {
  const { user } = useStaffAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Define staff permissions based on position
    const staffPermissions = {
      // Basic permissions for all staff
      basic: ["view_appointments", "clock_in_out", "view_learning_modules"],

      // Senior stylist permissions
      senior: ["manage_appointments", "train_junior_staff", "approve_work"],

      // Manager permissions
      manager: ["manage_staff", "view_reports", "manage_inventory"],
    };

    let userPermissions = staffPermissions.basic;

    if (user.position?.toLowerCase().includes("manager")) {
      userPermissions = [
        ...userPermissions,
        ...staffPermissions.manager,
        ...staffPermissions.senior,
      ];
    } else if (user.position?.toLowerCase().includes("senior")) {
      userPermissions = [...userPermissions, ...staffPermissions.senior];
    }

    return userPermissions.includes(permission);
  };

  const isManager = user?.position?.toLowerCase().includes("manager") || false;
  const isSeniorStaff =
    user?.position?.toLowerCase().includes("senior") || false;
  const isRegularStaff = !isManager && !isSeniorStaff;

  return {
    hasPermission,
    isManager,
    isSeniorStaff,
    isRegularStaff,
    position: user?.position || "Staff",
  };
}

// Hook to check online status for staff
export function useStaffOnlineStatus() {
  const { user, refreshUser } = useStaffAuth();

  const checkOnlineStatus = (): boolean => {
    if (!user?.lastActivity) return false;

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const lastActivity = new Date(user.lastActivity);

    return lastActivity > fifteenMinutesAgo;
  };

  const updateActivity = async (): Promise<void> => {
    // This would typically be called when user performs an action
    await refreshUser();
  };

  return {
    isOnline: checkOnlineStatus(),
    updateActivity,
    lastActivity: user?.lastActivity ? new Date(user.lastActivity) : null,
  };
}
