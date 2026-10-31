import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Linking,
  Modal,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useFonts } from "expo-font";
import {
  apiClient,
  Service,
  RatingBreakdown,
  RatingPercentages,
  Notification,
} from "@/app/api/apiClient";
import { SvgUri } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface User {
  id: string;
  username?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  isGuest?: boolean;
}

type SortOption =
  | "default"
  | "category"
  | "promo"
  | "price-low"
  | "price-high"
  | "duration"
  | "popularity"
  | "availability"
  | "ascending"
  | "descending"
  | "most-booked"
  | "top-rated"
  | "newest";

// Interface for notification with gesture handling
interface NotificationItemWithGesture extends Notification {
  translateX: Animated.Value;
  isSwiping: boolean;
}

// Type-safe Ionicons wrapper component
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SafeIonicons: React.FC<{
  name: IoniconsName;
  size: number;
  color: string;
  style?: any;
}> = ({ name, size, color, style }) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};

export default function ServicesScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [activeSortOption, setActiveSortOption] =
    useState<SortOption>("default");
  const [searchQuery, setSearchQuery] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<
    NotificationItemWithGesture[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationError, setNotificationError] = useState(false);

  // Notification detail overlay state
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [notificationDetailVisible, setNotificationDetailVisible] =
    useState(false);

  // Filter states
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<
    string[]
  >([]);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<string[]>([]);
  const [selectedPopularity, setSelectedPopularity] = useState<string[]>([]);

  const categoryScrollRef = useRef<ScrollView>(null);
  const categoryItemRefs = useRef<{ [key: number]: View | null }>({});
  const categoryScrollX = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;

  // ✨ ADDED: Enhanced swipe to delete handler
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      console.log("🗑️ Deleting notification:", notificationId);

      // Check authentication first
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth || user?.isGuest) {
        Toast.show({
          type: "error",
          text1: "Authentication Required",
          text2: "Please sign in to manage notifications",
        });
        return;
      }

      // Remove from local state immediately for better UX
      setNotifications((prev) => {
        const updatedNotifications = prev.filter(
          (n) => n._id !== notificationId,
        );
        console.log(
          "📝 Local state updated, remaining notifications:",
          updatedNotifications.length,
        );
        return updatedNotifications;
      });

      // Update unread count if needed
      const deletedNotification = notifications.find(
        (n) => n._id === notificationId,
      );
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Call API to delete notification
      try {
        await apiClient.deleteNotification(notificationId);
        console.log("✅ Notification deleted from server");
      } catch (apiError) {
        console.error(
          "❌ Failed to delete from server, but removed locally:",
          apiError,
        );
        // Even if API fails, we keep the local removal for better UX
        Toast.show({
          type: "info",
          text1: "Notification removed",
          text2: "Changes will sync when online",
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Notification deleted",
      });
    } catch (error) {
      console.error("❌ Error in delete handler:", error);

      // Restore the notification if there was an error
      const deletedNotification = notifications.find(
        (n) => n._id === notificationId,
      );
      if (deletedNotification) {
        setNotifications((prev) => [...prev, deletedNotification]);
      }

      if (
        error instanceof Error &&
        (error.message?.includes("Authentication") ||
          error.message?.includes("401"))
      ) {
        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please sign in again",
        });
        setNotificationModalVisible(false);
        router.push("/(auth)" as any);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to delete notification",
        });
      }
    }
  };

  // ✨ ADDED: Left-swipe to delete component
  const SwipeableNotificationItem = ({
    notification,
    onPress,
    onDelete,
  }: {
    notification: NotificationItemWithGesture;
    onPress: (notification: Notification) => void;
    onDelete: (notificationId: string) => void;
  }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const swipeThreshold = -80; // How far to swipe LEFT to trigger delete
    const maxSwipe = -120; // Maximum swipe distance

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true },
    );

    const onHandlerStateChange = (event: any) => {
      const { nativeEvent } = event;

      if (nativeEvent.state === State.END) {
        // If swiped beyond threshold to the LEFT, trigger delete
        if (nativeEvent.translationX < swipeThreshold) {
          Animated.timing(translateX, {
            toValue: maxSwipe, // Slide to the left completely
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(notification._id);
          });
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }).start();
        }
      }
    };

    return (
      <View style={styles.notificationItemContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]} // Both left and right swipe sensitivity
          minPointers={1}>
          <Animated.View
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification,
              {
                transform: [{ translateX }],
              },
            ]}>
            {/* Delete background that becomes visible when swiping LEFT */}
            <Animated.View
              style={[
                styles.notificationDeleteBackground,
                {
                  opacity: translateX.interpolate({
                    inputRange: [swipeThreshold, 0],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      scale: translateX.interpolate({
                        inputRange: [swipeThreshold, 0],
                        outputRange: [1, 0.8],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}>
              <SafeIonicons name="trash-outline" size={20} color="white" />
              <Text style={styles.deleteText}>Delete</Text>
            </Animated.View>

            <TouchableOpacity
              style={styles.notificationContentWrapper}
              onPress={() => onPress(notification)}
              activeOpacity={0.7}>
              <View style={styles.notificationIconContainer}>
                <SafeIonicons
                  name={getNotificationIconName(notification.type)}
                  size={18}
                  color="#619AE4"
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitleText}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {apiClient.formatNotificationTime(notification.createdAt)}
                </Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  // ✨ ADDED: Notification press handler - shows overlay instead of routing
  const handleNotificationPress = async (notification: Notification) => {
    try {
      console.log("📱 Notification pressed:", notification.title);

      // Enhanced authentication check
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth || user?.isGuest) {
        console.log("User not authenticated, redirecting to login");
        setNotificationModalVisible(false);
        router.push("/(auth)" as any);
        return;
      }

      // Mark as read if unread
      if (!notification.isRead) {
        try {
          await apiClient.markNotificationAsRead(notification._id);
          // Update local state
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notification._id ? { ...n, isRead: true } : n,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (markError) {
          console.warn("⚠️ Could not mark notification as read:", markError);
          // Continue even if marking as read fails
        }
      }

      // Show notification detail overlay instead of routing
      setSelectedNotification(notification);
      setNotificationDetailVisible(true);
    } catch (error: any) {
      console.error("❌ Error handling notification press:", error);

      // If there's an authentication error, redirect to login
      if (
        error.message?.includes("Authentication") ||
        error.message?.includes("401")
      ) {
        setNotificationModalVisible(false);
        router.push("/(auth)" as any);
      } else {
        // For other errors, just show error
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to process notification",
        });
      }
    }
  };

  // ✨ ADDED: Enhanced Notification functions with better error handling
  const fetchNotifications = useCallback(async () => {
    try {
      console.log("🔔 Fetching notifications for Services screen...");

      // Check authentication first
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth) {
        console.log("🔐 User not authenticated, skipping notifications");
        setNotifications([]);
        setUnreadCount(0);
        setNotificationError(false);
        return;
      }

      const response = await apiClient.getNotifications({
        page: 1,
        limit: 10,
        unreadOnly: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        const notificationsWithGesture = (response.data || []).map(
          (notification) => ({
            ...notification,
            translateX: new Animated.Value(0),
            isSwiping: false,
          }),
        );
        setNotifications(notificationsWithGesture);
        setUnreadCount(response.unreadCount || 0);
        setNotificationError(false);
        console.log(
          `✅ Services: Loaded ${response.data?.length || 0} notifications, ${
            response.unreadCount || 0
          } unread`,
        );
      } else {
        console.warn(
          "⚠️ Notification response not successful:",
          response.message,
        );
        setNotifications([]);
        setUnreadCount(0);
        setNotificationError(true);
      }
    } catch (error: any) {
      console.error("❌ Error fetching notifications in Services:", error);

      // Don't show error for unauthorized users
      if (
        error.message?.includes("Authentication") ||
        error.message?.includes("401")
      ) {
        console.log("🔐 Authentication required for notifications");
        setNotifications([]);
        setUnreadCount(0);
        setNotificationError(false);
        return;
      }

      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError(true);

      // Only show Toast for unexpected errors
      if (!error.message?.includes("Authentication")) {
        Toast.show({
          type: "error",
          text1: "Connection Error",
          text2: "Unable to load notifications",
        });
      }
    }
  }, []);

  // ✨ ADDED: Retry mechanism for failed notification fetches
  const fetchNotificationsWithRetry = useCallback(
    async (retryCount = 0) => {
      try {
        setNotificationError(false);
        await fetchNotifications();
      } catch (error) {
        console.log("❌ Retry attempt failed:", retryCount);
        if (retryCount < 2) {
          // Retry after 2 seconds
          setTimeout(() => {
            fetchNotificationsWithRetry(retryCount + 1);
          }, 2000);
        } else {
          setNotificationError(true);
        }
      }
    },
    [fetchNotifications],
  );

  // ✨ ADDED: Handler for retry button press
  const handleRetryNotifications = useCallback(() => {
    fetchNotificationsWithRetry();
  }, [fetchNotificationsWithRetry]);

  // ✨ ADDED: Get notification icon name
  const getNotificationIconName = (type: string): IoniconsName => {
    switch (type) {
      case "appointment":
        return "calendar-outline";
      case "promotion":
        return "megaphone-outline";
      case "system":
        return "information-circle-outline";
      case "reminder":
        return "time-outline";
      default:
        return "notifications-outline";
    }
  };

  // ✨ ADDED: Mark all as read handler
  const handleMarkAllAsRead = async () => {
    try {
      // Check authentication first
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth || user?.isGuest) {
        Toast.show({
          type: "error",
          text1: "Authentication Required",
          text2: "Please sign in to manage notifications",
        });
        return;
      }

      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Toast.show({
        type: "success",
        text1: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error("❌ Error marking all as read:", error);

      if (
        error.message?.includes("Authentication") ||
        error.message?.includes("401")
      ) {
        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please sign in again",
        });
        // Optionally redirect to login
        router.push("/(auth)" as any);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to mark notifications as read",
        });
      }
    }
  };

  // FIXED: Memoized fetchData to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      console.log("🔧 Fetching all services...");
      setLoading(true);

      // Use the new sorting parameter structure
      let sortBy: string | undefined;
      let sortOrder: string | undefined;

      switch (activeSortOption) {
        case "price-low":
          sortBy = "price";
          sortOrder = "asc";
          break;
        case "price-high":
          sortBy = "price";
          sortOrder = "desc";
          break;
        case "duration":
          sortBy = "duration";
          sortOrder = "asc";
          break;
        case "most-booked":
          sortBy = "totalBookings";
          sortOrder = "desc";
          break;
        case "top-rated":
          sortBy = "rating";
          sortOrder = "desc";
          break;
        case "newest":
          sortBy = "createdAt";
          sortOrder = "desc";
          break;
        case "ascending":
          sortBy = "name";
          sortOrder = "asc";
          break;
        case "descending":
          sortBy = "name";
          sortOrder = "desc";
          break;
        default:
          sortBy = undefined;
          sortOrder = undefined;
      }

      const servicesResponse = await apiClient.getAllServices(
        sortBy,
        sortOrder,
      );

      if (servicesResponse.success) {
        // FIXED: Better service data transformation with validation
        const transformedServices = servicesResponse.data.map(
          (service: Service) => {
            // Deep clone and validate the service object
            const serviceData = JSON.parse(JSON.stringify(service));

            // Ensure rating structure exists and is valid
            if (!serviceData.rating || typeof serviceData.rating !== "object") {
              serviceData.rating = {
                average: 0,
                totalRaters: 0,
                breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              };
            } else {
              // Validate and fix each rating property
              const rating = serviceData.rating;

              // Ensure numeric values
              rating.average =
                typeof rating.average === "number" ? rating.average : 0;
              rating.totalRaters =
                typeof rating.totalRaters === "number" ? rating.totalRaters : 0;

              // Ensure breakdown exists and is proper
              if (!rating.breakdown || typeof rating.breakdown !== "object") {
                rating.breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              } else {
                // Ensure all breakdown keys exist
                [1, 2, 3, 4, 5].forEach((num) => {
                  rating.breakdown[num] =
                    typeof rating.breakdown[num] === "number"
                      ? rating.breakdown[num]
                      : 0;
                });
              }

              // Ensure percentages exists and are proper
              if (
                !rating.percentages ||
                typeof rating.percentages !== "object"
              ) {
                rating.percentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              } else {
                // Ensure all percentage keys exist
                [1, 2, 3, 4, 5].forEach((num) => {
                  rating.percentages[num] =
                    typeof rating.percentages[num] === "number"
                      ? rating.percentages[num]
                      : 0;
                });
              }
            }

            return serviceData;
          },
        );

        setServices(transformedServices);
        console.log(
          "✅ Services fetched and validated:",
          transformedServices.length,
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load services.",
      });
    } finally {
      setLoading(false);
    }
  }, [activeSortOption]);

  // FIXED: Memoized applyFiltersAndSort
  const applyFiltersAndSort = useCallback(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      result = result.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeCategory > 0) {
      const categoryName = categories[activeCategory];
      result = result.filter((service) => service.category === categoryName);
    }

    if (selectedFilterCategories.length > 0) {
      result = result.filter((service) =>
        selectedFilterCategories.includes(service.category),
      );
    }

    if (selectedDuration.length > 0) {
      result = result.filter((service) => {
        const duration = parseDuration(service.duration);
        return selectedDuration.some((range) => {
          if (range === "Short (≤30 mins)") return duration <= 30;
          if (range === "Medium (30-60 mins)")
            return duration > 30 && duration <= 60;
          if (range === "Long (1hr+)") return duration > 60;
          return false;
        });
      });
    }

    if (selectedPriceRange.length > 0) {
      result = result.filter((service) => {
        const price = parsePrice(service.priceRange);
        return selectedPriceRange.some((range) => {
          if (range === "₱100-₱500") return price >= 100 && price <= 500;
          if (range === "₱500-₱1000") return price > 500 && price <= 1000;
          if (range === "₱1000+") return price > 1000;
          return false;
        });
      });
    }

    if (selectedRating.length > 0) {
      result = result.filter((service) => {
        const averageRating = service.rating?.average || 0;
        return selectedRating.some((rating) => {
          if (rating === "4+ stars") return averageRating >= 4;
          if (rating === "3+ stars") return averageRating >= 3;
          return false;
        });
      });
    }

    if (selectedPopularity.length > 0) {
      selectedPopularity.forEach((pop) => {
        if (pop === "Most Booked") {
          result.sort(
            (a, b) => (b.totalBookings || 0) - (a.totalBookings || 0),
          );
        } else if (pop === "Top Rated") {
          result.sort(
            (a, b) => (b.rating?.average || 0) - (a.rating?.average || 0),
          );
        }
      });
    }

    // Apply client-side sorting for options that don't require API calls
    switch (activeSortOption) {
      case "category":
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "promo":
        result.sort((a, b) => (b.isPromo ? 1 : 0) - (a.isPromo ? 1 : 0));
        break;
      case "availability":
        result.sort((a, b) => a.availability.localeCompare(b.availability));
        break;
      // Note: price, duration, most-booked, top-rated, newest, ascending, descending
      // are now handled server-side in fetchData
    }

    setFilteredServices(result);
  }, [
    services,
    searchQuery,
    activeCategory,
    selectedFilterCategories,
    selectedDuration,
    selectedPriceRange,
    selectedRating,
    selectedPopularity,
    activeSortOption,
  ]);

  // FIXED: Single useEffect for initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData();
      await checkAuthStatus();
    };

    loadInitialData();
  }, []); // Empty dependency array - only run once on mount

  // FIXED: Simplified useFocusEffect - only refresh when needed
  useFocusEffect(
    useCallback(() => {
      // Only refresh auth status, not services
      checkAuthStatus();
    }, []),
  );

  // ✨ ADDED: Separate useEffect for notifications that depends on auth status
  useEffect(() => {
    if (isLoggedIn && !user?.isGuest) {
      fetchNotificationsWithRetry();
    } else {
      // Clear notifications if user logs out or is guest
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError(false);
    }
  }, [isLoggedIn, user?.isGuest, fetchNotificationsWithRetry]);

  // FIXED: Separate useEffect for filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // FIXED: Separate useEffect for sort option changes that require API call
  useEffect(() => {
    if (activeSortOption !== "default") {
      fetchData();
    }
  }, [activeSortOption, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await checkAuthStatus();
    if (isLoggedIn && !user?.isGuest) {
      await fetchNotificationsWithRetry();
    }
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Services updated successfully!",
    });
  };

  const checkAuthStatus = async () => {
    try {
      const isAuth = await apiClient.isAuthenticated();

      if (!isAuth) {
        console.log("No authentication token found");
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      const profileResponse = await apiClient.getCurrentUser();

      if (profileResponse.success && profileResponse.user) {
        const userData = profileResponse.user;

        if (userData.isGuest) {
          console.log("Logged in user is guest - clearing session");
          await apiClient.logout();
          setIsLoggedIn(false);
          setUser(null);
        } else {
          console.log("Logged in user:", userData.username);
          setIsLoggedIn(true);
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            profileImage: userData.profileImage,
            role: userData.role,
            isGuest: false,
          });
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error checking auth:", error.message);
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const getProfileImageUrl = async () => {
    if (isLoggedIn && user && !user.isGuest) {
      if (user.profileImage) {
        if (user.profileImage.startsWith("http")) {
          return { uri: user.profileImage };
        }
        return {
          uri: `https://sandrealeesalon.onrender.com${user.profileImage}`,
        };
      }

      try {
        const customImage = await AsyncStorage.getItem("customProfileImage");
        if (customImage) {
          return { uri: customImage };
        }
      } catch (error) {
        console.error("Error reading custom profile image:", error);
      }

      const seed = user.username || user.id || "default";
      return {
        uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          seed,
        )}`,
      };
    }

    return images.profile;
  };

  const ProfileImage = () => {
    const [imageSource, setImageSource] = useState(images.profile);
    const [isSvg, setIsSvg] = useState(false);

    useFocusEffect(
      useCallback(() => {
        const loadImage = async () => {
          const source = await getProfileImageUrl();
          setImageSource(source);
          setIsSvg(
            source.uri &&
              (source.uri.includes("dicebear") || source.uri.includes(".svg")),
          );
        };
        loadImage();
      }, [isLoggedIn, user]),
    );

    return (
      <TouchableOpacity
        onPress={() => {
          if (isLoggedIn) {
            router.push("/(tabs)/profile");
          } else {
            router.push("/(auth)");
          }
        }}
        style={styles.profileImageContainer}>
        {isSvg ? (
          <SvgUri
            width={42}
            height={42}
            uri={imageSource.uri}
            style={styles.profileImg}
            onError={(error) => console.error("SvgUri error:", error)}
          />
        ) : (
          <Image source={imageSource} style={styles.profileImg} />
        )}
      </TouchableOpacity>
    );
  };

  const handleBookService = async (service: Service) => {
    if (!isLoggedIn || !user) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "Please log in to book a service.",
      });
      router.push("/(auth)");
      return;
    }

    if (user.isGuest) {
      Toast.show({
        type: "info",
        text1: "Account Required",
        text2: "Please create an account to book services.",
      });
      router.push("/(auth)");
      return;
    }

    router.push({
      pathname: "/(booking)/booking",
      params: { service: JSON.stringify(service) },
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

  const categories = [
    "All Services",
    "Haircuts & Basic Services",
    "Hair Coloring",
    "Perming & Texture Services",
    "Rebonding/Straightening",
    "Hair Treatments",
    "Combination Services",
    "Hair Extensions",
    "Styling & Special Services",
    "Package Sets",
  ];

  const categoryImages: Record<string, any> = {
    "Haircuts & Basic Services": images.category_coloring || images.profile,
    "Hair Coloring": images.category_hair_coloring || images.profile,
    "Perming & Texture Services": images.category_perming || images.profile,
    "Rebonding/Straightening": images.category_rebonding || images.profile,
    "Hair Treatments": images.category_treatments || images.profile,
    "Combination Services": images.category_combination || images.profile,
    "Hair Extensions": images.category_extensions || images.profile,
    "Styling & Special Services": images.category_styling || images.profile,
    "Package Sets": images.category_packages || images.profile,
  };

  const durationOptions = [
    "Short (≤30 mins)",
    "Medium (30-60 mins)",
    "Long (1hr+)",
  ];
  const priceRangeOptions = ["₱100-₱500", "₱500-₱1000", "₱1000+"];
  const ratingOptions = ["4+ stars", "3+ stars"];
  const popularityOptions = ["Most Booked", "Top Rated", "Newest"];

  const parsePrice = (priceRange: string): number => {
    const match = priceRange.match(/₱(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const scrollCategoryIntoView = (index: number) => {
    if (categoryItemRefs.current[index] && categoryScrollRef.current) {
      categoryItemRefs.current[index]?.measureLayout(
        categoryScrollRef.current as any,
        (x) => {
          categoryScrollRef.current?.scrollTo({
            x: x - 20,
            animated: true,
          });
        },
        () => {},
      );
    }
  };

  const handleCategoryPress = (index: number) => {
    setActiveCategory(index);
    scrollCategoryIntoView(index);

    Animated.spring(categoryScrollX, {
      toValue: index,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleSortOptionPress = (option: SortOption) => {
    setActiveSortOption(option);
    setSortMenuVisible(false);
    // Don't call fetchData here - it will be handled by the useEffect
  };

  const toggleFilterCategory = (category: string) => {
    setSelectedFilterCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleDuration = (duration: string) => {
    setSelectedDuration((prev) =>
      prev.includes(duration)
        ? prev.filter((d) => d !== duration)
        : [...prev, duration],
    );
  };

  const togglePriceRange = (range: string) => {
    setSelectedPriceRange((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    );
  };

  const toggleRating = (rating: string) => {
    setSelectedRating((prev) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [...prev, rating],
    );
  };

  const togglePopularity = (popularity: string) => {
    setSelectedPopularity((prev) =>
      prev.includes(popularity)
        ? prev.filter((p) => p !== popularity)
        : [...prev, popularity],
    );
  };

  const clearAllFilters = () => {
    setSelectedFilterCategories([]);
    setSelectedDuration([]);
    setSelectedPriceRange([]);
    setSelectedRating([]);
    setSelectedPopularity([]);
  };

  const getActiveFilterCount = () => {
    return (
      selectedFilterCategories.length +
      selectedDuration.length +
      selectedPriceRange.length +
      selectedRating.length +
      selectedPopularity.length
    );
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <Text style={styles.serviceTitle}>{text}</Text>;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <Text style={styles.serviceTitle}>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          ),
        )}
      </Text>
    );
  };

  const isOpen = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 9 && currentHour < 21;
  };

  const getCurrentDay = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  };

  const openGoogleMaps = () => {
    const url =
      "https://www.google.com/maps/place/SandreaLee+Salon/@14.6041347,120.9869412,17z/data=!3m1!4b1!4m6!3m5!1s0x3397c9ff34a4466d:0xed2c3ba078d8b423!8m2!3d14.6041295!4d120.9895161!16s%2Fg%2F11bywwczw8?entry=ttu&g_ep=EgoyMDI1MDUxMy4xIKXMDSoASAFQAw%3D%3D";
    Linking.openURL(url);
  };

  // FIXED: Safe ServiceCard component with error boundary
  const SafeServiceCard = ({ item }: { item: Service }) => {
    try {
      return <ServiceCard item={item} />;
    } catch (error) {
      console.error("Error rendering ServiceCard:", error);

      // Fallback UI for broken service cards
      return (
        <View style={[styles.serviceCard, { backgroundColor: "#2A0E17" }]}>
          <View style={styles.serviceInner}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceTitle, { color: "#FF6B6B" }]}>
                Service Unavailable
              </Text>
              <Text style={[styles.serviceMeta, { color: "#999" }]}>
                There was an issue loading this service
              </Text>
            </View>
          </View>
        </View>
      );
    }
  };

  // FIXED: ServiceCard component with proper rating handling
  const ServiceCard = ({ item }: { item: Service }) => {
    const [isBooking, setIsBooking] = useState(false);

    const handleBookPress = async () => {
      setIsBooking(true);
      await handleBookService(item);
      setIsBooking(false);
    };

    // FIXED: Proper rating validation and fallback
    const getSafeRating = () => {
      try {
        // Ensure rating exists and has proper structure
        if (!item.rating) {
          return {
            average: 0,
            totalRaters: 0,
            breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };
        }

        // Handle case where rating might be malformed
        const rating = item.rating;

        return {
          average: typeof rating.average === "number" ? rating.average : 0,
          totalRaters:
            typeof rating.totalRaters === "number" ? rating.totalRaters : 0,
          breakdown: rating.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: rating.percentages || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      } catch (error) {
        console.error("Error parsing rating:", error);
        return {
          average: 0,
          totalRaters: 0,
          breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }
    };

    const safeRating = getSafeRating();
    const starRating = apiClient.getStarRating(safeRating.average);
    const averageRating = safeRating.average;
    const totalRaters = safeRating.totalRaters;

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={handleBookPress}
        disabled={isBooking}>
        <View style={styles.serviceInner}>
          <View style={{ flex: 1 }}>
            <View style={styles.serviceHeader}>
              <Image source={icons.service_name} style={styles.serviceIcon} />
              {highlightText(item.name, searchQuery)}
            </View>

            {/* FIXED: Safe star rating display */}
            <View style={styles.ratingContainer}>
              <View style={styles.starsRow}>
                {Array.from({ length: starRating.full }).map((_, index) => (
                  <Ionicons
                    key={`full-${index}`}
                    name="star"
                    size={14}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                ))}
                {starRating.half && (
                  <Ionicons
                    key="half"
                    name="star-half"
                    size={14}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                )}
                {Array.from({ length: starRating.empty }).map((_, index) => (
                  <Ionicons
                    key={`empty-${index}`}
                    name="star-outline"
                    size={14}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              {/* FIXED: Safe text rendering */}
              <Text style={styles.ratingText}>
                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}(
                {totalRaters})
              </Text>
            </View>

            <View style={styles.serviceDetailRow}>
              <Image source={icons.duration} style={styles.serviceIcon} />
              <Text style={styles.serviceMeta}>{item.duration || "N/A"}</Text>
            </View>

            <View style={styles.serviceDetailRow}>
              <Image source={icons.price} style={styles.serviceIcon} />
              <Text style={styles.servicePrice}>
                {item.priceRange || "N/A"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, isBooking && styles.bookBtnDisabled]}
            onPress={handleBookPress}
            disabled={isBooking}>
            {isBooking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>Book</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryItem = ({ title, index }: { title: string; index: number }) => {
    const isActive = index === activeCategory;
    const imageSource = categoryImages[title] || images.profile;

    return (
      <View
        ref={(ref) => {
          categoryItemRefs.current[index] = ref;
        }}
        collapsable={false}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCategoryPress(index)}
          style={styles.categoryItemWrapper}>
          {isActive ? (
            <LinearGradient
              colors={["#76C4FF", "#3352E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.categoryFill}>
              {index > 0 && (
                <Image source={imageSource} style={styles.categoryImage} />
              )}
              <Text style={styles.categoryTextActive}>{title}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.categoryFill, styles.categoryInactiveFill]}>
              {index > 0 && (
                <Image source={imageSource} style={styles.categoryImage} />
              )}
              <Text style={styles.categoryTextInactive}>{title}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
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
            source={require("../../assets/images/SandreaLeeSalonLogoCapstone.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.salonText}>SALON</Text>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => setNotificationModalVisible(true)}>
            <SafeIonicons
              name="notifications-outline"
              size={22}
              color="white"
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <ProfileImage />
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/profile");
            }}>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/Booking");
            }}>
            <Text style={styles.menuText}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/cart");
            }}>
            <Text style={styles.menuText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/favorites");
            }}>
            <Text style={styles.menuText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✨ ADDED: Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationModalVisible(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.notificationModalOverlay}>
            <View style={styles.notificationModalContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>Notifications</Text>
                <View style={styles.notificationHeaderActions}>
                  {isLoggedIn && !user?.isGuest && unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllReadButton}
                      onPress={handleMarkAllAsRead}>
                      <Text style={styles.markAllReadText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setNotificationModalVisible(false)}
                    style={styles.closeNotificationButton}>
                    <SafeIonicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {!isLoggedIn || user?.isGuest ? (
                <View style={styles.authRequiredContainer}>
                  <SafeIonicons
                    name="log-in-outline"
                    size={48}
                    color="#6B7280"
                  />
                  <Text style={styles.authRequiredText}>Sign In Required</Text>
                  <Text style={styles.authRequiredSubtext}>
                    Please sign in to view your notifications
                  </Text>
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => {
                      setNotificationModalVisible(false);
                      router.push("/(auth)" as any);
                    }}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.notificationList}>
                  {notificationError ? (
                    <View style={styles.noNotifications}>
                      <SafeIonicons
                        name="wifi-outline"
                        size={48}
                        color="#6B7280"
                      />
                      <Text style={styles.noNotificationsText}>
                        Connection Error
                      </Text>
                      <Text style={styles.noNotificationsSubtext}>
                        Unable to load notifications
                      </Text>
                      <TouchableOpacity
                        style={styles.signInButton}
                        onPress={handleRetryNotifications}>
                        <Text style={styles.signInButtonText}>Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <SwipeableNotificationItem
                        key={notification._id}
                        notification={notification}
                        onPress={handleNotificationPress}
                        onDelete={handleDeleteNotification}
                      />
                    ))
                  ) : (
                    <View style={styles.noNotifications}>
                      <SafeIonicons
                        name="notifications-off-outline"
                        size={48}
                        color="#6B7280"
                      />
                      <Text style={styles.noNotificationsText}>
                        No notifications
                      </Text>
                      <Text style={styles.noNotificationsSubtext}>
                        Youre all caught up!
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* ✨ ADDED: Notification Detail Overlay - Fixed Size */}
      <Modal
        visible={notificationDetailVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNotificationDetailVisible(false)}>
        <View style={styles.notificationDetailOverlay}>
          <View style={styles.notificationDetailContent}>
            <View style={styles.notificationDetailHeader}>
              <View style={styles.notificationDetailIconTitle}>
                <View style={styles.detailIconContainer}>
                  <SafeIonicons
                    name={
                      selectedNotification
                        ? getNotificationIconName(selectedNotification.type)
                        : "notifications-outline"
                    }
                    size={24}
                    color="#619AE4"
                  />
                </View>
                <View style={styles.detailTitleContainer}>
                  <Text style={styles.notificationDetailTitle}>
                    {selectedNotification?.title || "Notification"}
                  </Text>
                  <Text style={styles.notificationDetailTime}>
                    {selectedNotification
                      ? apiClient.formatNotificationTime(
                          selectedNotification.createdAt,
                        )
                      : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setNotificationDetailVisible(false)}
                style={styles.closeDetailButton}>
                <SafeIonicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.notificationDetailBody}
              contentContainerStyle={styles.notificationDetailBodyContent}
              showsVerticalScrollIndicator={true}>
              <Text style={styles.notificationDetailMessage}>
                {selectedNotification?.message || "No message content"}
              </Text>
            </ScrollView>

            <View style={styles.notificationDetailFooter}>
              <TouchableOpacity
                style={styles.closeDetailBtn}
                onPress={() => setNotificationDetailVisible(false)}>
                <Text style={styles.closeDetailBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#999" />
          <TextInput
            placeholder="Search for services..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterIcon}
          onPress={() => setFilterModalVisible(true)}>
          <Feather name="filter" size={20} color="white" />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeSection}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>
            Ready for your next glow-up?
            {isLoggedIn && user?.username ? ` ${user.username}` : ""}
          </Text>
          <Text style={styles.welcomeSubtext}>Discover our services</Text>
        </View>
      </View>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Services</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                {categories.slice(1).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.filterOption}
                    onPress={() => toggleFilterCategory(category)}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedFilterCategories.includes(category) &&
                          styles.checkboxActive,
                      ]}>
                      {selectedFilterCategories.includes(category) && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Duration</Text>
                {durationOptions.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={styles.filterOption}
                    onPress={() => toggleDuration(duration)}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedDuration.includes(duration) &&
                          styles.checkboxActive,
                      ]}>
                      {selectedDuration.includes(duration) && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{duration}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                {priceRangeOptions.map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={styles.filterOption}
                    onPress={() => togglePriceRange(range)}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedPriceRange.includes(range) &&
                          styles.checkboxActive,
                      ]}>
                      {selectedPriceRange.includes(range) && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Popularity</Text>
                {popularityOptions.map((popularity) => (
                  <TouchableOpacity
                    key={popularity}
                    style={styles.filterOption}
                    onPress={() => togglePopularity(popularity)}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedPopularity.includes(popularity) &&
                          styles.checkboxActive,
                      ]}>
                      {selectedPopularity.includes(popularity) && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{popularity}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Rating</Text>
                {ratingOptions.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={styles.filterOption}
                    onPress={() => toggleRating(rating)}>
                    <View
                      style={[
                        styles.checkbox,
                        selectedRating.includes(rating) &&
                          styles.checkboxActive,
                      ]}>
                      {selectedRating.includes(rating) && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.filterOptionText}>{rating}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#619AE4"
            colors={["#619AE4"]}
          />
        }>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#619AE4"
            style={styles.loader}
          />
        ) : (
          <View style={styles.content}>
            <View style={styles.servicesHeader}>
              <Text style={styles.servicesTitle}>
                Services{" "}
                {filteredServices.length > 0 && `(${filteredServices.length})`}
              </Text>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setSortMenuVisible(!sortMenuVisible)}>
                <Ionicons name="swap-vertical" size={14} color="white" />
                <Text style={styles.sortButtonText}>Sort</Text>
                <Feather name="chevron-down" size={14} color="white" />
              </TouchableOpacity>
            </View>

            {sortMenuVisible && (
              <View style={styles.sortMenu}>
                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "default" && styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("default")}>
                  {activeSortOption === "default" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Default</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "category" &&
                      styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("category")}>
                  {activeSortOption === "category" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Category</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "promo" && styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("promo")}>
                  {activeSortOption === "promo" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Promo</Text>
                </TouchableOpacity>

                <View style={styles.sortMenuItemWithSubmenu}>
                  <View style={styles.sortMenuItemHeader}>
                    {(activeSortOption === "price-low" ||
                      activeSortOption === "price-high") && (
                      <View style={styles.activeDot} />
                    )}
                    <Text style={styles.sortMenuText}>Price</Text>
                    <Feather name="chevron-right" size={16} color="#B6BFD3" />
                  </View>
                  <View style={styles.submenu}>
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() => handleSortOptionPress("price-low")}>
                      <Text style={styles.submenuText}>Low to High</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() => handleSortOptionPress("price-high")}>
                      <Text style={styles.submenuText}>High to Low</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "duration" &&
                      styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("duration")}>
                  {activeSortOption === "duration" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Duration</Text>
                </TouchableOpacity>

                <View style={styles.sortMenuItemWithSubmenu}>
                  <View style={styles.sortMenuItemHeader}>
                    {(activeSortOption === "most-booked" ||
                      activeSortOption === "top-rated" ||
                      activeSortOption === "newest") && (
                      <View style={styles.activeDot} />
                    )}
                    <Text style={styles.sortMenuText}>Popularity</Text>
                    <Feather name="chevron-right" size={16} color="#B6BFD3" />
                  </View>
                  <View style={styles.submenu}>
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() => handleSortOptionPress("most-booked")}>
                      <Text style={styles.submenuText}>Most Booked</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() => handleSortOptionPress("top-rated")}>
                      <Text style={styles.submenuText}>Top Rated</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() => handleSortOptionPress("newest")}>
                      <Text style={styles.submenuText}>Newest</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "availability" &&
                      styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("availability")}>
                  {activeSortOption === "availability" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Availability</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "ascending" &&
                      styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("ascending")}>
                  {activeSortOption === "ascending" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Ascending</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortMenuItem,
                    activeSortOption === "descending" &&
                      styles.sortMenuItemActive,
                  ]}
                  onPress={() => handleSortOptionPress("descending")}>
                  {activeSortOption === "descending" && (
                    <View style={styles.activeDot} />
                  )}
                  <Text style={styles.sortMenuText}>Descending</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ marginBottom: 14, marginTop: 16 }}>
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}>
                {categories.map((c, i) => (
                  <CategoryItem key={c} title={c} index={i} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.servicesGrid}>
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <SafeServiceCard key={service._id} item={service} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="search" size={48} color="#6B7280" />
                  <Text style={styles.emptyStateText}>No services found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your filters or search query
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.locationScheduleSection}>
              <TouchableOpacity
                onPress={openGoogleMaps}
                style={styles.mapContainer}>
                <Image
                  source={require("../../assets/images/map.png")}
                  style={{ width: 400, height: 200 }}
                />

                <View style={styles.mapOverlay}>
                  <Image source={icons.location} style={styles.locationIcon} />
                  <Text style={styles.mapText}>View on Google Maps</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.scheduleContainer}>
                <View style={styles.scheduleHeader}>
                  <Image source={icons.time} style={styles.timeIcon} />
                  <Text style={styles.scheduleTitle}>Opening Times</Text>
                  <View
                    style={[styles.openBadge, !isOpen() && styles.closedBadge]}>
                    <View
                      style={[styles.openDot, !isOpen() && styles.closedDot]}
                    />
                    <Text
                      style={[styles.openText, !isOpen() && styles.closedText]}>
                      {isOpen() ? "Open until 9:00 PM" : "Closed"}
                    </Text>
                  </View>
                </View>

                <View style={styles.scheduleList}>
                  {[
                    { day: "Monday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Tuesday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Wednesday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Thursday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Friday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Saturday", hours: "9:00 AM - 9:00 PM" },
                    { day: "Sunday", hours: "9:00 AM - 9:00 PM" },
                  ].map((schedule, index) => {
                    const isToday = schedule.day === getCurrentDay();
                    return (
                      <View
                        key={index}
                        style={[
                          styles.scheduleRow,
                          isToday && styles.scheduleRowToday,
                        ]}>
                        <View style={styles.scheduleDayContainer}>
                          <View
                            style={[
                              styles.dayBullet,
                              isToday && styles.dayBulletToday,
                            ]}
                          />
                          <Text
                            style={[
                              styles.scheduleDay,
                              isToday && styles.scheduleDayToday,
                            ]}>
                            {schedule.day}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.scheduleHours,
                            isToday && styles.scheduleHoursToday,
                          ]}>
                          {schedule.hours}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.addressContainer}>
                  <Image source={icons.location} style={styles.addressIcon} />
                  <Text style={styles.addressText}>
                    Rosario Place, 2184{"\n"}
                    Jaimedelarosa Street,{"\n"}
                    Sampaloc, Maynila,{"\n"}
                    Kalakhang Maynila
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0A0E17",
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
  rightIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#0A0E17",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },
  profileImageContainer: {
    borderRadius: 50,
    overflow: "hidden",
  },
  profileImg: {
    width: 42,
    height: 42,
    borderRadius: 50,
    backgroundColor: "transparent",
  },
  menu: {
    position: "absolute",
    top: 80,
    left: 16,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 8,
    zIndex: 1001,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  menuText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  // ✨ ADDED: Enhanced Notification Modal Styles for LEFT swipe to delete
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  notificationModalContent: {
    flex: 1,
    backgroundColor: "#0A0E17",
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  notificationTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  notificationHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    borderRadius: 16,
  },
  markAllReadText: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  closeNotificationButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationList: {
    flex: 1,
  },
  // ✨ ADDED: Left-swipe Notification Styles
  notificationItemContainer: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  notificationDeleteBackground: {
    position: "absolute",
    right: 0, // Changed to right for LEFT swipe
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    zIndex: 1,
  },
  deleteText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  notificationContentWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    minHeight: 80,
    paddingHorizontal: 16,
  },
  unreadNotification: {
    backgroundColor: "rgba(97, 154, 228, 0.05)",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitleText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationMessage: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "Urbanist",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#619AE4",
    marginTop: 8,
  },
  noNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  noNotificationsText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noNotificationsSubtext: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
  },
  authRequiredContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  authRequiredText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredSubtext: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  // ✨ ADDED: Notification Detail Overlay Styles - Fixed Size
  notificationDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notificationDetailContent: {
    backgroundColor: "#1a2847",
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9, // 90% of screen width
    maxWidth: 400,
    height: SCREEN_HEIGHT * 0.7, // 70% of screen height
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2d3f5f",
  },
  notificationDetailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3f5f",
  },
  notificationDetailIconTitle: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTitleContainer: {
    flex: 1,
  },
  notificationDetailTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationDetailTime: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  closeDetailButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  notificationDetailBody: {
    flex: 1,
  },
  notificationDetailBodyContent: {
    padding: 20,
    paddingBottom: 30,
  },
  notificationDetailMessage: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    lineHeight: 24,
  },
  notificationDetailFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2d3f5f",
  },
  closeDetailBtn: {
    backgroundColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeDetailBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 50,
    paddingHorizontal: 14,
    alignItems: "center",
    height: 50,
    gap: 8,
  },
  searchInput: { flex: 1, color: "white", fontSize: 12, fontWeight: "400" },
  filterIcon: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#619AE4",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  welcomeSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  content: { padding: 12 },
  servicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  servicesTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  sortMenu: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 4,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  sortMenuItemActive: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
  },
  sortMenuText: {
    color: "#B6BFD3",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#619AE4",
  },
  sortMenuItemWithSubmenu: {
    borderRadius: 8,
  },
  sortMenuItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  submenu: {
    paddingLeft: 32,
  },
  submenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  submenuText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  categoriesContainer: { paddingHorizontal: 4, alignItems: "center" },
  categoryItemWrapper: { marginRight: 10 },
  categoryFill: {
    height: 42,
    borderRadius: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  categoryInactiveFill: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#B6BFD3",
  },
  categoryImage: {
    width: 26,
    height: 26,
    borderRadius: 50,
    marginRight: 10,
    resizeMode: "cover",
  },
  categoryTextActive: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "800",
    flexShrink: 1,
  },
  categoryTextInactive: {
    color: "#B6BFD3",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "500",
    flexShrink: 1,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: "#0D3991",
    borderRadius: 12,
    padding: 16,
  },
  serviceInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  serviceTitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    flex: 1,
  },
  highlightedText: {
    backgroundColor: "#FFD700",
    color: "#0A0E17",
    fontWeight: "800",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginRight: 8,
  },
  ratingText: {
    color: "#DCE6FF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  serviceDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceMeta: {
    color: "#DCE6FF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  servicePrice: {
    color: "#E6F4FF",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  bookBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 46,
    borderWidth: 1.5,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  bookBtnDisabled: {
    opacity: 0.6,
  },
  bookBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginTop: 8,
  },
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
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
  },
  filterSection: {
    padding: 20,
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
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#619AE4",
    borderColor: "#619AE4",
  },
  filterOptionText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  clearButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#619AE4",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  locationScheduleSection: {
    marginTop: 32,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 14, 23, 0.85)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationIcon: {
    width: 20,
    height: 20,
    tintColor: "#619AE4",
  },
  mapText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  scheduleContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  timeIcon: {
    width: 24,
    height: 24,
    tintColor: "#619AE4",
  },
  scheduleTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flex: 1,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  closedBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  closedDot: {
    backgroundColor: "#EF4444",
  },
  openText: {
    color: "#22C55E",
    fontSize: 11,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  closedText: {
    color: "#EF4444",
  },
  scheduleList: {
    gap: 12,
    marginBottom: 20,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  scheduleRowToday: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: -12,
  },
  scheduleDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#619AE4",
  },
  dayBulletToday: {
    width: 6,
    height: 6,
    backgroundColor: "#FFD700",
  },
  scheduleDay: {
    color: "#B6BFD3",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  scheduleDayToday: {
    color: "white",
    fontWeight: "700",
  },
  scheduleHours: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  scheduleHoursToday: {
    color: "#FFD700",
    fontWeight: "700",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  addressIcon: {
    width: 20,
    height: 20,
    tintColor: "#619AE4",
    marginTop: 2,
  },
  addressText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 20,
    flex: 1,
  },
  loader: { marginTop: 50 },
});
