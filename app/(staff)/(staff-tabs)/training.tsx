// app/(auth)/(staff-tabs)/training.tsx - COMPLETE ENHANCED & FIXED VERSION
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  Dimensions,
  ImageBackground,
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { useFonts } from "expo-font";
import { useAuth } from "@/app/lib/authContext";
import {
  staffApiClient,
  type LearningModule as ApiLearningModule,
} from "@/app/lib/staffApiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const { width: screenWidth } = Dimensions.get("window");

// Employee status types
type EmployeeStatus = "working" | "rest-day" | "break-time" | "absent";

interface EmployeeStatusData {
  status: EmployeeStatus;
  message: string;
  color: string;
  icon: string;
}

const getStatusConfig = (status: EmployeeStatus): EmployeeStatusData => {
  const configs: Record<EmployeeStatus, EmployeeStatusData> = {
    working: {
      status: "working",
      message: "Working",
      color: "#10B981",
      icon: "checkmark-circle",
    },
    "break-time": {
      status: "break-time",
      message: "On Break",
      color: "#F59E0B",
      icon: "cafe",
    },
    "rest-day": {
      status: "rest-day",
      message: "Rest Day",
      color: "#3B82F6",
      icon: "bed",
    },
    absent: {
      status: "absent",
      message: "Not Clocked In",
      color: "#EF4444",
      icon: "close-circle",
    },
  };

  return configs[status];
};

const checkEmployeeStatus = async (): Promise<EmployeeStatusData> => {
  try {
    const token = await AsyncStorage.getItem("staff_token");
    if (!token) {
      return getStatusConfig("absent");
    }

    const response = await fetch(
      "https://sandrealeesalon.onrender.com/api/attendance/status",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      return getStatusConfig("absent");
    }

    const data = await response.json();

    if (data.success && data.data) {
      const attendance = data.data;

      if (attendance.status === "on-break") {
        return getStatusConfig("break-time");
      }

      if (attendance.clockInTime && !attendance.clockOutTime) {
        return getStatusConfig("working");
      }
    }

    // Check if today is rest day
    const today = new Date().getDay();
    if (today === 0) {
      // Sunday as rest day
      return getStatusConfig("rest-day");
    }

    return getStatusConfig("absent");
  } catch (error) {
    console.error("Error checking employee status:", error);
    return getStatusConfig("absent");
  }
};

// ==================== ENHANCED IMAGE URL VALIDATION ====================
const getSafeImageUrl = (imageUrl: any): string => {
  console.log("🔍 Validating image URL:", imageUrl, typeof imageUrl);

  // Handle null/undefined
  if (!imageUrl) {
    console.log("❌ Image URL is null/undefined, using fallback");
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }

  // Handle numeric values
  if (typeof imageUrl === "number") {
    console.log("❌ Image URL is a number, using fallback");
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }

  // Handle invalid types
  if (typeof imageUrl !== "string") {
    console.log("❌ Image URL is not a string, using fallback");
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }

  // Handle empty string
  if (imageUrl.trim() === "") {
    console.log("❌ Image URL is empty string, using fallback");
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }

  // Validate URL format
  try {
    // Check if it's a valid URL
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      console.log("✅ Image URL is valid HTTP URL");
      return imageUrl;
    }

    // Check if it's a data URL
    if (imageUrl.startsWith("data:")) {
      console.log("✅ Image URL is valid data URL");
      return imageUrl;
    }

    // Check if it's a local file path (starts with /)
    if (imageUrl.startsWith("/")) {
      console.log("✅ Image URL is local file path");
      return imageUrl;
    }

    console.log("❌ Image URL format is invalid, using fallback");
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  } catch (error) {
    console.log("❌ Error validating image URL:", error);
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }
};

// ==================== RANDOM HAIR STYLING IMAGES ====================
const getRandomHairStylingImage = (): string => {
  const hairStylingImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1594824436880-12a0ce1b87d9?w=400&h=200&fit=crop",
  ];

  const randomIndex = Math.floor(Math.random() * hairStylingImages.length);
  return hairStylingImages[randomIndex];
};

