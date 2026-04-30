import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  AppState,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useFonts } from "expo-font";
import { SvgUri } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { images } from "@/constants/images";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient, Notification } from "@/app/api/apiClient";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

// keep width; rename height to _height to avoid unused var lint warning
const { width, height: _height } = Dimensions.get("window");

// Add isValidObjectId helper function
const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;

  // Check for common invalid values
  if (id === "my-ratings" || id === "undefined" || id === "null") {
    return false;
  }

  // Standard MongoDB ObjectId format (24 hex characters)
  return /^[0-9a-fA-F]{24}$/.test(id);
};

interface User {
  id: string;
  username?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  isGuest?: boolean;
}

interface Booking {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    category: string;
    duration: string;
    priceRange: string;
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
  isRated?: boolean;
  rating?: string;
  // ✨ ADDED: Downpayment fields
  paymentOption?: "full" | "downpayment";
  downpaymentAmount?: number;
  remainingAmount?: number;
  nonRefundableAmount?: number;
  refundableAmount?: number;
  // ✨ ADDED: Cancellation reason
  cancellationReason?: string;
}

type TabType = "upcoming" | "completed" | "cancelled";

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

// Helper functions
// ✨ FIXED: Removed unused formatTimeWithAMPM function

// ✨ UPDATED: Enhanced time formatting function for proper API format
const formatTimeForAPI = (timeString: string): string => {
  console.log("⏰ Formatting time for API:", timeString);

  try {
    let time = timeString.trim().toUpperCase();

    // If it's already in correct format (HH:MM AM/PM), return as is
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]\s+(AM|PM)$/.test(time)) {
      console.log("✅ Time already in correct format:", time);
      return time;
    }

    // If it's in 24-hour format, convert to 12-hour format
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const twelveHour = hours % 12 || 12;
      const formattedTime = `${twelveHour}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
      console.log("✅ Converted 24h to 12h:", time, "->", formattedTime);
      return formattedTime;
    }

    // Handle various time formats
    const match = time.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      let period = match[3] ? match[3].toUpperCase() : "AM";

      // Validate and adjust period if needed
      if (!match[3]) {
        period = hours >= 12 ? "PM" : "AM";
        if (hours > 12) hours = hours % 12;
      }

      const formattedTime = `${hours}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
      console.log(
        "✅ Formatted time for API:",
        timeString,
        "->",
        formattedTime,
      );
      return formattedTime;
    }

    console.warn("⚠️ Could not parse time format, using fallback:", timeString);
    return "09:30 AM"; // Fallback
  } catch (error) {
    console.error("❌ Error formatting time for API:", error);
    return "09:30 AM"; // Fallback
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatDateShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

// ✨ ADDED: Format currency function
const formatCurrency = (amount: number): string => {
  return `₱${amount?.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ProfileImage Component from Index.tsx
const ProfileImage = ({
  user,
  isLoggedIn,
}: {
  user: User | null;
  isLoggedIn: boolean;
}) => {
  const router = useRouter();
  const [imageSource, setImageSource] = useState(images.profile);
  const [isSvg, setIsSvg] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✨ FIXED: Added useCallback to fix React Hook dependency warning
  const getProfileImageUrl = useCallback(async (): Promise<
    { uri: string } | any
  > => {
    try {
      if (isLoggedIn && user && !user.isGuest) {
        // Priority 1: Check custom profile image from storage
        const customImage = await AsyncStorage.getItem("customProfileImage");
        if (customImage) {
          console.log("🖼️ Using custom profile image");
          return { uri: customImage };
        }

        // Priority 2: Check profile image from user data
        if (user.profileImage) {
          let profileImageUrl = user.profileImage;

          // Ensure proper URL format
          if (profileImageUrl.startsWith("http")) {
            console.log("🖼️ Using HTTP profile image:", profileImageUrl);
            return { uri: profileImageUrl };
          } else {
            // Handle relative paths
            const baseUrl = "http://10.74.230.139:3000";
            const fullUrl = profileImageUrl.startsWith("/")
              ? `${baseUrl}${profileImageUrl}`
              : `${baseUrl}/${profileImageUrl}`;
            console.log("🖼️ Using constructed profile image URL:", fullUrl);
            return { uri: fullUrl };
          }
        }

        // Priority 3: Generate avatar from dicebear
        const seed = user.username || user.id || "default";
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          seed,
        )}`;
        console.log("🖼️ Using generated avatar:", avatarUrl);
        return { uri: avatarUrl };
      }

      // Fallback to default image
      console.log("🖼️ Using default profile image");
      return images.profile;
    } catch (error) {
      console.error("❌ Error in getProfileImageUrl:", error);
      return images.profile;
    }
  }, [isLoggedIn, user]);

  useFocusEffect(
    React.useCallback(() => {
      const loadImage = async () => {
        try {
          setImageError(false);
          const source = await getProfileImageUrl();

          // Validate the image source
          if (source.uri) {
            // Check if it's an SVG
            const svgCheck =
              source.uri.includes("dicebear") ||
              source.uri.includes(".svg") ||
              source.uri.includes("api.dicebear.com");
            setIsSvg(svgCheck);

            // For non-SVG images, we'll validate they load properly
            if (!svgCheck) {
              // Pre-validate image
              Image.getSize(
                source.uri,
                () => {
                  // Image loads successfully
                  setImageSource(source);
                },
                () => {
                  // Image failed to load, use fallback
                  console.log("🖼️ Image failed to load, using fallback");
                  setImageError(true);
                  setImageSource(images.profile);
                },
              );
            } else {
              // It's SVG, set directly
              setImageSource(source);
            }
          } else {
            // Local image resource
            setImageSource(source);
            setIsSvg(false);
          }
        } catch (error) {
          console.error("❌ Error loading profile image:", error);
          setImageError(true);
          setImageSource(images.profile);
          setIsSvg(false);
        }
      };

      loadImage();
    }, [getProfileImageUrl]), // ✨ FIXED: Added dependency
  );

  const handleImageError = () => {
    console.log("🖼️ Image error, using fallback");
    setImageError(true);
    setImageSource(images.profile);
  };

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
      {isSvg && !imageError ? (
        <SvgUri
          width={42}
          height={42}
          uri={imageSource.uri}
          style={styles.profileImg}
          onError={handleImageError}
        />
      ) : (
        <Image
          source={imageSource}
          style={styles.profileImg}
          onError={handleImageError}
          defaultSource={images.profile}
        />
      )}
    </TouchableOpacity>
  );
};

