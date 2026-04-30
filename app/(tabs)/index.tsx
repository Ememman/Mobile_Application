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
  ImageBackground,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useFonts } from "expo-font";
import { apiClient, Service, Product, Notification } from "@/app/api/apiClient";
import Toast from "react-native-toast-message";
import { SvgUri } from "react-native-svg";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const API_BASE_URL = "http://10.74.230.139:3000";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface User {
  id: string;
  username?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  isGuest?: boolean;
}

interface Appointment {
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

// Interface for notification with gesture handling
interface NotificationItemWithGesture extends Notification {
  translateX: Animated.Value;
  isSwiping: boolean;
}

export default function Index() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] =
    useState<Appointment | null>(null);
  const [showAppointmentReminder, setShowAppointmentReminder] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<
    NotificationItemWithGesture[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationError, setNotificationError] = useState(false);

  // ✨ ADDED: Notification detail overlay state
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

  const categoryScrollRef = useRef<ScrollView>(null);
  const categoryItemRefs = useRef<{ [key: number]: View | null }>({});

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

  // ✨ UPDATED: Notification press handler - shows overlay instead of routing
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

      // ✨ UPDATED: Show notification detail overlay instead of routing
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

  // Enhanced Notification functions with better error handling
  const fetchNotifications = useCallback(async () => {
    try {
      console.log("🔔 Fetching notifications for Home screen...");

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
          `✅ Home: Loaded ${response.data?.length || 0} notifications, ${
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
      console.error("❌ Error fetching notifications in Home:", error);

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

  // Retry mechanism for failed notification fetches
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

  // Handler for retry button press
  const handleRetryNotifications = useCallback(() => {
    fetchNotificationsWithRetry();
  }, [fetchNotificationsWithRetry]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesResponse, productsResponse] = await Promise.all([
        apiClient.getAllServices(),
        apiClient.getAllProducts(),
      ]);

      if (servicesResponse.success) setServices(servicesResponse.data);
      if (productsResponse.success) {
        setProducts(productsResponse.data);

        // Enhanced debug logging
        console.log(
          "📦 ALL PRODUCTS DATA IN INDEX:",
          productsResponse.data.map((p) => ({
            id: p._id,
            name: p.name,
            image: p.image,
            hasImage: !!p.image,
            category: p.category,
            price: p.price,
          })),
        );

        // Log available images
        console.log("🖼️ AVAILABLE IMAGE IMPORTS IN INDEX:", {
          mask: images.mask,
          shampoo: images.shampoo,
          sulfate: images.sulfate,
          keratin: images.keratin,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await checkAuthStatus();
    if (isLoggedIn && !user?.isGuest) {
      await fetchNotificationsWithRetry();
      await checkUpcomingAppointments();
    }
    setRefreshing(false);

    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Data updated successfully!",
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
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // ✨ UPDATED: Check for upcoming appointments (not just today)
  const checkUpcomingAppointments = async () => {
    try {
      console.log("📅 Checking for upcoming appointments...");

      const appointmentsResponse = await apiClient.getUserBookings();
      console.log("📥 Appointments response:", appointmentsResponse);

      if (appointmentsResponse.success && appointmentsResponse.data) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Filter and normalize appointments
        const upcomingAppts = appointmentsResponse.data
          .filter((apt) => {
            try {
              const aptDate = new Date(apt.preferredDate);
              aptDate.setHours(0, 0, 0, 0);

              const isUpcoming = aptDate >= now;
              const isActiveStatus =
                apt.status === "pending" || apt.status === "confirmed";

              console.log(`📋 Appointment check:`, {
                date: aptDate.toDateString(),
                status: apt.status,
                isUpcoming,
                isActiveStatus,
                willShow: isUpcoming && isActiveStatus,
              });

              return isUpcoming && isActiveStatus;
            } catch (err) {
              console.error("Error parsing appointment date:", err);
              return false;
            }
          })
          .sort((a, b) => {
            const dateA = new Date(a.preferredDate);
            const dateB = new Date(b.preferredDate);
            return dateA.getTime() - dateB.getTime();
          });

        console.log(`✅ Found ${upcomingAppts.length} upcoming appointments`);

        if (upcomingAppts.length > 0) {
          const nextAppointment = upcomingAppts[0];
          console.log("🎯 Setting upcoming appointment:", nextAppointment);
          setUpcomingAppointment(nextAppointment);
          setShowAppointmentReminder(true);
        } else {
          console.log("ℹ️ No upcoming appointments found");
          setUpcomingAppointment(null);
          setShowAppointmentReminder(false);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
    }
  };

  // Helper function to check if appointment is today
  const isAppointmentToday = (appointmentDate: string) => {
    try {
      const aptDate = new Date(appointmentDate);
      const today = new Date();

      return (
        aptDate.getDate() === today.getDate() &&
        aptDate.getMonth() === today.getMonth() &&
        aptDate.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const formatAppointmentDate = (appointmentDate: string) => {
    try {
      const date = new Date(appointmentDate);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return appointmentDate;
    }
  };

  const getProfileImageUrl = async () => {
    if (isLoggedIn && user && !user.isGuest) {
      if (user.profileImage) {
        if (user.profileImage.startsWith("http")) {
          return { uri: user.profileImage };
        }
        return { uri: `http://10.74.230.139:3000${user.profileImage}` };
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
      React.useCallback(() => {
        const loadImage = async () => {
          const source = await getProfileImageUrl();
          setImageSource(source);
          setIsSvg(
            source.uri &&
              (source.uri.includes("dicebear") || source.uri.includes(".svg")),
          );
        };
        loadImage();
      }, []),
    );

    return (
      <TouchableOpacity
        onPress={() => {
          if (isLoggedIn) {
            router.push("/(tabs)/profile" as any);
          } else {
            router.push("/(auth)" as any);
          }
        }}
        style={styles.profileImageContainer}>
        {isSvg ? (
          <SvgUri
            width={42}
            height={42}
            uri={imageSource.uri}
            style={styles.profileImg}
            onError={() => console.error("SvgUri error")}
          />
        ) : (
          <Image source={imageSource} style={styles.profileImg} />
        )}
      </TouchableOpacity>
    );
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

  const scrollCategoryIntoView = (index: number) => {
    if (categoryItemRefs.current[index] && categoryScrollRef.current) {
      categoryItemRefs.current[index]?.measureLayout(
        categoryScrollRef.current as any,
        (x, y, width, height) => {
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
    router.push(
      `/(tabs)/services?category=${encodeURIComponent(
        categories[index],
      )}` as any,
    );
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

  const clearAllFilters = () => {
    setSelectedFilterCategories([]);
    setSelectedDuration([]);
    setSelectedPriceRange([]);
  };

  const getActiveFilterCount = () => {
    return (
      selectedFilterCategories.length +
      selectedDuration.length +
      selectedPriceRange.length
    );
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    const filterParams = new URLSearchParams();
    if (selectedFilterCategories.length > 0) {
      filterParams.append("categories", selectedFilterCategories.join(","));
    }
    if (selectedDuration.length > 0) {
      filterParams.append("duration", selectedDuration.join(","));
    }
    if (selectedPriceRange.length > 0) {
      filterParams.append("priceRange", selectedPriceRange.join(","));
    }
    router.push(`/(tabs)/services?${filterParams.toString()}` as any);
  };

  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return { services: services.slice(0, 3), products: products.slice(0, 4) };
    }

    const query = searchQuery.toLowerCase();
    const filteredServices = services.filter((service) =>
      service.name.toLowerCase().includes(query),
    );
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(query),
    );

    return {
      services: filteredServices.slice(0, 3),
      products: filteredProducts.slice(0, 4),
    };
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

  // ✨ FIXED: Render stars for service rating with proper data
  const renderServiceStars = (service: Service) => {
    const averageRating = service.rating?.average || 0;
    const totalRaters = service.rating?.totalRaters || 0;

    // Debug log to see what data we're working with
    console.log(`⭐ Service: ${service.name}`, {
      averageRating,
      totalRaters,
      ratingData: service.rating,
    });

    const stars = [];

    // Calculate full stars and half stars based on actual rating
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Image
          key={`full-${i}`}
          source={icons.star}
          style={{ width: 16, height: 16, marginRight: 2 }}
        />,
      );
    }

    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <Image
          key="half"
          source={icons.star_half}
          style={{ width: 16, height: 16, marginRight: 2 }}
        />,
      );
    }

    // Render empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Image
          key={`empty-${i}`}
          source={icons.star} // Use the same star icon but you might want a different one for empty
          style={{ width: 16, height: 16, marginRight: 2, opacity: 0.3 }}
        />,
      );
    }

    return (
      <View style={styles.serviceRatingContainer}>
        <View style={styles.starsRow}>
          {stars}
          <Text style={styles.ratingValue}>
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </Text>
        </View>
        <Text style={styles.ratingCount}>({totalRaters} ratings)</Text>
      </View>
    );
  };

  // ✨ FIXED: Render stars for product rating with proper data
  const renderProductStars = (product: Product) => {
    const averageRating = product.rating?.average || 0;
    const totalRaters = product.rating?.totalRaters || 0;

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <SafeIonicons
          key={i}
          name={i <= Math.floor(averageRating) ? "star" : "star-outline"}
          size={14}
          color="#FFD700"
          style={{ marginRight: 4 }}
        />,
      );
    }

    return (
      <View style={styles.productRating}>
        {stars}
        <Text style={styles.ratingText}>
          {averageRating > 0 ? averageRating.toFixed(1) : "0.0"} ({totalRaters})
        </Text>
      </View>
    );
  };

  // Improved function to get correct image source for products
  const getProductImageSource = (product: Product) => {
    console.log(`🖼️ Loading image for: ${product.name}`, {
      image: product.image,
      type: typeof product.image,
    });

    // Priority 1: Use the image from API if available
    if (product.image) {
      if (typeof product.image === "string") {
        if (product.image.startsWith("http")) {
          return { uri: product.image };
        } else {
          const cleanPath = product.image.startsWith("/")
            ? product.image
            : `/${product.image}`;
          const fullUrl = `${API_BASE_URL}${cleanPath}`;
          console.log(`🔗 Constructed image URL: ${fullUrl}`);
          return { uri: fullUrl };
        }
      }
      return product.image;
    }

    // Priority 2: Use product name to determine which image to use
    const productName = product.name.toLowerCase();

    // Map product names to specific images
    if (
      productName.includes("shampoo") ||
      productName.includes("conditioner")
    ) {
      // Check if shampoo image exists, otherwise use mask
      return images.shampoo || images.mask;
    } else if (productName.includes("sulfate")) {
      return images.sulfate || images.mask;
    } else if (productName.includes("keratin")) {
      return images.keratin || images.mask;
    } else if (
      productName.includes("mask") ||
      productName.includes("treatment")
    ) {
      return images.mask;
    }

    // Priority 3: Use category-based fallback
    const category = product.category?.toLowerCase() || "";
    if (category.includes("hair") || category.includes("care")) {
      return images.shampoo || images.mask;
    } else if (category.includes("treatment")) {
      return images.keratin || images.mask;
    }

    // Ultimate fallback
    console.warn(
      `⚠️ No specific image found for product: ${product.name}, using default mask`,
    );
    return images.mask;
  };

  // Improved Product Image Component with better error handling
  const ProductImage = ({ product }: { product: Product }) => {
    const [currentSource, setCurrentSource] = useState(
      getProductImageSource(product),
    );

    // Reset when product changes
    useEffect(() => {
      setCurrentSource(getProductImageSource(product));
    }, [product]);

    const handleImageError = () => {
      console.log(`❌ Failed to load image for: ${product.name}`);

      // Try to find a better fallback based on product name
      const productName = product.name.toLowerCase();

      if (productName.includes("shampoo") && images.shampoo) {
        console.log(`🔄 Falling back to shampoo image for: ${product.name}`);
        setCurrentSource(images.shampoo);
      } else if (productName.includes("sulfate") && images.sulfate) {
        console.log(`🔄 Falling back to sulfate image for: ${product.name}`);
        setCurrentSource(images.sulfate);
      } else if (productName.includes("keratin") && images.keratin) {
        console.log(`🔄 Falling back to keratin image for: ${product.name}`);
        setCurrentSource(images.keratin);
      } else {
        console.log(`🔄 Using default mask image for: ${product.name}`);
        setCurrentSource(images.mask);
      }
    };

    return (
      <Image
        source={currentSource}
        style={{
          width: "100%",
          height: 216,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        resizeMode="cover"
        onError={handleImageError}
        defaultSource={images.mask}
      />
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
              <Image source={imageSource} style={styles.categoryImage} />
              <Text style={styles.categoryTextActive}>{title}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.categoryFill, styles.categoryInactiveFill]}>
              <Image source={imageSource} style={styles.categoryImage} />
              <Text style={styles.categoryTextInactive}>{title}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const FullServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.fullServiceCard}
      onPress={() => router.push(`/(tabs)/services?id=${item._id}` as any)}>
      <View style={styles.fullInner}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}>
            <Image
              source={icons.service_name}
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
            {highlightText(item.name, searchQuery)}
          </View>

          <View style={styles.serviceRatingWrapper}>
            {renderServiceStars(item)}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}>
            <Image
              source={icons.duration}
              style={{ width: 16, height: 16, marginRight: 6 }}
            />
            <Text style={styles.serviceMeta}>{item.duration}</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}>
            <Image
              source={icons.price}
              style={{ width: 16, height: 16, marginRight: 6 }}
            />
            <Text style={styles.featuredServicePrice}>{item.priceRange}</Text>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              justifyContent: "center",
              top: -70,
            }}>
            <TouchableOpacity
              style={[styles.bookBtn, { top: 10 }]}
              onPress={() =>
                router.push(`/(tabs)/services?serviceId=${item._id}` as any)
              }>
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ProductListCard = ({ item }: { item: Product }) => {
    return (
      <View style={styles.productListCard}>
        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{item.category || "Hair"}</Text>

          <View style={styles.productTitleRow}>
            {highlightText(item.name, searchQuery)}
            <Text style={styles.productPrice}>₱{item.price}</Text>
          </View>

          <View style={styles.productActionsRow}>
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => console.log("Add to cart:", item._id)}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>

            {renderProductStars(item)}
          </View>
        </View>
      </View>
    );
  };

  const filteredItems = getFilteredItems();

  useEffect(() => {
    fetchData();
    checkAuthStatus();
  }, []);

  // Separate useEffect for notifications that depends on auth status
  useEffect(() => {
    if (isLoggedIn && !user?.isGuest) {
      fetchNotificationsWithRetry();
      checkUpcomingAppointments();
    } else {
      // Clear notifications if user logs out or is guest
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError(false);
    }
  }, [isLoggedIn, user?.isGuest, fetchNotificationsWithRetry]);

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
              router.push("/(tabs)/profile" as any);
            }}>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/Booking" as any);
            }}>
            <Text style={styles.menuText}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/cart" as any);
            }}>
            <Text style={styles.menuText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/favorites" as any);
            }}>
            <Text style={styles.menuText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification Modal */}
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

      {/* ✨ UPDATED: Notification Detail Overlay - Fixed Size */}
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

      {/* ✨ FIXED: Appointment Reminder Modal with Service Name */}
      {isLoggedIn && !user?.isGuest && upcomingAppointment && (
        <Modal
          visible={showAppointmentReminder}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowAppointmentReminder(false)}>
          <View style={styles.reminderModalOverlay}>
            <View style={styles.reminderModalContent}>
              <View style={styles.reminderHeader}>
                <SafeIonicons name="calendar" size={20} color="#FFD700" />
                <Text style={styles.reminderTitle}>
                  SandreaLee Salon Reminder
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAppointmentReminder(false)}
                  style={styles.closeButton}>
                  <SafeIonicons
                    name="close-circle-outline"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.reminderBody}>
                <Text style={styles.reminderText}>
                  {isAppointmentToday(upcomingAppointment.preferredDate)
                    ? `You have an appointment today at ${upcomingAppointment.preferredTime}.`
                    : `You have an appointment on ${formatAppointmentDate(
                        upcomingAppointment.preferredDate,
                      )} at ${upcomingAppointment.preferredTime}.`}
                </Text>

                {/* ✨ FIXED: Service name display */}
                <Text style={styles.reminderService}>
                  Service:{" "}
                  {upcomingAppointment.serviceId?.name || "Hair Service"}
                </Text>

                <Text style={styles.reminderSubtext}>
                  We look forward to seeing you!
                </Text>
                <Text style={styles.reminderTimestamp}>
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#999" />
          <TextInput
            placeholder="Search for products, stylists, and services..."
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

      {/* Appointment Banner */}
      {isLoggedIn && !user?.isGuest && upcomingAppointment && (
        <ImageBackground
          source={images.banner}
          style={styles.appointmentBanner}
          imageStyle={{ borderRadius: 12 }}>
          <View style={styles.appointmentBannerOverlay}>
            <View style={styles.appointmentBannerContent}>
              <View style={styles.appointmentTextContainer}>
                <Text style={styles.appointmentBannerTitle}>
                  Appointment <Text style={styles.appointmentDot}>.</Text>{" "}
                  <Text style={styles.appointmentBannerDetail}>
                    {isAppointmentToday(upcomingAppointment.preferredDate)
                      ? `Today, ${upcomingAppointment.preferredTime}`
                      : `${formatAppointmentDate(
                          upcomingAppointment.preferredDate,
                        )}, ${upcomingAppointment.preferredTime}`}
                  </Text>
                </Text>
                <View style={styles.appointmentLocationRow}>
                  <SafeIonicons
                    name="location-outline"
                    size={16}
                    color="#E5E7EB"
                  />
                  <Text style={styles.appointmentBannerLocation}>
                    SandreaLee Salon, 2184 Loyola St, Sampaloc, Manila, 1008
                    Metro Manila
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.appointmentViewButton}
                onPress={() => router.push("/(tabs)/appointments" as any)}>
                <SafeIonicons
                  name="arrow-redo-outline"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Services & Products</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                {categories.map((category) => (
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllFilters}>
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
            {isLoggedIn && user && !user.isGuest && (
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  Welcome Back!{" "}
                  <Text style={styles.usernameText}>{user.username}</Text>
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 14 }}>
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Services</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push("/(tabs)/services" as any)}>
                <Text style={styles.seeAll}>See All</Text>
                <SafeIonicons
                  name="chevron-forward"
                  size={16}
                  color="#619AE4"
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 18 }}>
              {filteredItems.services.length > 0 ? (
                filteredItems.services.map((service, idx) => (
                  <View key={service._id} style={{ marginBottom: 8 }}>
                    <FullServiceCard item={service} />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="search" size={48} color="#6B7280" />
                  <Text style={styles.emptyStateText}>No services found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 16 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannersContainer}>
                <View style={styles.bannerLeft}>
                  <Text style={styles.bannerLeftTitle}>50% OFF</Text>
                  <Text style={styles.bannerLeftSubtitle}>
                    Newbie Promo Awaits For You!
                  </Text>
                  <TouchableOpacity
                    style={styles.bannerLeftButton}
                    onPress={() => router.push("/(tabs)/products" as any)}>
                    <Text style={styles.bannerLeftButtonText}>Shop Now</Text>
                  </TouchableOpacity>
                </View>

                <ImageBackground
                  source={images.discount}
                  style={styles.bannerRight}
                  imageStyle={{ borderRadius: 12 }}>
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerRightText}>
                      20% OFF Limited Offer
                    </Text>
                    <Text style={styles.bannerRightSub}>
                      Get a discount for first purchase
                    </Text>
                  </View>
                </ImageBackground>
              </ScrollView>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push("/(tabs)/products" as any)}>
                <Text style={styles.seeAll}>See All</Text>
                <SafeIonicons
                  name="chevron-forward"
                  size={16}
                  color="#619AE4"
                />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 18 }}>
              {filteredItems.products.length > 0 ? (
                filteredItems.products.map((product, idx) => (
                  <View key={product._id} style={{ marginBottom: 8 }}>
                    {/* Updated Product Image with improved handling */}
                    <ProductImage product={product} />

                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        backgroundColor: "#76C4FF",
                        borderRadius: 20,
                        padding: 6,
                        elevation: 4,
                      }}
                      onPress={() =>
                        console.log("Added to Favorites", product)
                      }>
                      <Image
                        source={icons.favorites}
                        style={{ width: 20, height: 20, tintColor: "#0348D3" }}
                      />
                    </TouchableOpacity>

                    <ProductListCard item={product} />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="search" size={48} color="#6B7280" />
                  <Text style={styles.emptyStateText}>No products found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
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
  greetingContainer: {
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 8,
  },
  greetingText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "400",
  },
  usernameText: {
    color: "white",
    fontWeight: "700",
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
  appointmentBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    height: 80,
  },
  appointmentBannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 14,
  },
  appointmentBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  appointmentTextContainer: {
    flex: 1,
  },
  appointmentBannerTitle: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 6,
  },
  appointmentDot: {
    color: "#76C4FF",
    fontSize: 18,
    fontWeight: "900",
  },
  appointmentBannerDetail: {
    color: "#E5E7EB",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  appointmentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  appointmentBannerLocation: {
    color: "#E5E7EB",
    fontSize: 11,
    fontFamily: "Urbanist",
    lineHeight: 16,
    flex: 1,
  },
  appointmentViewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(118, 196, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  reminderModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  reminderModalContent: {
    backgroundColor: "#1a2847",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2d3f5f",
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#1a2847",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2d3f5f",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: {
    flex: 1,
    color: "#FFD700",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  reminderBody: {
    padding: 20,
  },
  reminderText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 10,
    lineHeight: 20,
  },
  reminderService: {
    color: "#E5E7EB",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "500",
    marginBottom: 10,
  },
  reminderSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginBottom: 16,
  },
  reminderTimestamp: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "Urbanist",
  },
  // ✨ UPDATED: Enhanced Notification Modal Styles for LEFT swipe to delete
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
  // ✨ UPDATED: Notification Detail Overlay Styles - Fixed Size
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
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  content: { padding: 12 },
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  seeAll: {
    color: "#619AE4",
    fontFamily: "Urbanist",
    fontWeight: "800",
    marginRight: 6,
  },
  seeAllBtn: { flexDirection: "row", alignItems: "center" },
  fullServiceCard: {
    backgroundColor: "#0D3991",
    borderRadius: 8,
    height: 130,
    padding: 12,
    width: "100%",
  },
  fullInner: { flexDirection: "row", alignItems: "center" },
  serviceTitle: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "500",
    flexWrap: "wrap",
    flexShrink: 1,
  },
  highlightedText: {
    backgroundColor: "#FFD700",
    color: "#0A0E17",
    fontWeight: "800",
  },
  serviceMeta: {
    color: "#DCE6FF",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Urbanist",
  },
  serviceRatingWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    alignItems: "flex-end",
  },
  // ✨ ADDED: Updated star rating styles
  serviceRatingContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingValue: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginLeft: 6,
  },
  ratingCount: {
    color: "#DCE6FF",
    fontSize: 11,
    fontFamily: "Urbanist",
  },
  featuredServicePrice: {
    color: "#E6F4FF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  bookBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 46,
    borderWidth: 1,
    top: 20,
    borderColor: "white",
    marginTop: 8,
  },
  bookBtnText: { color: "white", fontWeight: "700" },
  bannersContainer: { paddingHorizontal: 2, alignItems: "center" },
  bannerLeft: {
    backgroundColor: "#033CA0",
    width: 260,
    borderRadius: 20,
    padding: 12,
    justifyContent: "space-between",
    minHeight: 150,
    marginRight: 10,
  },
  bannerLeftTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  bannerLeftSubtitle: { color: "#9CA3AF", marginTop: 6 },
  bannerLeftButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerLeftButtonText: { color: "white", fontWeight: "700" },
  bannerRight: {
    width: 260,
    minHeight: 150,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
  },
  bannerOverlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  bannerRightText: { color: "white", fontWeight: "700" },
  bannerRightSub: { color: "#D1D5DB", fontSize: 12, marginTop: 4 },
  productListCard: {
    width: "100%",
    borderBottomEndRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  productInfo: {
    padding: 12,
    backgroundColor: "#123A8A",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  productCategory: {
    color: "#FFB7D3",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 6,
    fontWeight: "700",
  },
  productTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productTitle: {
    color: "white",
    fontFamily: "Urbanist",
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  productPrice: { color: "#E6F4FF", fontFamily: "Urbanist", fontWeight: "700" },
  productActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  addToCartBtn: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addToCartText: { color: "white", fontWeight: "700" },
  productRating: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { color: "#DDE6FF", fontSize: 12, fontFamily: "Urbanist" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginTop: 6,
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
  loader: { marginTop: 50 },
});
