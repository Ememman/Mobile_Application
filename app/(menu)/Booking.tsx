import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/app/api/apiClient";
import { images } from "@/constants/images";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface Booking {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    category: string;
    duration: string;
    priceRange: string;
    rating?: number;
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

type TabType = "recent" | "completed";

export default function Booking() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const tabIndicatorPosition = React.useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Urbanist: require("../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  useEffect(() => {
    checkAuthAndLoadBookings();
  }, []);

  // ✅ REAL-TIME UPDATE: Refresh when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log("🔄 App became active, refreshing bookings...");
        loadBookings();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ✅ REAL-TIME UPDATE: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoggedIn) {
        console.log("⏰ Auto-refreshing bookings...");
        loadBookings();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const checkAuthAndLoadBookings = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);

      if (token) {
        await loadBookings();
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error checking auth:", error.message);
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log("📋 Loading bookings...");

      const response = await apiClient.getUserBookings();

      if (response && response.success && response.data) {
        const transformedBookings: Booking[] = response.data.map(
          (booking: any) => {
            console.log(
              "🔍 DETAILED booking object:",
              JSON.stringify(booking, null, 2)
            );

            // ✅ IMPROVED: Extract service data with better logging (matching Appointments.tsx)
            let serviceName = "Service";
            let serviceCategory = "General";
            let serviceDuration = "N/A";
            let serviceRating = 5.0;
            let servicePriceRange = "₱0";
            let serviceId = "";

            // Check multiple possible service data structures
            if (booking.serviceId) {
              console.log(
                "📦 serviceId object:",
                JSON.stringify(booking.serviceId, null, 2)
              );

              serviceId = booking.serviceId._id || booking.serviceId;
              serviceName = booking.serviceId.name || serviceName;
              serviceCategory = booking.serviceId.category || serviceCategory;
              serviceDuration = booking.serviceId.duration || serviceDuration;
              serviceRating = booking.serviceId.rating || serviceRating;
              servicePriceRange =
                booking.serviceId.priceRange ||
                booking.serviceId.price ||
                servicePriceRange;
            } else if (booking.service) {
              // ✅ ADDED: Fallback to booking.service
              console.log(
                "📦 service object:",
                JSON.stringify(booking.service, null, 2)
              );

              serviceId = booking.service._id || booking.service;
              serviceName = booking.service.name || serviceName;
              serviceCategory = booking.service.category || serviceCategory;
              serviceDuration = booking.service.duration || serviceDuration;
              serviceRating = booking.service.rating || serviceRating;
              servicePriceRange =
                booking.service.priceRange ||
                booking.service.price ||
                servicePriceRange;
            }

            console.log("✅ Extracted service data:", {
              serviceName,
              serviceCategory,
              serviceDuration,
              servicePriceRange,
            });

            // ✅ IMPROVED: Extract customer name with better logging (matching Appointments.tsx)
            let customerName = "Customer";

            if (booking.customerName && booking.customerName !== "Customer") {
              customerName = booking.customerName;
              console.log(
                "✅ Got customerName from booking.customerName:",
                customerName
              );
            } else if (booking.customerId?.username) {
              customerName = booking.customerId.username;
              console.log(
                "✅ Got customerName from customerId.username:",
                customerName
              );
            } else if (booking.customerId?.name) {
              customerName = booking.customerId.name;
              console.log(
                "✅ Got customerName from customerId.name:",
                customerName
              );
            } else if (booking.userId?.username) {
              customerName = booking.userId.username;
              console.log(
                "✅ Got customerName from userId.username:",
                customerName
              );
            } else if (booking.userId?.name) {
              customerName = booking.userId.name;
              console.log(
                "✅ Got customerName from userId.name:",
                customerName
              );
            } else if (booking.user?.username) {
              customerName = booking.user.username;
              console.log(
                "✅ Got customerName from user.username:",
                customerName
              );
            } else if (booking.user?.name) {
              customerName = booking.user.name;
              console.log("✅ Got customerName from user.name:", customerName);
            }

            console.log("👤 Final customer name:", customerName);

            // ✅ IMPROVED: Extract numeric price
            let numericPrice = 0;
            if (typeof servicePriceRange === "string") {
              const priceMatch = servicePriceRange.match(/\d+/);
              numericPrice = priceMatch ? parseInt(priceMatch[0]) : 0;
            } else if (typeof servicePriceRange === "number") {
              numericPrice = servicePriceRange;
            }

            const transformedBooking = {
              _id: booking._id,
              serviceId: {
                _id: serviceId,
                name: serviceName,
                category: serviceCategory,
                duration: serviceDuration,
                priceRange: servicePriceRange,
                rating: serviceRating,
              },
              customerName: customerName,
              preferredDate: booking.preferredDate,
              preferredTime: formatTimeWithAMPM(booking.preferredTime),
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
            };

            console.log(
              "✨ Final transformed booking:",
              JSON.stringify(transformedBooking, null, 2)
            );
            return transformedBooking;
          }
        );

        console.log("✅ Bookings loaded:", transformedBookings.length);
        setBookings(transformedBookings);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      console.error("❌ Error loading bookings:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load bookings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeWithAMPM = (timeString: string): string => {
    if (!timeString) return "N/A";
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    try {
      const timeParts = timeString.split(":");
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${period}`;
      }
    } catch (error) {
      console.error("Error formatting time:", error);
    }
    return timeString;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Bookings updated!",
    });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const position = tab === "recent" ? 0 : 1;
    const tabWidth = (width - 40) / 2;

    Animated.spring(tabIndicatorPosition, {
      toValue: position * tabWidth,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const getFilteredBookings = (): Booking[] => {
    let filtered: Booking[] = [];

    if (activeTab === "recent") {
      // Recent = pending + confirmed
      filtered = bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
      );
    } else {
      // Completed bookings
      filtered = bookings.filter((b) => b.status === "completed");
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.preferredDate).getTime();
        const dateB = new Date(b.preferredDate).getTime();
        return dateB - dateA;
      } catch (error) {
        return 0;
      }
    });
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
      return dateString;
    }
  };

  // ✅ IMPROVED: Better category image matching (matching Appointments.tsx)
  const getCategoryImage = (category: string) => {
    console.log("🖼️ Getting image for category:", category);

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

    // Try exact match first (case-sensitive)
    if (categoryImages[category]) {
      console.log("✅ Found exact match for category:", category);
      return categoryImages[category];
    }

    // Try case-insensitive exact match
    const categoryLower = category.toLowerCase();
    const exactMatch = Object.keys(categoryImages).find(
      (key) => key.toLowerCase() === categoryLower
    );
    if (exactMatch) {
      console.log("✅ Found case-insensitive match:", exactMatch);
      return categoryImages[exactMatch];
    }

    // Try partial matching
    console.log("🔍 Trying partial match for:", category);

    if (
      categoryLower.includes("haircut") ||
      categoryLower.includes("basic") ||
      categoryLower.includes("trim") ||
      categoryLower.includes("cut")
    ) {
      console.log("✅ Matched to Haircuts category");
      return images.category_coloring;
    }

    if (
      categoryLower.includes("color") ||
      categoryLower.includes("colour") ||
      categoryLower.includes("dye")
    ) {
      console.log("✅ Matched to Hair Coloring category");
      return images.category_hair_coloring;
    }

    if (
      categoryLower.includes("perm") ||
      categoryLower.includes("texture") ||
      categoryLower.includes("wave")
    ) {
      console.log("✅ Matched to Perming category");
      return images.category_perming;
    }

    if (
      categoryLower.includes("rebond") ||
      categoryLower.includes("straight") ||
      categoryLower.includes("smooth")
    ) {
      console.log("✅ Matched to Rebonding category");
      return images.category_rebonding;
    }

    if (
      categoryLower.includes("treatment") ||
      categoryLower.includes("shampoo") ||
      categoryLower.includes("conditioner") ||
      categoryLower.includes("mask")
    ) {
      console.log("✅ Matched to Treatments category");
      return images.category_treatments;
    }

    if (categoryLower.includes("extension")) {
      console.log("✅ Matched to Extensions category");
      return images.category_extensions;
    }

    if (
      categoryLower.includes("styling") ||
      categoryLower.includes("special") ||
      categoryLower.includes("updo") ||
      categoryLower.includes("blowdry")
    ) {
      console.log("✅ Matched to Styling category");
      return images.category_styling;
    }

    if (
      categoryLower.includes("package") ||
      categoryLower.includes("set") ||
      categoryLower.includes("bundle")
    ) {
      console.log("✅ Matched to Packages category");
      return images.category_packages;
    }

    if (
      categoryLower.includes("combination") ||
      categoryLower.includes("combo")
    ) {
      console.log("✅ Matched to Combination category");
      return images.category_combination;
    }

    // Default fallback
    console.log(
      "⚠️ No match found, using default image for category:",
      category
    );
    return images.category_coloring;
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

  // ✅ CLICKABLE BOOKING CARD - Opens receipt modal
  const handleViewReceipt = (booking: Booking) => {
    setSelectedBooking(booking);
    setReceiptModalVisible(true);
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    console.log("🎴 Rendering card for booking:", {
      serviceName: booking.serviceId.name,
      category: booking.serviceId.category,
      customerName: booking.customerName,
    });

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleViewReceipt(booking)}
        activeOpacity={0.7}>
        <View style={styles.cardContent}>
          {/* Left: Circular Image with Rating Badge */}
          <View style={styles.imageContainer}>
            <Image
              source={getCategoryImage(booking.serviceId.category)}
              style={styles.serviceImage}
            />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>
                {booking.serviceId.rating?.toFixed(1) || "5.0"}
              </Text>
            </View>
          </View>

          {/* Right: Booking Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.dateStatusRow}>
              <Text style={styles.dateTime}>
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
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.addressText}>
                SandreaLee Salon, 2184 Loyola St.{"\n"}Sampaloc, Manila, 1008
                Metro Manila
              </Text>
            </View>
            {/* ✅ FIXED: Service name now clearly visible */}
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Service: </Text>
              <Text style={styles.serviceName}>{booking.serviceId.name}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ RECEIPT MODAL - Shows full booking details
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
                          selectedBooking.status
                        )}20`,
                      },
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            selectedBooking.status
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

              <View style={styles.receiptServiceSection}>
                <Text style={styles.receiptSectionTitle}>Service Details</Text>
                <View style={styles.serviceDetailRow}>
                  <Image
                    source={getCategoryImage(
                      selectedBooking.serviceId.category
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
                <Text style={styles.receiptSectionTitle}>Payment Details</Text>
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
                    ₱{selectedBooking.totalAmount || 0}
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

  if (!fontsLoaded) return null;

  if (!isLoggedIn && !loading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyStateText}>Please Log In</Text>
          <Text style={styles.emptyStateSubtext}>
            Log in to view your bookings
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)")}
            style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Tabs */}
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
            onPress={() => handleTabChange("recent")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "recent" && styles.tabTextActive,
              ]}>
              Recent Bookings
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
              Completed Bookings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
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
            <Text style={styles.emptyStateText}>No {activeTab} bookings</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "recent"
                ? "Book a service to see your upcoming bookings"
                : "You don't have any completed bookings yet"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ✅ Receipt Modal */}
      <ReceiptModal />

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginLeft: 8,
  },
  tabsWrapper: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 100,
    position: "relative",
    overflow: "hidden",
    padding: 4,
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    width: (width - 40) / 2 - 4,
    backgroundColor: "#619AE4",
    borderRadius: 100,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 100,
    zIndex: 1,
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "white",
    fontWeight: "700",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
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
  cardContent: {
    flexDirection: "row",
    gap: 16,
  },
  imageContainer: {
    position: "relative",
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#374151",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 2,
    borderColor: "#1F2937",
  },
  ratingText: {
    color: "#1F2937",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailsContainer: {
    flex: 1,
  },
  dateStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  dateTime: {
    color: "white",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flex: 1,
    flexWrap: "wrap",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  salonName: {
    color: "#E5E7EB",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 8,
  },
  addressText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: "Urbanist",
    lineHeight: 16,
    flex: 1,
  },
  // ✅ FIXED: Better service name visibility
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  serviceLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  serviceName: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flexShrink: 1,
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
  },
  loginButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginTop: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  loader: {
    marginTop: 100,
  },
  // ✅ RECEIPT MODAL STYLES
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
  receiptCloseText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
});
