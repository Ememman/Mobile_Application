// app/lib/staffApiClient.ts - COMPLETE UPDATED WITH FIXED APPOINTMENT ENDPOINTS
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types - UPDATED with break functionality
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  total?: number;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StaffUser {
  id: string;
  username: string;
  firstName: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  role: "salon_staff";
  position: string;
  staffId: string;
  isActive: boolean;
  hireDate: string;
  createdAt: string;
  lastActivity?: string;
  isOnline?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: StaffUser;
  roleData?: {
    dashboardAccess: string[];
    permissions: {
      canClockIn: boolean;
      canViewAppointments: boolean;
      canAccessLearning: boolean;
      canViewLeaderboard: boolean;
    };
  };
  security?: {
    passwordStrength: {
      strength: string;
      color: string;
      score: number;
    };
    requiresPasswordUpdate: boolean;
    lastPasswordChange: string;
  };
  redirectTo?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
  expiresIn?: string;
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

export interface AttendanceRecord {
  _id: string;
  userId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  clockInLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  clockOutLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: "present" | "absent" | "late" | "half-day" | "on-break";
  workingHours: number;
  netWorkingHours: number;
  breaks: BreakRecord[];
  totalBreakTime: number;
  isValidLocation: {
    clockIn: boolean;
    clockOut: boolean;
  };
  notes?: string;
}

// ADD BREAK INTERFACES
export interface BreakData {
  breakType?: "lunch" | "short" | "personal" | "other";
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface BreakRecord {
  breakStart: string;
  breakEnd?: string;
  breakDuration?: number;
  breakType: string;
  breakLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isValidLocation?: boolean;
}

export interface BreakStatusResponse {
  onBreak: boolean;
  activeBreak: BreakRecord | null;
  totalBreaksToday: number;
  totalBreakTime: number;
  breaks: BreakRecord[];
}

export interface MonthlyAttendanceStats {
  totalDays: number;
  workingDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalWorkingHours: number;
  totalBreakTime: number;
  averageBreakTime: number;
  attendancePercentage: number;
  averageWorkingHours: number;
  netWorkingHours?: number;
}

export interface Appointment {
  id: string;
  customer: {
    id: string;
    username: string;
    firstName: string;
    email: string;
    phoneNumber: string;
    profileImage: string;
  };
  service: {
    id: string;
    name: string;
    category: string;
    duration: number;
    priceRange: string;
  };
  selectedStylist?: {
    id: string;
    username: string;
    profileImage: string;
    position: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: "upcoming" | "completed" | "cancelled" | "confirmed" | "pending";
  notes?: string;
  salonLocation: {
    name: string;
    address: string;
  };
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: string;
}

export interface LearningModule {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  instructor: {
    name: string;
    bio: string;
    profileImage: string;
    credentials: string[];
  };

  // Training module specific fields
  duration?: string;
  totalEmployees?: number;
  employeesCompleted?: number;
  progress?: number;
  status?: "Active" | "Inactive" | "Draft";
  createdBy?: {
    _id: string;
    username: string;
    profileImage?: string;
  };

  // YouTube video fields
  youtubeVideos?: Array<{
    _id: string;
    title: string;
    url: string;
    description?: string;
    type: string;
    isActive: boolean;
    order: number;
    createdAt: string;
    duration?: string;
  }>;

  // Resources
  resources?: Array<{
    _id: string;
    title: string;
    url: string;
    description?: string;
    type: "youtube" | "website" | "document";
    isActive: boolean;
    order: number;
    createdAt: string;
  }>;

  // Enhanced Quiz System
  quiz?: {
    isEnabled: boolean;
    title?: string;
    description?: string;
    passingScore: number;
    timeLimit: number;
    maxAttempts: number;
    questions?: Array<{
      _id?: string;
      question: string;
      questionType: "multiple-choice" | "true-false" | "short-answer";
      options: Array<{ id: string; text: string }>;
      correctAnswer: string;
      explanation?: string;
      points: number;
      order: number;
      isActive: boolean;
    }>;
    totalPoints: number;
    showResults: boolean;
    randomizeQuestions: boolean;
    allowRetakes: boolean;
    requiredForCompletion: boolean;
  };

  quizAnalytics?: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    averageTimeSpent: number;
    questionStatistics: Array<{
      questionId: string;
      questionText: string;
      correctAttempts: number;
      totalAttempts: number;
      successRate: number;
    }>;
  };

  // Existing fields for backward compatibility
  coverImage: string;
  estimatedDuration?: number;
  rating?: {
    average: number;
    count: number;
    reviews: Array<{
      userId: string;
      rating: number;
      comment: string;
      createdAt: string;
    }>;
  };
  enrollment?: {
    totalEnrolled: number;
    completed: number;
  };
  requirements?: string[];
  learningObjectives?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userProgress?: UserProgress;
  completionRate?: number;
}

export interface UserProgress {
  _id: string;
  userId: string;
  moduleId: string;
  status: "not-started" | "in-progress" | "completed" | "paused" | "failed";
  progress: number;
  timeSpent: number;
  lastAccessedAt: string;
  completedAt?: string;

  // Enhanced Quiz Tracking
  quizAttempts?: Array<{
    attemptNumber: number;
    score: number;
    correctAnswers?: number;
    totalQuestions?: number;
    timeSpent: number;
    answers: Array<{
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      pointsEarned?: number;
    }>;
    passed: boolean;
    completedAt: string;
  }>;

  currentAttempt?: number;
  bestScore?: number;
  quizCompleted?: boolean;
  lastQuizAttempt?: string;

  // Legacy quiz scores for backward compatibility
  quizScores?: Array<{
    attempt: number;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
  }>;

  bookmarked?: boolean;
  notes?: Array<{
    content: string;
    timestamp: number;
    createdAt: string;
  }>;
  certificate?: {
    issued: boolean;
    issuedAt?: string;
    certificateUrl?: string;
  };
}

export interface LeaderboardEntry {
  userId: {
    _id: string;
    username: string;
    profileImage: string;
    position: string;
  };
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  attendanceScore: number;
  punctualityScore: number;
  servicesCompleted: {
    total: number;
    monthly: number;
    weekly: number;
  };
  customerRatings: {
    average: number;
    count: number;
    total: number;
  };
  learningModulesCompleted: {
    total: number;
    monthly: number;
  };
  salesPerformance: {
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    productsUpsold: number;
  };
  badges: Array<{
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
    category: string;
  }>;
  currentRank: {
    overall: number;
    monthly: number;
    weekly: number;
  };
  previousRank: {
    overall: number;
    monthly: number;
    weekly: number;
  };
  streaks: {
    attendance: {
      current: number;
      longest: number;
    };
    punctuality: {
      current: number;
      longest: number;
    };
    learning: {
      current: number;
      longest: number;
    };
  };
  rank: number;
  rankChange: number;
}

export interface StaffDashboard {
  staffInfo: {
    id: string;
    name: string;
    firstName: string;
    email: string;
    profileImage: string;
    position: string;
    staffId: string;
  };
  todayAppointments: Appointment[];
  attendance: {
    todayStatus: "not-started" | "clocked-in" | "clocked-out" | "on-break";
    todayRecord?: AttendanceRecord;
    monthlyStats: MonthlyAttendanceStats;
  };
  trainingModules: Array<
    LearningModule & {
      userProgress?: UserProgress;
      progress: number;
      status: string;
      timeSpent: number;
      hasVideos: boolean;
      hasResources: boolean;
      hasQuiz: boolean;
    }
  >;
  leaderboard: {
    rank: number;
    monthlyRank: number;
    weeklyRank: number;
    points: number;
    monthlyPoints: number;
    weeklyPoints: number;
  };
  favorites: {
    learningModules: LearningModule[];
  };
  quickStats: {
    appointmentsToday: number;
    modulesInProgress: number;
    currentStreak: number;
    favoriteModulesCount: number;
    attendanceRate: number;
  };
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ClockInData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ClockOutData {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface FavoriteLearningModule {
  _id: string;
  userId: string;
  itemType: "LearningModule";
  itemId: LearningModule;
  createdAt: string;
}

export interface QuizAttemptData {
  score: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
  timeSpent: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface QuizQuestion {
  id: string;
  _id?: string;
  question: string;
  questionType: "multiple-choice" | "true-false" | "short-answer";
  options: string[];
  correctAnswer: number | string;
  explanation: string;
  points: number;
  order: number;
  isActive: boolean;
}

export interface ModuleQuiz {
  isEnabled: boolean;
  title?: string;
  description?: string;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  allowRetakes: boolean;
  requiredForCompletion: boolean;
  totalPoints: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  questions?: QuizQuestion[];
}

// API Configuration
const API_BASE_URL = "http://10.74.230.139:3000/api";

// Helper Functions
const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("staff_token");
    if (token) {
      console.log("🔑 Staff token retrieved:", token.substring(0, 30) + "...");
    } else {
      console.log("⚠️ No staff token found in storage");
    }
    return token;
  } catch (error) {
    console.error("❌ Error retrieving staff token:", error);
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

  console.log("📡 Staff API Response:", {
    status: response.status,
    ok: response.ok,
    success: data.success,
    message: data.message,
    data: data.data ? "present" : "missing",
  });

  if (!response.ok) {
    console.error("❌ Staff API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    if (response.status === 401 || response.status === 403) {
      console.warn("⚠️ Staff authentication failed. Clearing session...");
      await AsyncStorage.removeItem("staff_token");
      await AsyncStorage.removeItem("staff_user");
      throw new Error("Authentication failed. Please login again.");
    } else if (response.status === 400) {
      throw new Error(data.message || "Invalid request data");
    } else if (response.status === 423) {
      throw new Error(
        data.message || "Account locked. Please contact administrator.",
      );
    } else if (response.status === 500) {
      throw new Error(data.message || "Server error. Please try again later.");
    } else {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }
  }

  return data;
};

// Main Staff API Client
export const staffApiClient = {
  // ==================== AUTHENTICATION ====================
  login: async (credentials: {
    email?: string;
    phoneNumber?: string;
    emailOrPhone?: string;
    password: string;
    role: "salon_staff";
  }): Promise<AuthResponse> => {
    try {
      console.log(
        "🔑 Staff attempting login:",
        credentials.emailOrPhone || credentials.email,
      );

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      // Handle different response statuses for login
      if (response.status === 429) {
        // Too many requests - delay active
        const errorData = await response.json();
        console.log("⏰ Staff login delay active:", errorData.message);

        throw new Error(
          JSON.stringify({
            type: "DELAY_ACTIVE",
            message: errorData.message,
            remainingTime: errorData.remainingTime,
            failedAttempts: errorData.failedAttempts,
            delayActive: true,
          }),
        );
      } else if (response.status === 400) {
        // Invalid credentials or other client errors
        const errorData = await response.json();
        console.log("❌ Staff login failed:", errorData.message);

        // Check if this is a delayed response (after 3+ attempts)
        if (errorData.delayActive || errorData.delaySeconds > 0) {
          throw new Error(
            JSON.stringify({
              type: "DELAYED_ERROR",
              message: errorData.message,
              delaySeconds: errorData.delaySeconds,
              failedAttempts: errorData.failedAttempts,
              delayActive: errorData.delayActive,
              recommendForgotPassword: errorData.recommendForgotPassword,
              forgotPasswordMessage: errorData.forgotPasswordMessage,
            }),
          );
        } else {
          // Regular invalid credentials (first 3 attempts)
          throw new Error(
            JSON.stringify({
              type: "INVALID_CREDENTIALS",
              message: errorData.message,
              failedAttempts: errorData.failedAttempts || 1,
            }),
          );
        }
      }

      const data = await handleApiResponse(response);

      if (data.token && data.user) {
        console.log("✅ Staff login successful! User:", data.user.username);
        await AsyncStorage.setItem("staff_token", data.token);
        await AsyncStorage.setItem("staff_user", JSON.stringify(data.user));
        console.log("💾 Staff credentials saved to storage");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error in staff login:", error.message);

      // Parse the structured error messages
      try {
        const errorObj = JSON.parse(error.message);
        throw errorObj;
      } catch (parseError) {
        // If it's not JSON, it's a regular error
        throw new Error(
          JSON.stringify({
            type: "UNKNOWN_ERROR",
            message: error.message,
          }),
        );
      }
    }
  },

  updateLeaderboardFromQuiz: async (
    score: number,
    pointsEarned: number,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🏆 Updating leaderboard with quiz points:", pointsEarned);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/leaderboards/update-from-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score,
            pointsEarned,
          }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Leaderboard updated with quiz points");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating leaderboard:", error.message);
      throw error;
    }
  },

  adminLogin: async (credentials: {
    email?: string;
    phoneNumber?: string;
    emailOrPhone?: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      console.log(
        "🔑 Staff admin login attempt:",
        credentials.emailOrPhone || credentials.email,
      );

      const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await handleApiResponse(response);

      if (data.token && data.user) {
        console.log("✅ Staff admin login successful!");
        await AsyncStorage.setItem("staff_token", data.token);
        await AsyncStorage.setItem("staff_user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error in staff admin login:", error.message);
      throw error;
    }
  },

  forgotPassword: async (
    identifier: string,
  ): Promise<ForgotPasswordResponse> => {
    try {
      console.log("🔐 Staff requesting password reset for:", identifier);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: identifier }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Staff password reset request successful");
        return {
          success: true,
          message:
            data.message || "Password reset instructions sent successfully",
          resetToken: data.resetToken,
          expiresIn: data.expiresIn,
          cooldownRemaining: data.cooldownRemaining,
        };
      } else {
        console.error("❌ Staff password reset request failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to send password reset instructions",
        };
      }
    } catch (error: any) {
      console.error("❌ Error in staff password reset:", error.message);
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
      console.log("🔄 Staff resetting password...");

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
        console.log("✅ Staff password reset successful");
        return {
          success: true,
          message: data.message || "Password reset successfully",
          passwordStrength: data.passwordStrength,
        };
      } else {
        console.error("❌ Staff password reset failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to reset password",
        };
      }
    } catch (error: any) {
      console.error("❌ Error in staff password reset:", error.message);
      return {
        success: false,
        message: error.message || "Failed to reset password",
      };
    }
  },

  changePassword: async (
    passwordData: ChangePasswordData,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log("🔒 Staff changing password...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Staff password changed successfully");
        return {
          success: true,
          data: { message: data.message || "Password changed successfully" },
          message: data.message || "Password changed successfully",
        };
      } else {
        console.error("❌ Staff password change failed:", data.message);
        throw new Error(data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("❌ Error in staff password change:", error.message);
      throw error;
    }
  },

  getProfile: async (): Promise<ApiResponse<StaffUser>> => {
    try {
      console.log("👤 Staff fetching profile...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Staff profile retrieved:", data.user.username);
        await AsyncStorage.setItem("staff_user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error fetching staff profile:", error.message);
      throw error;
    }
  },

  updateProfile: async (
    profileData: UpdateProfileData,
  ): Promise<ApiResponse<StaffUser>> => {
    try {
      console.log("👤 Staff updating profile...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Staff profile updated successfully");
        await AsyncStorage.setItem("staff_user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error updating staff profile:", error.message);
      throw error;
    }
  },

  updateProfilePicture: async (
    imageUri: string,
  ): Promise<ApiResponse<StaffUser>> => {
    try {
      console.log("📸 Staff updating profile picture...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `staff_profile_${Date.now()}.${fileExtension}`;

      formData.append("profileImage", {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      const response = await fetch(`${API_BASE_URL}/auth/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Staff profile picture updated successfully");
        await AsyncStorage.setItem("staff_user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error updating staff profile picture:", error.message);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      console.log("🚪 Staff logging out...");
      await AsyncStorage.removeItem("staff_token");
      await AsyncStorage.removeItem("staff_user");
      console.log("✅ Staff logout successful");
    } catch (error: any) {
      console.error("❌ Error in staff logout:", error.message);
      throw error;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getToken();
    const userStr = await AsyncStorage.getItem("staff_user");

    if (!token || !userStr) {
      return false;
    }

    try {
      const user = JSON.parse(userStr);
      return user.role === "salon_staff";
    } catch {
      return false;
    }
  },

  getCurrentUser: async (): Promise<StaffUser | null> => {
    try {
      const userStr = await AsyncStorage.getItem("staff_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("📱 Staff user from storage:", user.username);
        return user;
      }
      return null;
    } catch (error: any) {
      console.error("❌ Error getting staff user from storage:", error.message);
      return null;
    }
  },

  // ==================== BREAK MANAGEMENT ====================

  startBreak: async (breakData: BreakData): Promise<ApiResponse<any>> => {
    try {
      console.log("☕ Starting break...", breakData);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/break-start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(breakData),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Break started successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error starting break:", error.message);
      throw error;
    }
  },

  endBreak: async (location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      console.log("☕ Ending break...", location);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/break-end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location || {}),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Break ended successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error ending break:", error.message);
      throw error;
    }
  },

  getBreakStatus: async (): Promise<ApiResponse<BreakStatusResponse>> => {
    try {
      console.log("🔍 Checking break status...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/break-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Break status fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching break status:", error.message);
      throw error;
    }
  },

  // ==================== ATTENDANCE MANAGEMENT ====================

  clockIn: async (
    location: ClockInData,
  ): Promise<ApiResponse<AttendanceRecord>> => {
    try {
      console.log("🕒 Staff clocking in...", location);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff clocked in successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error in staff clock-in:", error.message);
      throw error;
    }
  },

  clockOut: async (
    location?: ClockOutData,
  ): Promise<ApiResponse<AttendanceRecord>> => {
    try {
      console.log("🕒 Staff clocking out...", location);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location || {}),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff clocked out successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error in staff clock-out:", error.message);
      throw error;
    }
  },

  getAttendanceDashboard: async (
    year?: number,
    month?: number,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching staff attendance dashboard...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());

      const response = await fetch(
        `${API_BASE_URL}/attendance/dashboard?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff attendance dashboard fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching attendance dashboard:", error.message);
      throw error;
    }
  },

  getAttendanceHistory: async (
    page = 1,
    limit = 30,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<AttendanceRecord[]>> => {
    try {
      console.log("📅 Fetching staff attendance history...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${API_BASE_URL}/attendance/history?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff attendance history fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching attendance history:", error.message);
      throw error;
    }
  },

  getMonthlyStats: async (
    year?: number,
    month?: number,
  ): Promise<ApiResponse<MonthlyAttendanceStats>> => {
    try {
      console.log("📈 Fetching staff monthly attendance stats...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());

      const response = await fetch(
        `${API_BASE_URL}/attendance/monthly-stats?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff monthly stats fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching monthly stats:", error.message);
      throw error;
    }
  },

  getMonthlyChart: async (year?: number): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching staff monthly attendance chart...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());

      const response = await fetch(
        `${API_BASE_URL}/attendance/monthly-chart?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff monthly chart data fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching monthly chart:", error.message);
      throw error;
    }
  },

  getCurrentStatus: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("🔍 Checking staff current attendance status...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/attendance/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff current status fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching current status:", error.message);
      throw error;
    }
  },

  getAttendanceReport: async (
    year?: number,
    month?: number,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📋 Fetching staff attendance report...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());

      const response = await fetch(
        `${API_BASE_URL}/staff/attendance/report?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff attendance report fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching attendance report:", error.message);
      throw error;
    }
  },

  // ==================== TRAINING MODULES ====================

  getTrainingModules: async (filters?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<LearningModule[]>> => {
    try {
      console.log("📚 Fetching training modules for staff...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.status) params.append("status", filters.status || "");
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "20");

      const response = await fetch(
        `${API_BASE_URL}/staff/training-modules?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log(
        "✅ Training modules fetched for staff:",
        data.data?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error(
        "❌ Error fetching training modules for staff:",
        error.message,
      );
      throw error;
    }
  },

  getTrainingModule: async (
    moduleId: string,
  ): Promise<ApiResponse<LearningModule>> => {
    try {
      console.log("📖 Fetching training module details:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/training-modules/${moduleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Training module details fetched");
      return data;
    } catch (error: any) {
      console.error(
        "❌ Error fetching training module details:",
        error.message,
      );
      throw error;
    }
  },

  // ==================== LEARNING MODULES & TRAINING ====================

  getLearningModules: async (filters?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    featured?: boolean;
    popular?: boolean;
    minRating?: number;
    hasQuiz?: boolean;
  }): Promise<ApiResponse<LearningModule[]>> => {
    try {
      console.log("📚 Fetching learning modules with filters:", filters);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.status) params.append("status", filters.status || "");
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "20");
      if (filters?.search) params.append("search", filters.search);
      if (filters?.difficulty) params.append("difficulty", filters.difficulty);
      if (filters?.featured)
        params.append("featured", filters.featured.toString());
      if (filters?.popular)
        params.append("popular", filters.popular.toString());
      if (filters?.minRating)
        params.append("minRating", filters.minRating.toString());
      if (filters?.hasQuiz)
        params.append("hasQuiz", filters.hasQuiz.toString());

      const response = await fetch(
        `${API_BASE_URL}/learning-modules?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Learning modules fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching learning modules:", error.message);
      throw error;
    }
  },

  getFeaturedModules: async (): Promise<ApiResponse<LearningModule[]>> => {
    try {
      console.log("⭐ Fetching featured learning modules...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/featured`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Featured modules fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching featured modules:", error.message);
      throw error;
    }
  },

  getModule: async (moduleId: string): Promise<ApiResponse<LearningModule>> => {
    try {
      console.log("📖 Fetching learning module details:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Learning module details fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching module details:", error.message);
      throw error;
    }
  },

  enrollInModule: async (moduleId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("🎓 Enrolling in module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Successfully enrolled in module");
      return data;
    } catch (error: any) {
      console.error("❌ Error enrolling in module:", error.message);
      throw error;
    }
  },

  updateProgress: async (
    moduleId: string,
    progressData: {
      progress: number;
      timeSpent: number;
      notes?: string;
    },
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📈 Updating module progress:", moduleId, progressData);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(progressData),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Module progress updated");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating module progress:", error.message);
      throw error;
    }
  },

  getModuleProgress: async (moduleId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching module progress:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/progress`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Module progress fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching module progress:", error.message);
      throw error;
    }
  },

  submitQuizAttempt: async (
    moduleId: string,
    attemptData: {
      score: number;
      passed: boolean;
      answers: Array<{
        questionId: string;
        selectedAnswer: string;
        isCorrect: boolean;
        pointsEarned?: number;
      }>;
      timeSpent: number;
      correctAnswers: number;
      totalQuestions: number;
    },
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📝 Submitting quiz attempt for module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/quiz/attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(attemptData),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Quiz attempt submitted successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error submitting quiz attempt:", error.message);
      throw error;
    }
  },

  getQuizResults: async (moduleId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching quiz results for module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/quiz/results`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Quiz results fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching quiz results:", error.message);
      throw error;
    }
  },

  getQuizAnalytics: async (moduleId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📈 Fetching quiz analytics for module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/quiz/analytics`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Quiz analytics fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching quiz analytics:", error.message);
      throw error;
    }
  },

  toggleBookmark: async (moduleId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("🔖 Toggling bookmark for module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/bookmark`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Bookmark toggled successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error toggling bookmark:", error.message);
      throw error;
    }
  },

  submitLegacyQuiz: async (
    moduleId: string,
    answers: number[],
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📝 Submitting legacy quiz for module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/${moduleId}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Legacy quiz submitted successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error submitting legacy quiz:", error.message);
      throw error;
    }
  },

  completeModule: async (
    moduleId: string,
    completionData: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      pointsEarned: number;
    },
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🎓 Completing learning module:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/learning-modules/${moduleId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(completionData),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Learning module completed successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error completing learning module:", error.message);
      throw error;
    }
  },

  getUserDashboard: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching user learning dashboard...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/learning-modules/user/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ User dashboard fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user dashboard:", error.message);
      throw error;
    }
  },

  // ==================== FAVORITES (LEARNING MODULES) ====================

  getFavoriteModules: async (): Promise<
    ApiResponse<FavoriteLearningModule[]>
  > => {
    try {
      console.log("⭐ Fetching favorite learning modules...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/favorites/learning-modules`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Favorite modules fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching favorite modules:", error.message);
      throw error;
    }
  },

  addFavoriteModule: async (
    moduleId: string,
  ): Promise<ApiResponse<FavoriteLearningModule>> => {
    try {
      console.log("⭐ Adding learning module to favorites:", moduleId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/favorites/learning-modules/${moduleId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Module added to favorites successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error adding module to favorites:", error.message);
      throw error;
    }
  },

  removeFavoriteModule: async (
    favoriteId: string,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Removing learning module from favorites:", favoriteId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/favorites/learning-modules/${favoriteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Module removed from favorites");
      return data;
    } catch (error: any) {
      console.error("❌ Error removing module from favorites:", error.message);
      throw error;
    }
  },

  checkFavorite: async (moduleId: string): Promise<{ isFavorite: boolean }> => {
    try {
      console.log("🔍 Checking if module is favorite:", moduleId);

      const token = await getToken();
      if (!token) {
        return { isFavorite: false };
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/check/${moduleId}`,
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

  // ==================== STAFF DASHBOARD ====================

  getDashboard: async (): Promise<ApiResponse<StaffDashboard>> => {
    try {
      console.log("📊 Fetching staff dashboard...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff dashboard fetched successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching staff dashboard:", error.message);
      throw error;
    }
  },

  getStaffProfile: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("👤 Fetching staff profile with performance...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/staff/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff profile with performance fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching staff profile:", error.message);
      throw error;
    }
  },

  updateStaffProfile: async (updates: any): Promise<ApiResponse<any>> => {
    try {
      console.log("👤 Updating staff profile...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/staff/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff profile updated successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating staff profile:", error.message);
      throw error;
    }
  },

  // ==================== BOOKING MANAGEMENT ====================

  getAllBookingsForStaff: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    try {
      console.log("📋 Fetching all bookings for staff...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "100");

      const response = await fetch(
        `${API_BASE_URL}/staff/client-bookings?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ All bookings fetched for staff:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching all bookings for staff:", error.message);
      throw error;
    }
  },

  updateBookingStatus: async (
    bookingId: string,
    status: "completed" | "cancelled" | "confirmed" | "pending",
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🔄 Updating booking status:", bookingId, status);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            adminNotes: "Updated by salon staff",
            updatedBy: "staff",
          }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Booking status updated successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating booking status:", error.message);
      throw error;
    }
  },

  // ==================== APPOINTMENT MANAGEMENT - FIXED ENDPOINTS ====================

  getAppointments: async (filters?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    try {
      console.log("📅 Fetching staff appointments...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.date) params.append("date", filters.date);
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "50"); // Increased limit

      // FIXED: Use the correct staff appointments endpoint
      const response = await fetch(
        `${API_BASE_URL}/staff/appointments?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);

      // FIXED: Handle different response structures
      let appointmentsData = data.data;

      // If the response has a nested data structure
      if (data.data && data.data.appointments) {
        appointmentsData = data.data.appointments;
      } else if (data.data && Array.isArray(data.data)) {
        appointmentsData = data.data;
      } else if (Array.isArray(data)) {
        appointmentsData = data;
      }

      console.log(
        "✅ Staff appointments fetched:",
        appointmentsData?.length || 0,
      );

      return {
        success: data.success,
        message: data.message,
        data: appointmentsData || [],
        count: appointmentsData?.length || 0,
      };
    } catch (error: any) {
      console.error("❌ Error fetching staff appointments:", error.message);
      throw error;
    }
  },

  getAllClientAppointments: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    try {
      console.log("📅 Fetching all client appointments for staff...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "50");

      const response = await fetch(
        `${API_BASE_URL}/staff/client-bookings?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log(
        "✅ All client appointments fetched:",
        data.data?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching client appointments:", error.message);
      throw error;
    }
  },

  getClientBookings: async (filters?: {
    status?: string;
    date?: string;
    stylistId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    try {
      console.log("📅 Fetching client bookings for staff...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.date) params.append("date", filters.date);
      if (filters?.stylistId) params.append("stylistId", filters.stylistId);
      if (filters?.page) params.append("page", filters.page?.toString() || "1");
      if (filters?.limit)
        params.append("limit", filters.limit?.toString() || "20");

      const response = await fetch(`${API_BASE_URL}/bookings/staff?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Client bookings fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching client bookings:", error.message);
      throw error;
    }
  },

  updateAppointmentStatus: async (
    appointmentId: string,
    updates: {
      status?: string;
      adminNotes?: string;
      preferredDate?: string;
      preferredTime?: string;
    },
  ): Promise<ApiResponse<Appointment>> => {
    try {
      console.log("🔄 Updating appointment status:", appointmentId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Appointment status updated successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating appointment status:", error.message);
      throw error;
    }
  },

  // FIXED: Complete appointment function - WITH BETTER ERROR HANDLING
  completeAppointment: async (
    appointmentId: string,
  ): Promise<ApiResponse<Appointment>> => {
    try {
      console.log("✅ Completing appointment:", appointmentId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIXED: Use the correct endpoint from appointmentRoutes.js
      const response = await fetch(
        `${API_BASE_URL}/appointments/staff/${appointmentId}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            staffNotes: "Appointment completed by staff",
          }),
        },
      );

      // If the first attempt fails with 404, try the regular appointments endpoint
      if (response.status === 404) {
        console.log("🔄 Trying alternative endpoint...");
        const altResponse = await fetch(
          `${API_BASE_URL}/appointments/${appointmentId}/complete`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              staffNotes: "Appointment completed by staff",
            }),
          },
        );

        const altData = await handleApiResponse(altResponse);
        console.log("✅ Appointment completed via alternative endpoint");
        return altData;
      }

      const data = await handleApiResponse(response);
      console.log("✅ Appointment completed successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error completing appointment:", error.message);
      throw error;
    }
  },

  // FIXED: Cancel appointment function - USING CORRECT ENDPOINT
  cancelAppointment: async (
    appointmentId: string,
    cancellationReason?: string,
  ): Promise<ApiResponse<Appointment>> => {
    try {
      console.log("❌ Cancelling appointment:", appointmentId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIXED: Use the correct endpoint from appointmentRoutes.js
      const response = await fetch(
        `${API_BASE_URL}/appointments/staff/${appointmentId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cancellationReason: cancellationReason || "Cancelled by staff",
            staffNotes: "Appointment cancelled by staff",
          }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Appointment cancelled successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error cancelling appointment:", error.message);
      throw error;
    }
  },

  // FIXED: Delete appointment function - WITH BETTER ERROR HANDLING
  deleteAppointment: async (
    appointmentId: string,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Deleting appointment:", appointmentId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIXED: Use the appointments endpoint, not staff-specific
      const response = await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // If the first attempt fails with 404, try the staff endpoint
      if (response.status === 404) {
        console.log("🔄 Trying staff endpoint for deletion...");
        const altResponse = await fetch(
          `${API_BASE_URL}/appointments/staff/${appointmentId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const altData = await handleApiResponse(altResponse);
        console.log("✅ Appointment deleted via staff endpoint");
        return altData;
      }

      const data = await handleApiResponse(response);
      console.log("✅ Appointment deleted successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error deleting appointment:", error.message);
      throw error;
    }
  },

  // ==================== LEADERBOARD ====================

  getLeaderboard: async (
    type = "overall",
    limit = 50,
  ): Promise<ApiResponse<LeaderboardEntry[]>> => {
    try {
      console.log("🏆 Fetching staff leaderboard...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/staff/leaderboard?type=${type}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Leaderboard fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching leaderboard:", error.message);
      throw error;
    }
  },

  getTopPerformers: async (
    type = "overall",
  ): Promise<ApiResponse<LeaderboardEntry[]>> => {
    try {
      console.log("🏅 Fetching top performers...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/leaderboards/top-performers?type=${type}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Top performers fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching top performers:", error.message);
      throw error;
    }
  },

  getUserProfile: async (userId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("👤 Fetching user leaderboard profile:", userId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/leaderboards/profile/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ User leaderboard profile fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user profile:", error.message);
      throw error;
    }
  },

  getStatistics: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("📊 Fetching leaderboard statistics...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/leaderboards/statistics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Leaderboard statistics fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching leaderboard statistics:", error.message);
      throw error;
    }
  },
};