// Enhanced interface with better typing
interface TransformedLearningModule {
  id: string;
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: {
    name: string;
    bio: string;
    profileImage: string;
    credentials: string[];
  };
  progress: number;
  coverImage: string;
  estimatedDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "not-started" | "in-progress" | "completed";
  timeSpent: number;
  youtubeVideos: any[];
  content?: any;
  rating?: any;
  enrollment?: any;
  requirements?: string[];
  learningObjectives?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userProgress?: any;
  completionRate?: number;
  hasQuiz?: boolean;
  quizEnabled?: boolean;
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
}

export default function Training() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();

  // Enhanced state management
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<
    "Profile" | "Leaderboards" | "Favorites" | "Bookings"
  >("Profile");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [learningModules, setLearningModules] = useState<
    TransformedLearningModule[]
  >([]);
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatusData>(
    getStatusConfig("absent"),
  );

  // Enhanced search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string[]
  >([]);
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<
    string[]
  >([]);
  const [selectedResourceFilter, setSelectedResourceFilter] = useState<
    string[]
  >([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Enhanced animation refs
  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  // Check employee status
  const checkEmployeeStatusData = async () => {
    const status = await checkEmployeeStatus();
    setEmployeeStatus(status);
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchLearningModulesData();
      checkEmployeeStatusData();
    }
  }, [isAuthenticated, token]);

  const fetchLearningModulesData = async () => {
    try {
      setLoading(true);
      await fetchLearningModules();
    } catch (error) {
      console.error("Error fetching training data:", error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Unable to load learning modules. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningModules = async () => {
    try {
      console.log("📚 Fetching learning modules for training page...");

      const response = await staffApiClient.getLearningModules({
        status: "all",
        page: 1,
        limit: 50,
      });

      if (response.success && response.data) {
        console.log("✅ Learning modules fetched:", response.data.length);

        const transformedModules: TransformedLearningModule[] =
          response.data.map((module: any) => {
            const userProgress = module.userProgress;
            const progress = userProgress?.progress || module.progress || 0;
            const status = userProgress?.status || "not-started";
            const timeSpent = userProgress?.timeSpent || 0;

            const youtubeVideos = module.youtubeVideos || [];
            const resources = module.resources || [];

            const hasQuiz =
              module.quiz?.isEnabled ||
              (module.content?.quiz && module.content.quiz.length > 0) ||
              false;

            // FIXED: Enhanced cover image validation with random hair styling images
            const safeCoverImage = getSafeImageUrl(
              module.coverImage || getRandomHairStylingImage(),
            );

            // FIXED: Ensure estimatedDuration is exactly from backend
            const estimatedDuration = module.estimatedDuration || 60;

            return {
              id: module._id || module.id,
              _id: module._id,
              title: module.title,
              description: module.description,
              category: module.category || "General",
              instructor: module.instructor || {
                name: "SandreaLee Admin",
                bio: "Professional beauty education expert",
                profileImage: getSafeImageUrl(
                  module.createdBy?.profileImage || "",
                ),
                credentials: ["Certified Beauty Expert", "Master Stylist"],
              },
              progress: progress,
              coverImage: safeCoverImage,
              estimatedDuration: estimatedDuration, // FIXED: Use exact backend value
              difficulty: module.difficulty || "beginner",
              status: status,
              timeSpent: timeSpent,
              youtubeVideos: youtubeVideos,
              resources: resources,
              content: module.content,
              rating: module.rating,
              enrollment: module.enrollment,
              requirements: module.requirements,
              learningObjectives: module.learningObjectives,
              isActive: module.isActive,
              isFeatured: module.isFeatured,
              tags: module.tags,
              createdAt: module.createdAt,
              updatedAt: module.updatedAt,
              userProgress: userProgress,
              completionRate: module.completionRate,
              hasQuiz: hasQuiz,
              quizEnabled: hasQuiz,
              quiz: module.quiz,
              quizAnalytics: module.quizAnalytics,
            };
          });

        setLearningModules(transformedModules);
      } else {
        console.log("⚠️ No learning modules data received");
        setLearningModules([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching learning modules:", error.message);
      Toast.show({
        type: "error",
        text1: "Loading Error",
        text2: "Failed to load learning modules. Please try again.",
      });
      setLearningModules([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLearningModulesData();
    await checkEmployeeStatusData();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Learning modules updated successfully!",
    });
  };

  const toggleMenu = () => {
    const newVisible = !menuVisible;
    setMenuVisible(newVisible);
    const toValue = newVisible ? 1 : 0;
    const middleToValue = newVisible ? 0 : 1;

    Animated.parallel([
      Animated.timing(line1Rotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(line2Opacity, {
        toValue: middleToValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(line3Rotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(line1Translation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(line3Translation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Enhanced Profile Image Component
  const ProfileImage = ({ size = 42 }: { size?: number }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    // FIXED: Enhanced profile image URL validation
    const profileImageUrl = user?.profileImage
      ? getSafeImageUrl(
          user.profileImage.startsWith("/uploads/")
            ? `https://sandrealeesalon.onrender.com${user.profileImage}`
            : user.profileImage,
        )
      : null;

    return (
      <TouchableOpacity
        onPress={() => router.push("/(staff)/(staff-tabs)/profile")}
        style={[
          styles.profileImageContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          },
        ]}>
        {profileImageUrl && !imageError ? (
          <View style={{ position: "relative" }}>
            {imageLoading && (
              <View
                style={[
                  styles.imageLoadingPlaceholder,
                  { width: size, height: size, borderRadius: size / 2 },
                ]}>
                <ActivityIndicator size="small" color="#619AE4" />
              </View>
            )}
            <Image
              source={{ uri: profileImageUrl }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: imageLoading ? 0 : 1,
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: "#619AE4",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Ionicons name="person" size={size * 0.5} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Enhanced filtering functions
  const getFilteredLearningModules = () => {
    let filtered = learningModules;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (module) =>
          module.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          module.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.instructor?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          module.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Category filter
    if (selectedCategoryFilter.length > 0) {
      filtered = filtered.filter((module) =>
        selectedCategoryFilter.includes(module.category),
      );
    }

    // Active category filter
    if (activeCategory !== "All") {
      filtered = filtered.filter(
        (module) => module.category === activeCategory,
      );
    }

    // Difficulty filter
    if (selectedDifficultyFilter.length > 0) {
      filtered = filtered.filter((module) =>
        selectedDifficultyFilter.includes(module.difficulty),
      );
    }

    // Resource type filter
    if (selectedResourceFilter.length > 0) {
      filtered = filtered.filter((module) => {
        if (
          selectedResourceFilter.includes("videos") &&
          (module.youtubeVideos?.length ?? 0) > 0
        )
          return true;
        if (
          selectedResourceFilter.includes("websites") &&
          module.resources?.some((r) => r.type === "website")
        )
          return true;
        if (
          selectedResourceFilter.includes("documents") &&
          module.resources?.some((r) => r.type === "document")
        )
          return true;
        if (selectedResourceFilter.includes("quizzes") && module.hasQuiz)
          return true;
        return false;
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setSelectedCategoryFilter([]);
    setSelectedDifficultyFilter([]);
    setSelectedResourceFilter([]);
    setActiveCategory("All");
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    Toast.show({
      type: "success",
      text1: "Filters Applied",
      text2: `Showing ${getFilteredLearningModules().length} modules`,
    });
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategoryFilter((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleDifficultyFilter = (difficulty: string) => {
    setSelectedDifficultyFilter((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty],
    );
  };

  const toggleResourceFilter = (resourceType: string) => {
    setSelectedResourceFilter((prev) =>
      prev.includes(resourceType)
        ? prev.filter((r) => r !== resourceType)
        : [...prev, resourceType],
    );
  };

  // Enhanced grouping and statistics
  const getGroupedModules = () => {
    const filtered = getFilteredLearningModules();
    const grouped: { [key: string]: TransformedLearningModule[] } = {};

    filtered.forEach((module) => {
      const category = module.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(module);
    });

    return grouped;
  };

  // FIXED: Enhanced module press handler with comprehensive URL validation
  const handleModulePress = async (module: TransformedLearningModule) => {
    try {
      console.log("📱 Navigating to module:", module.id);

      // Ensure user is enrolled in the module
      if (!module.userProgress) {
        try {
          const enrollResponse = await staffApiClient.enrollInModule(
            module._id,
          );
          if (enrollResponse.success) {
            Toast.show({
              type: "success",
              text1: "Enrolled",
              text2: `You are now enrolled in ${module.title}`,
            });
          }
        } catch (enrollError) {
          console.log("Enrollment might already exist:", enrollError);
        }
      }

      // FIXED: Enhanced parameter validation
      const safeParams = {
        moduleId: module.id || "",
        moduleTitle: module.title || "Untitled Module",
        moduleDescription: module.description || "No description available",
        moduleCategory: module.category || "General",
        moduleInstructor: JSON.stringify(
          module.instructor || {
            name: "SandreaLee Admin",
            bio: "Professional beauty education",
            profileImage: "",
            credentials: [],
          },
        ),
        moduleCoverImage: getSafeImageUrl(module.coverImage),
        moduleDuration: (module.estimatedDuration || 60).toString(), // FIXED: Use exact backend duration
        moduleDifficulty: module.difficulty || "beginner",
        moduleHasQuiz: module.hasQuiz ? "true" : "false",
        moduleRequirements: JSON.stringify(module.requirements || []),
        moduleLearningObjectives: JSON.stringify(
          module.learningObjectives || [],
        ),
        moduleProgress: (module.progress || 0).toString(),
        moduleYoutubeVideos: JSON.stringify(module.youtubeVideos || []),
        moduleResources: JSON.stringify(module.resources || []),
        moduleStatus: module.status || "not-started",
        moduleQuiz: JSON.stringify(module.quiz || {}),
        moduleQuizAnalytics: JSON.stringify(module.quizAnalytics || {}),
      };

      console.log(
        "🚀 Navigating with safe parameters:",
        safeParams.moduleCoverImage,
      );

      // Navigate to the module detail page
      router.push({
        pathname: "/(staff)/(training)/ModuleDetails",
        params: safeParams,
      });
    } catch (error) {
      console.error("Error accessing module:", error);
      Toast.show({
        type: "error",
        text1: "Navigation Error",
        text2: "Failed to access learning module",
      });
    }
  };

  // Enhanced statistics functions
  const getUniqueCategories = () => {
    const categories = learningModules
      .map((module) => module.category)
      .filter(Boolean);
    return ["All", ...new Set(categories)];
  };

  const getUniqueDifficulties = () => {
    const difficulties = learningModules
      .map((module) => module.difficulty)
      .filter(Boolean);
    return [...new Set(difficulties)];
  };

  const getResourceStats = () => {
    const stats = {
      totalVideos: 0,
      totalWebsites: 0,
      totalDocuments: 0,
      totalQuizzes: 0,
    };

    learningModules.forEach((module) => {
      stats.totalVideos += module.youtubeVideos?.length || 0;
      stats.totalWebsites +=
        module.resources?.filter((r) => r.type === "website").length || 0;
      stats.totalDocuments +=
        module.resources?.filter((r) => r.type === "document").length || 0;
      if (module.hasQuiz) stats.totalQuizzes += 1;
    });

    return stats;
  };

  const getProgressStats = () => {
    const total = learningModules.length;
    const completed = learningModules.filter(
      (m) => m.status === "completed",
    ).length;
    const inProgress = learningModules.filter(
      (m) => m.status === "in-progress",
    ).length;
    const notStarted = learningModules.filter(
      (m) => m.status === "not-started",
    ).length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // ENHANCED: Module Card Component with improved layout, spacing, and thumbnail handling
  const ModuleCard = ({ module }: { module: TransformedLearningModule }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageError = () => {
      console.log("❌ Module card image error for:", module.title);
      setImageError(true);
      setImageLoading(false);
    };

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    // Use random hair styling image as fallback
    const moduleCoverImage = imageError
      ? getRandomHairStylingImage()
      : getSafeImageUrl(module.coverImage);

    return (
      <TouchableOpacity
        style={styles.moduleCard}
        onPress={() => handleModulePress(module)}>
        {/* ENHANCED: Module Cover Image Container with better spacing */}
        <View style={styles.moduleCoverContainer}>
          {imageLoading && (
            <View style={styles.moduleImageLoading}>
              <ActivityIndicator size="small" color="#619AE4" />
            </View>
          )}
          <Image
            source={{ uri: moduleCoverImage }}
            style={[styles.moduleCoverImage, { opacity: imageLoading ? 0 : 1 }]}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {imageError && (
            <View style={styles.moduleImageFallback}>
              <Ionicons name="cut-outline" size={32} color="#6B7280" />
              <Text style={styles.moduleImageFallbackText}>{module.title}</Text>
            </View>
          )}

          {/* Enhanced Overlay */}
          <View style={styles.moduleGradient} />

          {/* Status Badge */}
          <View style={styles.moduleStatusBadge}>
            <Text style={styles.moduleStatusText}>
              {module.status === "completed"
                ? "Completed"
                : module.status === "in-progress"
                  ? "In Progress"
                  : "Not Started"}
            </Text>
          </View>
        </View>

        {/* ENHANCED: Module Content with improved spacing and layout */}
        <View style={styles.moduleContent}>
          {/* Module Header with better spacing */}
          <View style={styles.moduleHeader}>
            <View style={styles.moduleTitleContainer}>
              <Text style={styles.moduleTitle} numberOfLines={2}>
                {module.title}
              </Text>
              {module.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>

            <View style={styles.moduleMeta}>
              <View style={styles.difficultyContainer}>
                <View
                  style={[
                    styles.difficultyBadge,
                    module.difficulty === "advanced" &&
                      styles.difficultyAdvanced,
                    module.difficulty === "intermediate" &&
                      styles.difficultyIntermediate,
                  ]}>
                  <Text style={styles.difficultyText}>
                    {module.difficulty.charAt(0).toUpperCase() +
                      module.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Instructor Info - FIXED: Always show "SandreaLee Admin" */}
          <View style={styles.instructorInfo}>
            <Ionicons name="person-outline" size={12} color="#9CA3AF" />
            <Text style={styles.instructorName}>SandreaLee Admin</Text>
          </View>

          {/* Progress Section with enhanced spacing */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {Math.round(module.progress || 0)}% Complete
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round(module.progress || 0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${module.progress || 0}%` },
                ]}
              />
            </View>
          </View>

          {/* ENHANCED: Module Footer with better spacing and layout */}
          <View style={styles.moduleFooter}>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.durationText}>
                {module.estimatedDuration} min{" "}
                {/* FIXED: Use exact backend duration */}
              </Text>
            </View>

            <View style={styles.moduleFeatures}>
              {module.hasQuiz && (
                <View style={styles.featureIcon}>
                  <Ionicons name="help-circle" size={14} color="#F59E0B" />
                </View>
              )}
              {module.youtubeVideos && module.youtubeVideos.length > 0 && (
                <View style={styles.featureIcon}>
                  <Ionicons name="play-circle" size={14} color="#EF4444" />
                </View>
              )}
              {module.resources && module.resources.length > 0 && (
                <View style={styles.featureIcon}>
                  <Ionicons name="document-text" size={14} color="#619AE4" />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#619AE4" />
            <Text style={styles.loadingText}>Loading Learning Modules...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const groupedModules = getGroupedModules();
  const uniqueCategories = getUniqueCategories();
  const uniqueDifficulties = getUniqueDifficulties();
  const resourceStats = getResourceStats();
  const progressStats = getProgressStats();

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header with Animation */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerButton}>
            <View style={styles.hamburgerContainer}>
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    transform: [
                      {
                        rotate: line1Rotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "45deg"],
                        }),
                      },
                      {
                        translateY: line1Translation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 9],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[styles.hamburgerLine, { opacity: line2Opacity }]}
              />
              <Animated.View
                style={[
                  styles.hamburgerLine,
                  {
                    transform: [
                      {
                        rotate: line3Rotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "-45deg"],
                        }),
                      },
                      {
                        translateY: line3Translation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -9],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require("../../../assets/images/SandreaLeeSalonLogoCapstone.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.salonText}>SALON</Text>
          </View>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Notifications",
                  text2: "You're up to date with learning modules",
                });
              }}>
              <Ionicons name="notifications-outline" size={22} color="white" />
            </TouchableOpacity>
            <ProfileImage size={42} />
          </View>
        </Animated.View>

        {/* Enhanced Menu */}
        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(staff)/(staff-tabs)/profile");
              }}>
              <Ionicons name="person-outline" size={20} color="#619AE4" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(staff)/(menu)/leaderboards");
              }}>
              <Ionicons name="trophy-outline" size={20} color="#619AE4" />
              <Text style={styles.menuText}>Leaderboards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(staff)/(menu)/favorites");
              }}>
              <Ionicons name="heart-outline" size={20} color="#619AE4" />
              <Text style={styles.menuText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(staff)/(menu)/bookings");
              }}>
              <Ionicons name="calendar-outline" size={20} color="#619AE4" />
              <Text style={styles.menuText}>Client Bookings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search learning modules, categories, and instructors..."
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterIcon}
            onPress={() => setFilterModalVisible(true)}>
            <Feather name="filter" size={20} color="white" />
            {(selectedCategoryFilter.length > 0 ||
              selectedDifficultyFilter.length > 0 ||
              selectedResourceFilter.length > 0) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {selectedCategoryFilter.length +
                    selectedDifficultyFilter.length +
                    selectedResourceFilter.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Enhanced Main Content */}
        <Animated.ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#619AE4"
              colors={["#619AE4"]}
            />
          }
          showsVerticalScrollIndicator={false}>
          {/* Enhanced Greeting Section */}
          <View style={styles.greetingContainer}>
            <View style={styles.greetingContent}>
              <Text style={styles.greetingText}>
                {getGreeting()},{" "}
                <Text style={styles.usernameText}>
                  {user?.firstName || user?.username || "Team Member"}
                </Text>
              </Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: employeeStatus.color },
                  ]}>
                  <Ionicons
                    name={employeeStatus.icon as any}
                    size={16}
                    color="white"
                  />
                  <Text style={styles.statusText}>
                    {employeeStatus.message}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {employeeStatus.status === "working"
                    ? "You're currently clocked in and working"
                    : employeeStatus.status === "break-time"
                      ? "You're currently on break"
                      : employeeStatus.status === "rest-day"
                        ? "Enjoy your day off!"
                        : "Clock in to start your work day"}
                </Text>
              </View>
            </View>
          </View>

          {/* ENHANCED: Progress Overview with Background Image */}
          <ImageBackground
            source={images.trainingBanner}
            style={styles.progressOverview}
            imageStyle={styles.progressOverviewBackground}>
            <View style={styles.progressOverviewOverlay}>
              <Text style={styles.progressOverviewTitle}>
                Learning Progress
              </Text>
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatNumber}>
                    {progressStats.total}
                  </Text>
                  <Text style={styles.progressStatLabel}>Total Modules</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatNumber}>
                    {progressStats.completed}
                  </Text>
                  <Text style={styles.progressStatLabel}>Completed</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatNumber}>
                    {progressStats.inProgress}
                  </Text>
                  <Text style={styles.progressStatLabel}>In Progress</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatNumber}>
                    {progressStats.completionRate}%
                  </Text>
                  <Text style={styles.progressStatLabel}>Completion Rate</Text>
                </View>
              </View>
            </View>
          </ImageBackground>

          {/* Enhanced Category Quick Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilterContainer}
            contentContainerStyle={styles.categoryFilterContent}>
            {uniqueCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryFilter,
                  activeCategory === category && styles.categoryFilterActive,
                ]}
                onPress={() => setActiveCategory(category)}>
                <Text
                  style={[
                    styles.categoryFilterText,
                    activeCategory === category &&
                      styles.categoryFilterTextActive,
                  ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Enhanced Learning Modules Content */}
          {Object.keys(groupedModules).length > 0 ? (
            Object.entries(groupedModules).map(([category, modules]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.categoryCount}>
                      {modules.length} module{modules.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#619AE4"
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalModulesContainer}
                  contentContainerStyle={styles.horizontalModulesContent}>
                  {modules.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </ScrollView>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="book-outline" size={64} color="#6B7280" />
              </View>
              <Text style={styles.emptyStateText}>
                No learning modules found
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ||
                selectedCategoryFilter.length > 0 ||
                selectedDifficultyFilter.length > 0 ||
                selectedResourceFilter.length > 0
                  ? "Try adjusting your search or filters"
                  : "Check back later for new training content"}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchLearningModulesData}>
                <Text style={styles.retryButtonText}>Refresh Modules</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.ScrollView>

        {/* Enhanced Filter Modal */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Modules</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}>
                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Categories</Text>
                  <View style={styles.filterOptions}>
                    {uniqueCategories
                      .filter((cat) => cat !== "All")
                      .map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.filterChip,
                            selectedCategoryFilter.includes(category) &&
                              styles.filterChipActive,
                          ]}
                          onPress={() => toggleCategoryFilter(category)}>
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedCategoryFilter.includes(category) &&
                                styles.filterChipTextActive,
                            ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>

                {/* Difficulty Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Difficulty Level
                  </Text>
                  <View style={styles.filterOptions}>
                    {uniqueDifficulties.map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty}
                        style={[
                          styles.filterChip,
                          selectedDifficultyFilter.includes(difficulty) &&
                            styles.filterChipActive,
                        ]}
                        onPress={() => toggleDifficultyFilter(difficulty)}>
                        <Ionicons
                          name="bar-chart-outline"
                          size={16}
                          color={
                            selectedDifficultyFilter.includes(difficulty)
                              ? "white"
                              : "#619AE4"
                          }
                        />
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedDifficultyFilter.includes(difficulty) &&
                              styles.filterChipTextActive,
                          ]}>
                          {difficulty.charAt(0).toUpperCase() +
                            difficulty.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Resource Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Resource Types</Text>
                  <View style={styles.filterOptions}>
                    {[
                      {
                        key: "videos",
                        label: "Videos",
                        icon: "play-circle",
                        color: "#EF4444",
                      },
                      {
                        key: "websites",
                        label: "Websites",
                        icon: "link",
                        color: "#619AE4",
                      },
                      {
                        key: "documents",
                        label: "Documents",
                        icon: "document-text",
                        color: "#10B981",
                      },
                      {
                        key: "quizzes",
                        label: "Quizzes",
                        icon: "help-circle",
                        color: "#F59E0B",
                      },
                    ].map((resource) => (
                      <TouchableOpacity
                        key={resource.key}
                        style={[
                          styles.filterChip,
                          selectedResourceFilter.includes(resource.key) &&
                            styles.filterChipActive,
                        ]}
                        onPress={() => toggleResourceFilter(resource.key)}>
                        <Ionicons
                          name={resource.icon as any}
                          size={16}
                          color={
                            selectedResourceFilter.includes(resource.key)
                              ? "white"
                              : resource.color
                          }
                        />
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedResourceFilter.includes(resource.key) &&
                              styles.filterChipTextActive,
                          ]}>
                          {resource.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
  },

  // Enhanced Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0A0E17",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  hamburgerButton: { padding: 4, width: 36 },
  hamburgerContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    backgroundColor: "white",
    marginVertical: 2,
    borderRadius: 1,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  headerLogo: { width: 36, height: 36 },
  salonText: {
    color: "#619AE4",
    fontSize: 24,
    top: 5,
    fontFamily: "TenaliRamakrishna-Regular",
    marginLeft: -2,
    letterSpacing: 0.5,
  },
  rightIcons: { flexDirection: "row", alignItems: "center", gap: 16 },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageContainer: {
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(97, 154, 228, 0.3)",
  },
  imageLoadingPlaceholder: {
    position: "absolute",
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  // Enhanced Menu Styles
  menu: {
    position: "absolute",
    top: 80,
    left: 20,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 8,
    zIndex: 1001,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },

  // Enhanced Search and Filter
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "400",
  },
  filterIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#374151",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#619AE4",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },

  // Enhanced Content Styles
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Enhanced Greeting Section
  greetingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  greetingContent: {
    flexDirection: "column",
    gap: 16,
  },
  greetingText: {
    color: "#9CA3AF",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "400",
  },
  usernameText: {
    color: "white",
    fontWeight: "700",
  },
  statusContainer: {
    flexDirection: "column",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  statusDescription: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "400",
  },

  // ENHANCED: Progress Overview with Background Image
  progressOverview: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
  },
  progressOverviewBackground: {
    borderRadius: 20,
    opacity: 0.8,
  },
  progressOverviewOverlay: {
    backgroundColor: "rgba(10, 14, 23, 0.85)",
    padding: 20,
  },
  progressOverviewTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStat: {
    alignItems: "center",
    gap: 4,
  },
  progressStatNumber: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  progressStatLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },

  // Enhanced Category Filters
  categoryFilterContainer: {
    marginBottom: 24,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  categoryFilterActive: {
    backgroundColor: "#619AE4",
    borderColor: "#619AE4",
  },
  categoryFilterText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  categoryFilterTextActive: {
    color: "white",
    fontWeight: "600",
  },

  // Enhanced Category Sections
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoryTitleContainer: {
    flexDirection: "column",
    gap: 4,
  },
  categoryTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  categoryCount: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },

  // Enhanced Horizontal Modules
  horizontalModulesContainer: {
    marginBottom: 8,
  },
  horizontalModulesContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // ENHANCED: Module Cards with better spacing and layout
  moduleCard: {
    width: 280,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
    position: "relative",
    marginBottom: 8,
  },
  moduleCoverContainer: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: "#374151",
  },
  moduleCoverImage: {
    width: "100%",
    height: 160,
  },
  moduleImageLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  moduleImageFallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  moduleImageFallbackText: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  // FIXED: Removed invalid gradient property
  moduleGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  moduleStatusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moduleStatusText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  moduleContent: {
    padding: 16,
  },
  moduleHeader: {
    marginBottom: 8,
  },
  moduleTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  moduleTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  featuredText: {
    color: "#F59E0B",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  moduleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyBadge: {
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyIntermediate: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  difficultyAdvanced: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  difficultyText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  instructorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  instructorName: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  progressPercentage: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#619AE4",
    borderRadius: 2,
  },
  moduleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  moduleFeatures: {
    flexDirection: "row",
    gap: 8,
  },
  featureIcon: {
    padding: 4,
  },

  // Enhanced Empty States
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  modalScroll: {
    maxHeight: "70%",
    paddingHorizontal: 24,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  filterSectionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#374151",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  filterChipActive: {
    backgroundColor: "#619AE4",
    borderColor: "#619AE4",
  },
  filterChipText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "white",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  clearButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
});