// Rating Modal Component
const RatingModal = ({
  visible,
  onClose,
  booking,
  onRatingSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  booking: Booking | null;
  onRatingSubmit: (rating: number, comment?: string, categories?: any) => void;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState({
    serviceQuality: 0,
    professionalism: 0,
    communication: 0,
    timeliness: 0,
    valueForMoney: 0,
  });
  const [ratingEligibility, setRatingEligibility] = useState<{
    canRate: boolean;
    reason?: string;
  }>({ canRate: true });

  // Check rating eligibility when modal becomes visible
  useEffect(() => {
    const checkEligibility = async () => {
      if (booking) {
        try {
          // Use the new canRateBooking method
          const canRate = await apiClient.canRateBooking(booking._id);
          setRatingEligibility({
            canRate,
            reason: canRate ? undefined : "This booking cannot be rated",
          });
        } catch (error) {
          console.error("Error checking rating eligibility:", error);
          setRatingEligibility({
            canRate: false,
            reason: "Error checking rating eligibility",
          });
        }
      }
    };

    if (visible && booking) {
      checkEligibility();
      // Reset form when modal opens
      setRating(0);
      setComment("");
      setCategories({
        serviceQuality: 0,
        professionalism: 0,
        communication: 0,
        timeliness: 0,
        valueForMoney: 0,
      });
    }
  }, [visible, booking]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!ratingEligibility.canRate) {
      Toast.show({
        type: "error",
        text1: "Cannot Rate",
        text2:
          ratingEligibility.reason ||
          "This booking cannot be rated at this time.",
      });
      return;
    }

    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Rating Required",
        text2: "Please select a rating before submitting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onRatingSubmit(rating, comment, categories);
      onClose();
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    onRatingChange,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
  }) => {
    return (
      <View style={styles.starRatingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#FFD700" : "#CCCCCC"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const CategoryRating = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
  }) => {
    return (
      <View style={styles.categoryRatingContainer}>
        <Text style={styles.categoryLabel}>{label}</Text>
        <View style={styles.categoryStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onValueChange(star)}
              style={styles.categoryStarButton}>
              <Ionicons
                name={star <= value ? "star" : "star-outline"}
                size={20}
                color={star <= value ? "#FFD700" : "#CCCCCC"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.ratingModalOverlay}>
        <View style={styles.ratingModalContent}>
          <View style={styles.ratingHeader}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.ratingCloseButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.ratingTitle}>Rate Your Experience</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.ratingScroll}>
            <View style={styles.bookingInfoSection}>
              <Text style={styles.ratingServiceName}>
                {booking.serviceId.name}
              </Text>
              <Text style={styles.ratingBookingDate}>
                {formatDate(booking.preferredDate)} • {booking.preferredTime}
              </Text>
              {booking.selectedStylistId && (
                <Text style={styles.stylistName}>
                  Stylist: {booking.selectedStylistId.username}
                </Text>
              )}
            </View>

            {!ratingEligibility.canRate && (
              <View style={styles.eligibilityWarning}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                <Text style={styles.eligibilityText}>
                  {ratingEligibility.reason || "This booking cannot be rated"}
                </Text>
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingSectionTitle}>Overall Rating</Text>
              <StarRating rating={rating} onRatingChange={setRating} />
              <Text style={styles.ratingHint}>
                {rating === 0
                  ? "Tap to rate"
                  : `${rating} star${rating > 1 ? "s" : ""}`}
              </Text>
            </View>

            <View style={styles.categoriesSection}>
              <Text style={styles.ratingSectionTitle}>Rate by Category</Text>

              <CategoryRating
                label="Service Quality"
                value={categories.serviceQuality}
                onValueChange={(value) =>
                  setCategories((prev) => ({ ...prev, serviceQuality: value }))
                }
              />

              <CategoryRating
                label="Professionalism"
                value={categories.professionalism}
                onValueChange={(value) =>
                  setCategories((prev) => ({ ...prev, professionalism: value }))
                }
              />

              <CategoryRating
                label="Communication"
                value={categories.communication}
                onValueChange={(value) =>
                  setCategories((prev) => ({ ...prev, communication: value }))
                }
              />

              <CategoryRating
                label="Timeliness"
                value={categories.timeliness}
                onValueChange={(value) =>
                  setCategories((prev) => ({ ...prev, timeliness: value }))
                }
              />

              <CategoryRating
                label="Value for Money"
                value={categories.valueForMoney}
                onValueChange={(value) =>
                  setCategories((prev) => ({ ...prev, valueForMoney: value }))
                }
              />
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.ratingSectionTitle}>
                Additional Comments (Optional)
              </Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.ratingActions}>
            <TouchableOpacity
              style={[
                styles.submitRatingButton,
                (rating === 0 || !ratingEligibility.canRate) &&
                  styles.submitRatingButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                rating === 0 || !ratingEligibility.canRate || submitting
              }>
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitRatingText}>
                  {ratingEligibility.canRate ? "Submit Rating" : "Cannot Rate"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // ✨ ADDED: State for enhanced cancellation modal
  const [cancellationReason, setCancellationReason] = useState("");
  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const [refundDetails, setRefundDetails] = useState<{
    refundAmount: number;
    nonRefundableAmount: number;
    note: string;
  } | null>(null);

  // Notification states
  const [notifications, setNotifications] = useState<
    NotificationItemWithGesture[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationError, setNotificationError] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [notificationDetailVisible, setNotificationDetailVisible] =
    useState(false);

  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;

  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const tabContentOpacity = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

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

  // ✨ ADDED: Notification press handler
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

      // Show notification detail overlay
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

  // ✨ ADDED: Notification functions
  const fetchNotifications = useCallback(async () => {
    try {
      console.log("🔔 Fetching notifications for Appointments screen...");

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
          `✅ Appointments: Loaded ${
            response.data?.length || 0
          } notifications, ${response.unreadCount || 0} unread`,
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
      console.error("❌ Error fetching notifications in Appointments:", error);

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

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUser({
          id: userData._id || userData.id,
          username: userData.username,
          email: userData.email,
          profileImage: userData.profileImage,
          role: userData.role,
          isGuest: userData.isGuest || false,
        });
      } else {
        console.log("🚫 No auth token found, user not logged in");
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📋 Loading user bookings...");

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token found, user not authenticated");
        setBookings([]);
        return;
      }

      const response = await apiClient.getUserBookings();

      if (response && response.success && response.data) {
        const transformedBookings: Booking[] = await Promise.all(
          response.data.map(async (booking: any) => {
            let serviceName = "Service";
            let serviceCategory = "General";
            let serviceDuration = "N/A";
            let servicePriceRange = "₱0";
            let serviceId = "";

            if (booking.serviceId) {
              serviceId = booking.serviceId._id || booking.serviceId;
              serviceName = booking.serviceId.name || serviceName;
              serviceCategory = booking.serviceId.category || serviceCategory;
              serviceDuration = booking.serviceId.duration || serviceDuration;
              servicePriceRange =
                booking.serviceId.priceRange ||
                booking.serviceId.price ||
                servicePriceRange;
            } else if (booking.service) {
              serviceId = booking.service._id || booking.service;
              serviceName = booking.service.name || serviceName;
              serviceCategory = booking.service.category || serviceCategory;
              serviceDuration = booking.service.duration || serviceDuration;
              servicePriceRange =
                booking.service.priceRange ||
                booking.service.price ||
                servicePriceRange;
            }

            // Get username from AsyncStorage instead of user state
            let customerName = "Customer";
            if (booking.customerName && booking.customerName !== "Customer") {
              customerName = booking.customerName;
            } else {
              // Try to get username from AsyncStorage
              const userStr = await AsyncStorage.getItem("user");
              if (userStr) {
                try {
                  const userData = JSON.parse(userStr);
                  customerName =
                    userData.username || userData.name || "Customer";
                } catch (e) {
                  console.error("Error parsing user data:", e);
                }
              }
            }

            let numericPrice = 0;
            if (typeof servicePriceRange === "string") {
              const priceMatch = servicePriceRange.match(/\d+/);
              numericPrice = priceMatch ? parseInt(priceMatch[0]) : 0;
            } else if (typeof servicePriceRange === "number") {
              numericPrice = servicePriceRange;
            }

            // ✨ FIXED: Ensure time is in proper format for API
            const preferredTime = formatTimeForAPI(booking.preferredTime);

            const transformedBooking = {
              _id: booking._id,
              serviceId: {
                _id: serviceId,
                name: serviceName,
                category: serviceCategory,
                duration: serviceDuration,
                priceRange: servicePriceRange,
              },
              customerName: customerName,
              preferredDate: booking.preferredDate,
              preferredTime: preferredTime,
              status: booking.status,
              selectedStylistId: booking.selectedStylistId
                ? {
                    _id: booking.selectedStylistId._id,
                    username: booking.selectedStylistId.username,
                  }
                : undefined,
              createdAt: booking.createdAt,
              cancelledAt: booking.cancelledAt,
              completedAt: booking.completedAt,
              paymentMethod:
                booking.paymentMethod ||
                booking.paymentId?.paymentMethod ||
                "Cash",
              referenceNumber:
                booking.referenceNumber ||
                booking.paymentId?.referenceNumber ||
                "N/A",
              totalAmount:
                booking.totalAmount ||
                booking.paymentId?.amount ||
                numericPrice,
              isRated: booking.isRated || false,
              rating: booking.rating,
              // ✨ ADDED: Downpayment fields
              paymentOption: booking.paymentOption || "full",
              downpaymentAmount: booking.downpaymentAmount || 0,
              remainingAmount: booking.remainingAmount || 0,
              nonRefundableAmount: booking.nonRefundableAmount || 0,
              refundableAmount: booking.refundableAmount || 0,
            };

            return transformedBooking;
          }),
        );

        setBookings(transformedBookings);
      } else {
        console.log("⚠️ No bookings found or invalid response");
        setBookings([]);
      }
    } catch (error) {
      console.error("❌ Error loading appointments:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("unauthorized") ||
          error.message.includes("token") ||
          error.message.includes("Authentication")
        ) {
          Toast.show({
            type: "info",
            text1: "Please Log In",
            text2: "Log in to view your appointments.",
          });
          // Clear invalid token
          await AsyncStorage.removeItem("token");
          setIsLoggedIn(false);
        } else if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          Toast.show({
            type: "error",
            text1: "Network Error",
            text2: "Please check your internet connection.",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load appointments. Please try again.",
          });
        }
      }

      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✨ ADDED: Check rating eligibility before showing modal
  const checkRatingEligibility = async (booking: Booking): Promise<boolean> => {
    try {
      console.log("🔍 Checking rating eligibility for booking:", booking._id);

      // First check if booking is completed and not rated
      if (booking.status !== "completed" || booking.isRated) {
        console.log("❌ Booking cannot be rated:", {
          status: booking.status,
          isRated: booking.isRated,
        });

        let reason = "This booking cannot be rated";
        if (booking.status !== "completed") {
          reason = "Only completed bookings can be rated";
        } else if (booking.isRated) {
          reason = "You have already rated this booking";
        }

        Toast.show({
          type: "error",
          text1: "Cannot Rate",
          text2: reason,
        });
        return false;
      }

      // Use canRateBooking method instead of validateRatingEligibility
      const canRate = await apiClient.canRateBooking(booking._id);

      console.log("📊 Rating eligibility result:", canRate);

      if (!canRate) {
        Toast.show({
          type: "error",
          text1: "Cannot Rate",
          text2: "This booking cannot be rated at this time.",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Error checking rating eligibility:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to check rating eligibility. Please try again.",
      });
      return false;
    }
  };

  // ✨ ADDED: Handle rate booking function
  const handleRateBooking = async (booking: Booking) => {
    try {
      console.log("⭐ Handling rate booking:", booking._id);

      // Check if booking can be rated
      const canRate = await checkRatingEligibility(booking);

      if (!canRate) {
        // Error message is already shown in checkRatingEligibility
        return;
      }

      // Set the selected booking and show rating modal
      setSelectedBooking(booking);
      setRatingModalVisible(true);
    } catch (error) {
      console.error("❌ Error in handleRateBooking:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to open rating form. Please try again.",
      });
    }
  };

  // ✨ FIXED: Handle rating submission with proper time formatting
  const handleRatingSubmit = async (
    rating: number,
    comment?: string,
    categories?: any,
  ) => {
    if (!selectedBooking) return;

    try {
      console.log("⭐ Submitting rating for booking:", selectedBooking._id);

      // FIXED: Add validation for booking ID using the local isValidObjectId function
      if (!selectedBooking._id || !isValidObjectId(selectedBooking._id)) {
        Toast.show({
          type: "error",
          text1: "Invalid Booking",
          text2: "Invalid booking ID format.",
        });
        return;
      }

      // ✨ FIXED: Ensure time is in proper format before submission
      const formattedTime = formatTimeForAPI(selectedBooking.preferredTime);
      console.log("🕒 Formatted time for rating submission:", formattedTime);

      // Use booking entity type for booking ratings
      const ratingData = {
        entityType: "booking" as const,
        entityId: selectedBooking._id,
        staffId: selectedBooking.selectedStylistId?._id,
        serviceId: selectedBooking.serviceId._id,
        rating: rating,
        comment: comment,
        categories: categories,
      };

      console.log("📝 Rating data:", ratingData);

      // Use the validated submitRating method
      const response = await apiClient.submitRatingWithValidation(ratingData);

      if (response.success) {
        // ✨ UPDATED: Mark booking as rated in local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === selectedBooking._id
              ? {
                  ...booking,
                  isRated: true,
                  rating: response.data?._id || "rated",
                }
              : booking,
          ),
        );

        Toast.show({
          type: "success",
          text1: "Rating Submitted",
          text2: "Thank you for your feedback! Your rating has been recorded.",
        });

        // Refresh appointments to get updated data
        await loadAppointments();

        setRatingModalVisible(false);
        setSelectedBooking(null);
      } else {
        throw new Error(response.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("❌ Error submitting rating:", error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to submit rating. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("cannot be rated at this time")) {
          errorMessage =
            "This booking cannot be rated. Please make sure it's completed and not already rated.";
        } else if (error.message.includes("already rated")) {
          errorMessage = "You have already rated this booking.";
        } else if (error.message.includes("not found")) {
          errorMessage =
            "Booking not found or you don't have permission to rate it.";
        } else if (error.message.includes("Authentication")) {
          errorMessage = "Please login again to submit rating.";
        } else if (error.message.includes("Invalid entity ID")) {
          errorMessage = "Invalid booking format. Please try again.";
        } else if (
          error.message.includes("Time must be in HH:MM AM/PM format")
        ) {
          errorMessage = "Time format error. Please contact support.";
        } else {
          errorMessage = error.message;
        }
      }

      Toast.show({
        type: "error",
        text1: "Rating Failed",
        text2: errorMessage,
      });
    }
  };

  // ✨ UPDATED: Enhanced cancellation handler with proper time formatting
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancellationReason(""); // Reset reason
    setShowRefundDetails(false);
    setRefundDetails(null);
    setCancelModalVisible(true);
  };

  // ✨ ADDED: Calculate refund details before cancellation
  const calculateRefundDetails = async (booking: Booking) => {
    try {
      console.log("💰 Calculating refund details for booking:", booking._id);

      // ✨ FIXED: Always calculate 70% refundable and 30% non-refundable
      const totalAmount = booking.totalAmount || 0;
      const nonRefundableAmount = Math.round(totalAmount * 0.3); // 30% for reservation
      const refundableAmount = totalAmount - nonRefundableAmount; // 70% refundable

      setRefundDetails({
        refundAmount: refundableAmount,
        nonRefundableAmount: nonRefundableAmount,
        note: "30% of total amount is non-refundable as slot reservation fee. 70% will be refunded.",
      });

      setShowRefundDetails(true);
    } catch (error) {
      console.error("❌ Error calculating refund details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to calculate refund details. Please try again.",
      });
    }
  };

  // ✨ UPDATED: Fixed cancellation confirmation using existing apiClient methods
  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;

    // ✨ ADDED: Validation for required cancellation reason
    if (!cancellationReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Reason Required",
        text2: "Please provide a cancellation reason before proceeding.",
      });
      return;
    }

    try {
      setCancelling(true);
      console.log("🚫 Cancelling booking:", selectedBooking._id);

      // First, check if the booking can be cancelled by checking its status
      // Since we don't have canCancelBooking method, we'll check locally
      const canCancel =
        selectedBooking.status === "pending" ||
        selectedBooking.status === "confirmed";
      const requiresContact = selectedBooking.status === "confirmed";

      if (!canCancel) {
        Toast.show({
          type: "error",
          text1: "Cannot Cancel",
          text2: "This booking cannot be cancelled at this time.",
        });
        return;
      }

      if (requiresContact) {
        // Show contact information for confirmed bookings
        setCancelModalVisible(false);
        Toast.show({
          type: "info",
          text1: "Contact Salon Required",
          text2: "Please call the salon to cancel confirmed appointments.",
          visibilityTime: 6000,
        });

        // Show contact info modal
        setTimeout(() => {
          alert(
            "📞 Contact SandreaLee Salon\n\n" +
              "This confirmed appointment requires phone cancellation.\n\n" +
              "Please call: (02) 1234-5678\n\n" +
              "Hours: 9:00 AM - 8:00 PM",
          );
        }, 1000);
        return;
      }

      console.log("📤 Sending cancellation request with data:", {
        bookingId: selectedBooking._id,
        cancellationReason: cancellationReason.trim(),
      });

      // Use the existing cancelBookingWithRefund method from your apiClient
      const response = await apiClient.cancelBookingWithRefund(
        selectedBooking._id,
        cancellationReason.trim(),
      );

      if (response && response.success) {
        // Update local state with cancellation details
        setBookings((prev) =>
          prev.map((b) =>
            b._id === selectedBooking._id
              ? {
                  ...b,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                  cancellationReason: cancellationReason.trim(),
                }
              : b,
          ),
        );

        // Show cancellation success message with refund details
        let successMessage =
          "Your appointment has been successfully cancelled.";

        if (response.data?.refundDetails) {
          const refund = response.data.refundDetails;
          if (refund.refundAmount > 0) {
            successMessage += ` Refund amount: ${formatCurrency(
              refund.refundAmount,
            )}.`;
          }
          if (refund.nonRefundableAmount > 0) {
            successMessage += ` ${formatCurrency(
              refund.nonRefundableAmount,
            )} retained as reservation fee.`;
          }
        } else {
          // Fallback to calculated refund details
          if (refundDetails) {
            if (refundDetails.refundAmount > 0) {
              successMessage += ` Refund amount: ${formatCurrency(
                refundDetails.refundAmount,
              )}.`;
            }
            if (refundDetails.nonRefundableAmount > 0) {
              successMessage += ` ${formatCurrency(
                refundDetails.nonRefundableAmount,
              )} retained as reservation fee.`;
            }
          }
        }

        Toast.show({
          type: "success",
          text1: "Booking Cancelled",
          text2: successMessage,
        });

        setCancelModalVisible(false);
        setSelectedBooking(null);
        setCancellationReason("");
        setShowRefundDetails(false);
        setRefundDetails(null);

        await loadAppointments();
      } else {
        throw new Error(response?.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to cancel booking. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("Contact Salon")) {
          errorMessage = error.message;
        } else if (error.message.includes("Confirmed")) {
          errorMessage = error.message;
        } else if (
          error.message.includes("Time must be in HH:MM AM/PM format")
        ) {
          errorMessage = "Time format error. Please contact support.";
        } else if (error.message.includes("Booking validation failed")) {
          errorMessage =
            "Booking validation failed. Please try again or contact support.";
        } else if (error.message.includes("cancellation reason")) {
          errorMessage = "Cancellation reason is required.";
        } else if (error.message.includes("cannot be cancelled at this time")) {
          errorMessage =
            "This booking cannot be cancelled. Please contact the salon directly.";
        } else {
          errorMessage = error.message;
        }
      }

      Toast.show({
        type: "error",
        text1: "Cancellation Failed",
        text2: errorMessage,
        visibilityTime: 5000,
      });
    } finally {
      setCancelling(false);
    }
  };

  // FIXED: Added missing dependencies to useEffect
  useEffect(() => {
    checkAuthStatus();
    loadAppointments();
  }, [checkAuthStatus, loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
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

  useEffect(() => {
    if (!isLoggedIn && !loading) {
      console.log("🔐 User not logged in, redirecting to auth...");
      router.replace("/(auth)");
    }
  }, [isLoggedIn, loading, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log("🔄 App became active, refreshing appointments...");
        loadAppointments();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadAppointments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuthStatus();
    await loadAppointments();
    if (isLoggedIn && !user?.isGuest) {
      await fetchNotificationsWithRetry();
    }
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Appointments updated successfully!",
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

  const handleTabChange = (tab: TabType) => {
    Animated.timing(tabContentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);

      const tabPositions = { upcoming: 0, completed: 1, cancelled: 2 };
      const position = tabPositions[tab];
      const tabWidth = (width - 40) / 3;

      Animated.spring(tabIndicatorPosition, {
        toValue: position * tabWidth,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      Animated.timing(tabContentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const getTimeUntilAppointment = (date: string, time: string): string => {
    try {
      const appointmentDate = new Date(date);
      const timeStr = time.split(" ")[0];
      const period = time.includes("PM") ? "PM" : "AM";

      let [hours, minutes] = timeStr.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      appointmentDate.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const diffMs = appointmentDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 0) return "Past due";
      if (diffMins < 60) return `${diffMins} mins before`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} before`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? "s" : ""} before`;
    } catch {
      return "Soon";
    }
  };

  const handleViewReceipt = (booking: Booking) => {
    setSelectedBooking(booking);
    setReceiptModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "completed":
        return "#3B82F6";
      case "cancelled":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCategoryImage = (category: string) => {
    const categoryImages: Record<string, any> = {
      "Haircuts & Basic Services": images.category_coloring,
      "Hair Coloring": images.category_hair_coloring,
      "Perming & Texture Services": images.category_perming,
      "Rebonding/Straightening": images.category_rebonding,
      "Hair Treatments": images.category_treatments,
      "Combination Services": images.category_combination,
      "Hair Extensions": images.category_extensions,
      "Styling & Special Services": images.category_styling,
      "Package Sets": images.category_packages,
    };

    const categoryLower = category.toLowerCase();

    if (categoryImages[category]) {
      return categoryImages[category];
    }

    const exactMatch = Object.keys(categoryImages).find(
      (key) => key.toLowerCase() === categoryLower,
    );
    if (exactMatch) {
      return categoryImages[exactMatch];
    }

    if (
      categoryLower.includes("haircut") ||
      categoryLower.includes("basic") ||
      categoryLower.includes("trim") ||
      categoryLower.includes("cut")
    ) {
      return images.category_coloring;
    }

    if (
      categoryLower.includes("color") ||
      categoryLower.includes("colour") ||
      categoryLower.includes("dye")
    ) {
      return images.category_hair_coloring;
    }

    if (
      categoryLower.includes("perm") ||
      categoryLower.includes("texture") ||
      categoryLower.includes("wave")
    ) {
      return images.category_perming;
    }

    if (
      categoryLower.includes("rebond") ||
      categoryLower.includes("straight") ||
      categoryLower.includes("smooth")
    ) {
      return images.category_rebonding;
    }

    if (
      categoryLower.includes("treatment") ||
      categoryLower.includes("shampoo") ||
      categoryLower.includes("conditioner") ||
      categoryLower.includes("mask")
    ) {
      return images.category_treatments;
    }

    if (categoryLower.includes("extension")) {
      return images.category_extensions;
    }

    if (
      categoryLower.includes("styling") ||
      categoryLower.includes("special") ||
      categoryLower.includes("updo") ||
      categoryLower.includes("blowdry")
    ) {
      return images.category_styling;
    }

    if (
      categoryLower.includes("package") ||
      categoryLower.includes("set") ||
      categoryLower.includes("bundle")
    ) {
      return images.category_packages;
    }

    if (
      categoryLower.includes("combination") ||
      categoryLower.includes("combo")
    ) {
      return images.category_combination;
    }

    return images.category_coloring;
  };

  const getFilteredBookings = (): Booking[] => {
    let filtered: Booking[] = [];

    switch (activeTab) {
      case "upcoming":
        filtered = bookings.filter(
          (b) => b.status === "pending" || b.status === "confirmed",
        );
        break;
      case "completed":
        filtered = bookings.filter((b) => b.status === "completed");
        break;
      case "cancelled":
        filtered = bookings.filter((b) => b.status === "cancelled");
        break;
      default:
        return [];
    }

    return filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.preferredDate);
        const timeStrA = a.preferredTime.split(" ")[0];
        const periodA = a.preferredTime.includes("PM") ? "PM" : "AM";
        let [hoursA, minutesA] = timeStrA.split(":").map(Number);
        if (periodA === "PM" && hoursA !== 12) hoursA += 12;
        if (periodA === "AM" && hoursA === 12) hoursA = 0;
        dateA.setHours(hoursA, minutesA, 0, 0);

        const dateB = new Date(b.preferredDate);
        const timeStrB = b.preferredTime.split(" ")[0];
        const periodB = b.preferredTime.includes("PM") ? "PM" : "AM";
        let [hoursB, minutesB] = timeStrB.split(":").map(Number);
        if (periodB === "PM" && hoursB !== 12) hoursB += 12;
        if (periodB === "AM" && hoursB === 12) hoursB = 0;
        dateB.setHours(hoursB, minutesB, 0, 0);

        if (activeTab === "upcoming") {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      } catch {
        return 0;
      }
    });
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const isUpcoming = activeTab === "upcoming";
    const isCompleted = activeTab === "completed";
    const isCancelled = activeTab === "cancelled";

    // ✨ ADDED: Calculate refund amounts for cancelled bookings
    const getRefundInfo = () => {
      if (booking.status !== "cancelled") return null;

      // Use the refundableAmount from booking data if available, otherwise calculate it
      const totalAmount = booking.totalAmount || 0;
      const refundableAmount =
        booking.refundableAmount || Math.round(totalAmount * 0.7);
      const nonRefundableAmount =
        booking.nonRefundableAmount || Math.round(totalAmount * 0.3);

      return { refundableAmount, nonRefundableAmount };
    };

    const refundInfo = getRefundInfo();

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.serviceImageContainer}>
            <Image
              source={getCategoryImage(booking.serviceId.category)}
              style={styles.serviceImage}
            />
          </View>

          <View style={styles.bookingInfo}>
            <View style={styles.dateStatusRow}>
              <Text style={styles.bookingDate}>
                {formatDate(booking.preferredDate)} {booking.preferredTime}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(booking.status)}20` },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(booking.status) },
                  ]}>
                  {getStatusText(booking.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.salonName}>SandreaLee Salon</Text>
            <Text style={styles.salonAddress}>
              SandreaLee Salon, 2184 Loyola St.{"\n"}
              Sampaloc, Manila, 1008 Metro Manila
            </Text>

            <Text style={styles.serviceLabel}>
              Service:{" "}
              <Text style={styles.serviceName}>{booking.serviceId.name}</Text>
            </Text>

            {/* ✨ ADDED: Payment option display */}
            {booking.paymentOption && (
              <View style={styles.paymentOptionRow}>
                <Text style={styles.paymentOptionLabel}>Payment: </Text>
                <Text style={styles.paymentOptionValue}>
                  {booking.paymentOption === "downpayment"
                    ? "30% Downpayment"
                    : "Full Payment"}
                </Text>
              </View>
            )}

            {/* ✨ ADDED: Refund information for cancelled bookings */}
            {isCancelled && refundInfo && (
              <View style={styles.refundInfoContainer}>
                <View style={styles.refundRow}>
                  <Text style={styles.refundLabel}>Refund Amount:</Text>
                  <Text style={styles.refundAmount}>
                    {formatCurrency(refundInfo.refundableAmount)}
                  </Text>
                </View>
                <Text style={styles.refundNote}>
                  30% reservation fee (
                  {formatCurrency(refundInfo.nonRefundableAmount)}) retained
                </Text>
              </View>
            )}

            {isCompleted && (
              <View style={styles.ratingStatus}>
                {booking.isRated ? (
                  <View style={styles.ratedBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratedText}>Rated</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => handleRateBooking(booking)}>
                    <Ionicons name="star-outline" size={14} color="#619AE4" />
                    <Text style={styles.rateText}>Rate Service</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {isUpcoming && (
          <View style={styles.actionRow}>
            <View style={styles.reminderBadge}>
              <Ionicons name="time-outline" size={12} color="white" />
              <Text style={styles.reminderText}>
                {getTimeUntilAppointment(
                  booking.preferredDate,
                  booking.preferredTime,
                )}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.viewReceiptButton}
                onPress={() => handleViewReceipt(booking)}>
                <Text style={styles.viewReceiptText}>View Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCancelBooking(booking);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedActions}>
            <TouchableOpacity
              style={styles.viewReceiptButtonFull}
              onPress={() => handleViewReceipt(booking)}>
              <Ionicons name="receipt-outline" size={16} color="#619AE4" />
              <Text style={styles.viewReceiptTextFull}>View Receipt</Text>
            </TouchableOpacity>

            {!booking.isRated && (
              <TouchableOpacity
                style={styles.rateServiceButton}
                onPress={() => handleRateBooking(booking)}>
                <Ionicons name="star-outline" size={16} color="#FFD700" />
                <Text style={styles.rateServiceText}>Rate Service</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ✨ ADDED: View receipt button for cancelled bookings */}
        {isCancelled && (
          <View style={styles.cancelledActions}>
            <TouchableOpacity
              style={styles.viewReceiptButtonFull}
              onPress={() => handleViewReceipt(booking)}>
              <Ionicons name="receipt-outline" size={16} color="#619AE4" />
              <Text style={styles.viewReceiptTextFull}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ✨ UPDATED: Enhanced cancellation modal with proper text input and scrolling
  // ✨ UPDATED: Fixed cancellation modal with proper styling and no black overlay
  // ✨ UPDATED: Enhanced cancellation modal with proper text input and scrolling
  // ✨ UPDATED: Enhanced cancellation modal with predefined reason choices
  const CancellationModal = () => {
    if (!selectedBooking) return null;

    // ✨ ADDED: Predefined cancellation reasons
    const cancellationReasons = [
      "Schedule conflict",
      "Found another salon",
      "Service no longer needed",
      "Financial reasons",
      "Dissatisfied with service options",
      "Personal emergency",
      "Health concerns",
      "Moving locations",
      "Other",
    ];

    const handleReasonSelect = (reason: string) => {
      setCancellationReason(reason);
    };

    return (
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setCancelModalVisible(false);
          setShowRefundDetails(false);
          setRefundDetails(null);
          setCancellationReason("");
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={48} color="#F59E0B" />
            </View>

            <Text style={styles.modalTitle}>Cancel Booking</Text>

            <Text style={styles.modalMessage}>
              {selectedBooking && (
                <Text style={styles.bookingStatusInfo}>
                  Booking Status:{" "}
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(selectedBooking.status) },
                    ]}>
                    {getStatusText(selectedBooking.status).toUpperCase()}
                  </Text>
                  {"\n\n"}
                </Text>
              )}
              Are you sure you want to cancel this appointment?{"\n\n"}
              <Text style={styles.refundWarning}>
                💰 30% of total amount will be retained as slot reservation fee
                (₱
                {Math.round((selectedBooking?.totalAmount || 0) * 0.3)}).
                {"\n"}70% will be refunded (₱
                {Math.round((selectedBooking?.totalAmount || 0) * 0.7)}).
                {"\n\n"}
              </Text>
              This action cannot be undone.
            </Text>

            {!showRefundDetails ? (
              <>
                <View style={styles.reasonSelectionContainer}>
                  <Text style={styles.reasonLabel}>
                    Select Cancellation Reason
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>

                  <ScrollView
                    style={styles.reasonsScrollView}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.reasonsScrollContent}>
                    {cancellationReasons.map((reason, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.reasonOption,
                          cancellationReason === reason &&
                            styles.reasonOptionSelected,
                        ]}
                        onPress={() => handleReasonSelect(reason)}>
                        <View style={styles.reasonRadio}>
                          {cancellationReason === reason && (
                            <View style={styles.reasonRadioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.reasonOptionText,
                            cancellationReason === reason &&
                              styles.reasonOptionTextSelected,
                          ]}>
                          {reason}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {!cancellationReason && (
                    <Text style={styles.errorText}>
                      Please select a cancellation reason
                    </Text>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.keepButton}
                    onPress={() => {
                      setCancelModalVisible(false);
                      setCancellationReason("");
                    }}>
                    <Text style={styles.keepButtonText}>Keep Appointment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmCancelButton,
                      !cancellationReason && styles.buttonDisabled,
                    ]}
                    onPress={() => {
                      if (!cancellationReason) {
                        Toast.show({
                          type: "error",
                          text1: "Reason Required",
                          text2: "Please select a cancellation reason.",
                        });
                        return;
                      }
                      calculateRefundDetails(selectedBooking);
                    }}
                    disabled={!cancellationReason}>
                    <Text style={styles.confirmCancelText}>
                      View Refund Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.refundSectionTitle}>
                  Refund Details for Cancellation:
                </Text>

                {refundDetails && (
                  <View style={styles.refundDetails}>
                    <View style={styles.refundRow}>
                      <Text style={styles.refundLabel}>Total Amount:</Text>
                      <Text style={styles.refundValue}>
                        {formatCurrency(selectedBooking.totalAmount || 0)}
                      </Text>
                    </View>

                    {refundDetails.nonRefundableAmount > 0 && (
                      <View style={styles.refundRow}>
                        <Text style={styles.refundLabel}>
                          Reservation Fee (30%):
                        </Text>
                        <Text
                          style={[styles.refundValue, styles.nonRefundable]}>
                          -{formatCurrency(refundDetails.nonRefundableAmount)}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.refundRow, styles.refundTotal]}>
                      <Text style={styles.refundLabel}>
                        Refund Amount (70%):
                      </Text>
                      <Text style={[styles.refundValue, styles.refundAmount]}>
                        {formatCurrency(refundDetails.refundAmount)}
                      </Text>
                    </View>

                    <Text style={styles.refundNote}>{refundDetails.note}</Text>

                    <View style={styles.reasonPreview}>
                      <Text style={styles.reasonPreviewLabel}>
                        Cancellation Reason:
                      </Text>
                      <Text style={styles.reasonPreviewText}>
                        {cancellationReason}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setShowRefundDetails(false)}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmCancelButton}
                    onPress={confirmCancelBooking}
                    disabled={cancelling}>
                    {cancelling ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmCancelText}>
                        Confirm Cancellation
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const ReceiptModal = () => {
    if (!selectedBooking) return null;

    return (
      <Modal
        visible={receiptModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReceiptModalVisible(false)}>
        <View style={styles.receiptModalOverlay}>
          <View style={styles.receiptModalContent}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity
                onPress={() => setReceiptModalVisible(false)}
                style={styles.receiptCloseButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>Booking Receipt</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.receiptScroll}>
              <View style={styles.receiptSalonSection}>
                <Image
                  source={require("../../assets/images/SandreaLeeSalonLogoCapstone.png")}
                  style={styles.receiptLogo}
                  resizeMode="contain"
                />
                <Text style={styles.receiptSalonName}>SandreaLee Salon</Text>
                <Text style={styles.receiptSalonAddress}>
                  2184 Loyola St, Sampaloc{"\n"}Manila, 1008 Metro Manila
                </Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptInfoSection}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Booking ID</Text>
                  <Text style={styles.receiptValue}>
                    #{selectedBooking._id.slice(-8).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <View
                    style={[
                      styles.receiptStatusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          selectedBooking.status,
                        )}20`,
                      },
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            selectedBooking.status,
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.receiptStatusText,
                        { color: getStatusColor(selectedBooking.status) },
                      ]}>
                      {getStatusText(selectedBooking.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ✨ ADDED: Payment details section */}
              {selectedBooking.paymentOption && (
                <View style={styles.receiptPaymentDetails}>
                  <Text style={styles.receiptSectionTitle}>
                    Payment Details
                  </Text>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Option</Text>
                    <Text style={styles.receiptValue}>
                      {selectedBooking.paymentOption === "downpayment"
                        ? "30% Downpayment"
                        : "Full Payment"}
                    </Text>
                  </View>
                  {selectedBooking.paymentOption === "downpayment" && (
                    <>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>
                          Downpayment Amount
                        </Text>
                        <Text style={styles.receiptValue}>
                          {formatCurrency(
                            selectedBooking.downpaymentAmount || 0,
                          )}
                        </Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>
                          Remaining Amount
                        </Text>
                        <Text style={styles.receiptValue}>
                          {formatCurrency(selectedBooking.remainingAmount || 0)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.receiptServiceSection}>
                <Text style={styles.receiptSectionTitle}>Service Details</Text>
                <View style={styles.serviceDetailRow}>
                  <Image
                    source={getCategoryImage(
                      selectedBooking.serviceId.category,
                    )}
                    style={styles.receiptServiceImage}
                  />
                  <View style={styles.receiptServiceInfo}>
                    <Text style={styles.receiptServiceName}>
                      {selectedBooking.serviceId.name}
                    </Text>
                    <Text style={styles.receiptServiceCategory}>
                      {selectedBooking.serviceId.category}
                    </Text>
                    <View style={styles.receiptServiceMeta}>
                      <View style={styles.receiptMetaItem}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.receiptMetaText}>
                          {selectedBooking.serviceId.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.receiptDetailsSection}>
                <Text style={styles.receiptSectionTitle}>
                  Appointment Details
                </Text>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#619AE4"
                    />
                  </View>
                  <View>
                    <Text style={styles.receiptDetailLabel}>Date</Text>
                    <Text style={styles.receiptDetailValue}>
                      {formatDate(selectedBooking.preferredDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons name="time-outline" size={20} color="#619AE4" />
                  </View>
                  <View>
                    <Text style={styles.receiptDetailLabel}>Time</Text>
                    <Text style={styles.receiptDetailValue}>
                      {selectedBooking.preferredTime}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons name="person-outline" size={20} color="#619AE4" />
                  </View>
                  <View>
                    <Text style={styles.receiptDetailLabel}>Customer</Text>
                    <Text style={styles.receiptDetailValue}>
                      {selectedBooking.customerName}
                    </Text>
                  </View>
                </View>
                {selectedBooking.selectedStylistId && (
                  <View style={styles.receiptDetailItem}>
                    <View style={styles.receiptDetailIcon}>
                      <Ionicons name="cut-outline" size={20} color="#619AE4" />
                    </View>
                    <View>
                      <Text style={styles.receiptDetailLabel}>Stylist</Text>
                      <Text style={styles.receiptDetailValue}>
                        {selectedBooking.selectedStylistId.username}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.receiptPaymentSection}>
                <Text style={styles.receiptSectionTitle}>
                  Payment Information
                </Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>
                  <Text style={styles.receiptValue}>
                    {selectedBooking.paymentMethod || "Cash"}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Reference Number</Text>
                  <Text style={styles.receiptReferenceValue}>
                    {selectedBooking.referenceNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total Amount</Text>
                  <Text style={styles.receiptTotalValue}>
                    {formatCurrency(selectedBooking.totalAmount || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptTimestamps}>
                <Text style={styles.timestampText}>
                  Booked on: {formatDateShort(selectedBooking.createdAt)}
                </Text>
                {selectedBooking.completedAt && (
                  <Text style={styles.timestampText}>
                    Completed on: {formatDateShort(selectedBooking.completedAt)}
                  </Text>
                )}
                {selectedBooking.cancelledAt && (
                  <Text style={[styles.timestampText, { color: "#EF4444" }]}>
                    Cancelled on: {formatDateShort(selectedBooking.cancelledAt)}
                  </Text>
                )}
              </View>

              <View style={styles.receiptFooter}>
                <Text style={styles.receiptFooterText}>
                  Thank you for choosing SandreaLee Salon!
                </Text>
                <Text style={styles.receiptFooterSubtext}>
                  For inquiries, contact us at (02) 1234-5678
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setReceiptModalVisible(false)}
              style={styles.receiptCloseButtonBottom}>
              <LinearGradient
                colors={["#619AE4", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.receiptCloseGradient}>
                <Text style={styles.receiptCloseText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#619AE4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#619AE4" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            {/* UPDATED: Using the ProfileImage component */}
            <ProfileImage user={user} isLoggedIn={isLoggedIn} />
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
                        <Text style={styles.markAllReadText}>
                          Mark all read
                        </Text>
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
                    <Text style={styles.authRequiredText}>
                      Sign In Required
                    </Text>
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

        {/* ✨ ADDED: Notification Detail Overlay */}
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

        <Text style={styles.pageTitle}>Your Appointments</Text>

        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [{ translateX: tabIndicatorPosition }],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange("upcoming")}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "upcoming" && styles.tabTextActive,
                ]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange("completed")}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "completed" && styles.tabTextActive,
                ]}>
                Completed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleTabChange("cancelled")}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "cancelled" && styles.tabTextActive,
                ]}>
                Cancelled
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={[styles.contentContainer, { opacity: tabContentOpacity }]}>
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
            ) : getFilteredBookings().length > 0 ? (
              <View style={styles.bookingsList}>
                {getFilteredBookings().map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#6B7280" />
                <Text style={styles.emptyStateText}>
                  No {activeTab} appointments
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {activeTab === "upcoming"
                    ? "Book a service to see your upcoming appointments"
                    : `You don't have any ${activeTab} appointments yet`}
                </Text>
                {activeTab === "upcoming" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/services" as any)}
                    style={styles.bookNowButton}>
                    <LinearGradient
                      colors={["#619AE4", "#3B82F6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.bookNowGradient}>
                      <Text style={styles.bookNowText}>Book Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* ✨ UPDATED: Using enhanced cancellation modal */}
        <CancellationModal />

        <RatingModal
          visible={ratingModalVisible}
          onClose={() => setRatingModalVisible(false)}
          booking={selectedBooking}
          onRatingSubmit={handleRatingSubmit}
        />

        <ReceiptModal />

        <Toast />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0A0E17",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Urbanist",
  },
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
  // ✨ ADDED: Notification Modal Styles
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
  // ✨ ADDED: Notification Detail Overlay Styles
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
    width: "90%",
    maxWidth: 400,
    height: "70%",
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
  pageTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  tabsWrapper: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#545454",
    borderRadius: 100,
    position: "relative",
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: (width - 32) / 3,
    backgroundColor: "#161B28",
    borderRadius: 100,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 200,
    zIndex: 1,
  },
  tabText: {
    color: "#4D5766",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "white",
    fontWeight: "800",
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  bookingsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    gap: 12,
  },
  serviceImageContainer: {
    position: "relative",
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  bookingInfo: {
    flex: 1,
  },
  dateStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bookingDate: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  salonName: {
    color: "#E5E7EB",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  salonAddress: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 6,
  },
  serviceName: {
    color: "white",
    fontWeight: "600",
  },
  // ✨ ADDED: Payment option styles
  paymentOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentOptionLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  paymentOptionValue: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  ratingStatus: {
    marginTop: 8,
  },
  ratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  ratedText: {
    color: "#22C55E",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  rateText: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  actionRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  reminderText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  viewReceiptButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#619AE4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewReceiptText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  completedActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    flexDirection: "row",
    gap: 12,
  },
  viewReceiptButtonFull: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#619AE4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewReceiptTextFull: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  rateServiceButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rateServiceText: {
    color: "#FFD700",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  bookNowButton: {
    marginTop: 8,
  },
  bookNowGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  bookNowText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  loader: {
    marginTop: 100,
  },
  // ✨ UPDATED: Enhanced cancellation modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalScrollContainer: {
    width: "100%",
    maxHeight: "90%",
    justifyContent: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    color: "#D1D5DB",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  refundWarning: {
    color: "#F59E0B",
    fontWeight: "600",
  },
  // ✨ ADDED: Status info styles
  bookingStatusInfo: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
  },
  confirmedWarning: {
    color: "#F59E0B",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "600",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 8,
    borderRadius: 8,
  },
  // ✨ ADDED: Reason input styles
  reasonInputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  reasonLabel: {
    color: "#E5E7EB",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
  },
  reasonInputWrapper: {
    backgroundColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4B5563",
    overflow: "hidden",
    minHeight: 120,
  },
  reasonInput: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: "top",
    padding: 16,
    paddingBottom: 8,
    lineHeight: 20,
  },
  reasonInputError: {
    borderColor: "#EF4444",
  },
  charCount: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Urbanist",
    textAlign: "right",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginTop: 8,
    fontWeight: "600",
  },
  requiredStar: {
    color: "#EF4444",
  },
  buttonDisabled: {
    backgroundColor: "#6B7280",
    opacity: 0.6,
  },
  // ✨ ADDED: Refund details styles
  refundDetails: {
    width: "100%",
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  refundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refundTotal: {
    borderTopWidth: 1,
    borderTopColor: "#4B5563",
    paddingTop: 12,
    marginTop: 4,
  },
  refundLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  refundValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  nonRefundable: {
    color: "#EF4444",
  },
  refundAmount: {
    color: "#22C55E",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  refundNote: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  cancelledActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  reasonPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
  },
  reasonPreviewLabel: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  reasonPreviewText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 18,
  },
  // ✨ ADDED: Refund section title
  refundSectionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
  },
  modalButtons: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  keepButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  keepButtonText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6B7280",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  confirmCancelButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmCancelText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  ratingModalContent: {
    flex: 1,
    backgroundColor: "#0A0E17",
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  ratingCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  ratingScroll: {
    flex: 1,
    padding: 20,
  },
  bookingInfoSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  ratingServiceName: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  ratingBookingDate: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 4,
  },
  stylistName: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  eligibilityWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  eligibilityText: {
    color: "#F59E0B",
    fontSize: 14,
    fontFamily: "Urbanist",
    flex: 1,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  ratingSectionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  starRatingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingHint: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoryRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryLabel: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    flex: 1,
  },
  categoryStars: {
    flexDirection: "row",
  },
  categoryStarButton: {
    padding: 2,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInputContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
  },
  commentInput: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    minHeight: 100,
    textAlignVertical: "top",
    paddingVertical: 12, // ✨ FIXED: Add proper padding for text input
  },
  ratingActions: {
    padding: 20,
    paddingTop: 0,
  },
  submitRatingButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  submitRatingButtonDisabled: {
    backgroundColor: "#374151",
  },
  submitRatingText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  receiptModalContent: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  receiptCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  receiptScroll: {
    flex: 1,
  },
  receiptSalonSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  receiptLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  receiptSalonName: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  receiptSalonAddress: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 20,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#1F2937",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  receiptInfoSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  receiptValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  receiptStatusText: {
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  // ✨ ADDED: Payment details section
  receiptPaymentDetails: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  receiptServiceSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  receiptSectionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  serviceDetailRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  receiptServiceImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#374151",
  },
  receiptServiceInfo: {
    flex: 1,
  },
  receiptServiceName: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  receiptServiceCategory: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginBottom: 8,
  },
  receiptServiceMeta: {
    flexDirection: "row",
    gap: 12,
  },

  receiptMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  receiptMetaText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  receiptDetailsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  receiptDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  receiptDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptDetailLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 2,
  },
  receiptDetailValue: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptPaymentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  receiptReferenceValue: {
    color: "#619AE4",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptTotalLabel: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  receiptTotalValue: {
    color: "#22C55E",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  receiptTimestamps: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  timestampText: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  receiptFooter: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  receiptFooterText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  receiptFooterSubtext: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  receiptCloseButtonBottom: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  receiptCloseGradient: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  refundInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  receiptCloseText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  // ✨ ADDED: Styles for predefined reason selection
  reasonSelectionContainer: {
    width: "100%",
    marginBottom: 20,
    maxHeight: 300,
  },
  reasonsScrollView: {
    maxHeight: 200,
    backgroundColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  reasonsScrollContent: {
    padding: 8,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  reasonOptionSelected: {
    backgroundColor: "rgba(97, 154, 228, 0.2)",
    borderColor: "#619AE4",
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reasonRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#619AE4",
  },
  reasonOptionText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "Urbanist",
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
});