// Utility Functions for Staff
export const staffUtils = {
  // Get current position using GPS
  getCurrentPosition: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  },

  // Format working hours
  formatWorkingHours: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  },

  // Calculate distance between coordinates (for GPS validation feedback)
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  },

  // Get salon coordinates (SandreaLee Salon)
  getSalonCoordinates: (): { latitude: number; longitude: number } => {
    return {
      latitude: 14.5995, // SandreaLee Salon coordinates
      longitude: 120.9842,
    };
  },

  // Check if location is within salon radius (5km)
  isWithinSalonRadius: (userLat: number, userLng: number): boolean => {
    const salon = staffUtils.getSalonCoordinates();
    const distance = staffUtils.calculateDistance(
      userLat,
      userLng,
      salon.latitude,
      salon.longitude,
    );
    return distance <= 5; // 5km radius
  },

  // Format appointment time for display
  formatAppointmentTime: (date: string, time: string): string => {
    const appointmentDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return `${appointmentDate.toLocaleDateString("en-US", options)} at ${time}`;
  },

  // Calculate module progress percentage
  calculateProgressPercentage: (progress: UserProgress): number => {
    return Math.round(progress.progress);
  },

  // Get status color for appointments
  getAppointmentStatusColor: (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#3B82F6"; // blue
      case "confirmed":
        return "#10B981"; // green
      case "completed":
        return "#6B7280"; // gray
      case "cancelled":
        return "#EF4444"; // red
      case "pending":
        return "#F59E0B"; // amber
      default:
        return "#6B7280"; // gray
    }
  },

  // Get status color for attendance
  getAttendanceStatusColor: (status: string): string => {
    switch (status) {
      case "present":
        return "#10B981"; // green
      case "late":
        return "#F59E0B"; // amber
      case "absent":
        return "#EF4444"; // red
      case "half-day":
        return "#8B5CF6"; // violet
      case "on-break":
        return "#F59E0B"; // amber for break
      default:
        return "#6B7280"; // gray
    }
  },

  // Format quiz score for display
  formatQuizScore: (score: number, total: number): string => {
    return `${score}/${total} (${Math.round((score / total) * 100)}%)`;
  },

  // Get difficulty color
  getDifficultyColor: (difficulty: string): string => {
    switch (difficulty) {
      case "beginner":
        return "#10B981"; // green
      case "intermediate":
        return "#F59E0B"; // amber
      case "advanced":
        return "#EF4444"; // red
      default:
        return "#6B7280"; // gray
    }
  },

  // Get status color for learning modules
  getModuleStatusColor: (status: string): string => {
    switch (status) {
      case "completed":
        return "#10B981"; // green
      case "in-progress":
        return "#3B82F6"; // blue
      case "not-started":
        return "#6B7280"; // gray
      case "paused":
        return "#F59E0B"; // amber
      default:
        return "#6B7280"; // gray
    }
  },

  // Check if user can take quiz
  canTakeQuiz: (progress: UserProgress, module: LearningModule): boolean => {
    if (!module.quiz?.isEnabled) return false;

    if (
      module.quiz.maxAttempts > 0 &&
      (progress.quizAttempts?.length || 0) >= module.quiz.maxAttempts
    ) {
      return false;
    }

    return module.quiz.allowRetakes || !progress.quizCompleted;
  },

  // Calculate quiz stats
  calculateQuizStats: (progress: UserProgress) => {
    const stats = {
      totalAttempts: progress.quizAttempts?.length || 0,
      bestScore: progress.bestScore || 0,
      lastScore: 0,
      averageScore: 0,
      passed: progress.quizCompleted || false,
    };

    if (progress.quizAttempts && progress.quizAttempts.length > 0) {
      const lastAttempt =
        progress.quizAttempts[progress.quizAttempts.length - 1];
      stats.lastScore = lastAttempt.score;

      const totalScore = progress.quizAttempts.reduce(
        (sum, attempt) => sum + attempt.score,
        0,
      );
      stats.averageScore = Math.round(
        totalScore / progress.quizAttempts.length,
      );
    }

    return stats;
  },

  // ADD BREAK UTILITY FUNCTIONS
  formatBreakTime: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  calculateBreakDuration: (breakStart: string, breakEnd?: string): number => {
    const start = new Date(breakStart);
    const end = breakEnd ? new Date(breakEnd) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  },

  getBreakTypeColor: (breakType: string): string => {
    switch (breakType) {
      case "lunch":
        return "#F59E0B"; // amber
      case "short":
        return "#3B82F6"; // blue
      case "personal":
        return "#8B5CF6"; // purple
      case "other":
        return "#6B7280"; // gray
      default:
        return "#6B7280"; // gray
    }
  },

  getBreakTypeIcon: (breakType: string): string => {
    switch (breakType) {
      case "lunch":
        return "restaurant";
      case "short":
        return "cafe";
      case "personal":
        return "person";
      case "other":
        return "ellipsis-horizontal";
      default:
        return "cafe";
    }
  },
};

export default staffApiClient;
