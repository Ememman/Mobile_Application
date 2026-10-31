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
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useAuth } from "@/app/lib/authContext";
import {
  staffApiClient,
  type Appointment,
  type StaffDashboard,
  type LeaderboardEntry,
} from "@/app/lib/staffApiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Add types for client bookings
interface ClientBooking {
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

// Fallback dashboard data structure
const getFallbackDashboardData = (user: any): StaffDashboard => ({
  staffInfo: {
    id: user?.id || "unknown",
    name: user?.username || "Staff",
    firstName: user?.firstName || "Staff",
    email: user?.email || "",
    profileImage: user?.profileImage || "",
    position: user?.position || "Staff",
    staffId: user?.staffId || "unknown",
  },
  todayAppointments: [],
  attendance: {
    todayStatus: "not-started",
    monthlyStats: {
      totalDays: 0,
      workingDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalWorkingHours: 0,
      totalBreakTime: 0,
      averageBreakTime: 0,
      attendancePercentage: 0,
      averageWorkingHours: 0,
    },
  },
  trainingModules: [],
  leaderboard: {
    rank: 0,
    monthlyRank: 0,
    weeklyRank: 0,
    points: 0,
    monthlyPoints: 0,
    weeklyPoints: 0,
  },
  favorites: {
    learningModules: [],
  },
  quickStats: {
    appointmentsToday: 0,
    modulesInProgress: 0,
    currentStreak: 0,
    favoriteModulesCount: 0,
    attendanceRate: 0,
  },
});

export default function StaffHome() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();

  // Menu states
  const [menuVisible, setMenuVisible] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [clientBookings, setClientBookings] = useState<ClientBooking[]>([]);
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatusData>(
    getStatusConfig("absent"),
  );
  const [learningModules, setLearningModules] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [monthlyAttendance, setMonthlyAttendance] = useState<any>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string[]>(
    [],
  );
  const [selectedBookingStatusFilter, setSelectedBookingStatusFilter] =
    useState<string[]>([]);

  // Animation refs for hamburger menu
  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  // Check employee status
  const checkEmployeeStatusData = async () => {
    const status = await checkEmployeeStatus();
    setEmployeeStatus(status);
  };

  // Fix the type issues in the mapping functions
  const transformBookingData = (apt: any): ClientBooking | null => {
    if (!apt) return null;

    const customer = apt.customer || {};
    const service = apt.service || {};
    const selectedStylist = apt.selectedStylist || {};

    return {
      id: apt._id || apt.id || `temp-${Date.now()}-${Math.random()}`,
      customer: {
        id: customer._id || customer.id || "unknown-customer",
        username: customer.username || "Unknown",
        firstName: customer.firstName || customer.username || "Customer",
        email: customer.email || "",
        phoneNumber: customer.phoneNumber || "",
        profileImage: customer.profileImage || "",
      },
      service: {
        id: service._id || service.id || "unknown-service",
        name: service.name || "Unknown Service",
        category: service.category || "",
        duration: service.duration || 0,
        priceRange: service.priceRange || "₱0",
      },
      selectedStylist: selectedStylist._id
        ? {
            id: selectedStylist._id || selectedStylist.id,
            username: selectedStylist.username || "Unknown Stylist",
            profileImage: selectedStylist.profileImage || "",
            position: selectedStylist.position || "Stylist",
          }
        : undefined,
      appointmentDate:
        apt.appointmentDate || apt.preferredDate || new Date().toISOString(),
      appointmentTime: apt.appointmentTime || apt.preferredTime || "00:00",
      status: apt.status || "upcoming",
      notes: apt.notes || apt.customerNotes || "",
      salonLocation: apt.salonLocation || {
        name: "SandreaLee Salon",
        address: "2184 Loyola St, Sampaloc, Manila, 1008 Metro Manila",
      },
      totalAmount: apt.totalAmount || apt.servicePrice || 0,
      paymentStatus: apt.paymentStatus || "pending",
      createdAt: apt.createdAt || new Date().toISOString(),
    };
  };

  const isValidClientBooking = (
    booking: ClientBooking | null,
  ): booking is ClientBooking => {
    return booking !== null && booking.selectedStylist?.id === user?.id;
  };

  // Wrap functions in useCallback to prevent infinite re-renders
  const checkForNewBookings = useCallback(async () => {
    try {
      const response = await staffApiClient.getAllBookingsForStaff({
        status: "all",
        page: 1,
        limit: 50,
      });

      if (response.success && response.data) {
        const transformedBookings = response.data
          .map(transformBookingData)
          .filter(isValidClientBooking);

        setClientBookings(transformedBookings);

        // Safely filter today's bookings
        const today = new Date();
        const todayBookings = transformedBookings.filter((booking) => {
          if (!booking.appointmentDate) return false;

          try {
            const bookingDate = new Date(booking.appointmentDate);
            return bookingDate.toDateString() === today.toDateString();
          } catch (error) {
            console.error("❌ Error parsing booking date:", error);
            return false;
          }
        });

        setTodayAppointments(todayBookings as any);
      }
    } catch (error: any) {
      console.error("❌ Error in auto-check:", error.message);
    }
  }, [user?.id]);

  const fetchClientBookings = useCallback(async () => {
    try {
      const response = await staffApiClient.getAllBookingsForStaff({
        status: "all",
        page: 1,
        limit: 50,
      });

      if (response.success && response.data) {
        const transformedBookings = response.data
          .map(transformBookingData)
          .filter(isValidClientBooking);

        setClientBookings(transformedBookings);
      } else {
        setClientBookings([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching staff bookings:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load client bookings",
      });
      setClientBookings([]);
    }
  }, [user?.id]);

  const fetchLearningModules = useCallback(async () => {
    try {
      const response = await staffApiClient.getLearningModules({
        status: "all",
        page: 1,
        limit: 10,
      });

      if (response.success && response.data) {
        const transformedModules = response.data.map((module: any) => ({
          id: module._id || module.id || `module-${Date.now()}`,
          title: module.title || "Untitled Module",
          description: module.description || "",
          category: module.category || "General",
          instructor: module.instructor || {
            name: "SandreaLee Education",
            bio: "Professional beauty education",
            profileImage: "",
            credentials: ["Certified Beauty Expert"],
          },
          progress: module.userProgress?.progress || module.progress || 0,
          coverImage: module.coverImage,
          estimatedDuration: module.estimatedDuration || 60,
          difficulty: module.difficulty || "beginner",
          status: module.userProgress?.status || "not-started",
          timeSpent: module.userProgress?.timeSpent || 0,
        }));

        setLearningModules(transformedModules);
      } else {
        setLearningModules([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching learning modules:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load learning modules",
      });
      setLearningModules([]);
    }
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
    try {
      const response = await staffApiClient.getLeaderboard("overall", 10);
      if (response.success && response.data) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffApiClient.getDashboard();

      console.log("📊 Dashboard API Response:", {
        success: response.success,
        hasData: !!response.data,
        message: response.message,
      });

      if (response.success && response.data) {
        // Safely handle today's appointments
        const staffAppointments =
          response.data.todayAppointments?.filter((apt: Appointment) => {
            // Add null checks for apt and its properties
            if (!apt || !apt.selectedStylist || !user) return false;
            return apt.selectedStylist.id === user.id;
          }) || [];

        setTodayAppointments(staffAppointments);

        // Safely handle training modules
        if (
          response.data.trainingModules &&
          response.data.trainingModules.length > 0
        ) {
          setLearningModules(response.data.trainingModules);
        } else {
          await fetchLearningModules();
        }

        // Safely handle attendance data
        setMonthlyAttendance(response.data.attendance?.monthlyStats || {});

        // Fetch additional data in parallel
        await Promise.all([
          fetchClientBookings(),
          fetchLearningModules(),
          fetchLeaderboardData(),
        ]);
      } else {
        console.warn(
          "⚠️ Dashboard response not successful, fetching individual data",
        );
        await Promise.all([
          fetchClientBookings(),
          fetchLearningModules(),
          fetchLeaderboardData(),
        ]);
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load dashboard data",
      });

      // Even if dashboard fails, try to load individual components
      try {
        await Promise.all([
          fetchClientBookings(),
          fetchLearningModules(),
          fetchLeaderboardData(),
        ]);
      } catch (secondaryError) {
        console.error(
          "❌ Error loading individual components:",
          secondaryError,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    fetchClientBookings,
    fetchLearningModules,
    fetchLeaderboardData,
  ]);

  // Auto-refresh interval for real-time updates
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
      checkEmployeeStatusData();

      const interval = setInterval(() => {
        checkForNewBookings();
        checkEmployeeStatusData(); // Check status periodically
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token, checkForNewBookings, fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await checkEmployeeStatusData();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Dashboard updated successfully!",
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

  const formatTime = (time: string) => {
    if (!time) return "Unknown Time";
    return time;
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
        {user?.profileImage && !imageError ? (
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
              source={{
                uri: user.profileImage.startsWith("/uploads/")
                  ? `https://sandrealeesalon.onrender.com${user.profileImage}`
                  : user.profileImage,
              }}
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

  // Enhanced Client Avatar Component
  const ClientAvatar = ({
    client,
    size = 80,
  }: {
    client: any;
    size?: number;
  }) => {
    const [imageError, setImageError] = useState(false);

    if (client?.profileImage && !imageError) {
      return (
        <Image
          source={{
            uri: client.profileImage.startsWith("/uploads/")
              ? `https://sandrealeesalon.onrender.com${client.profileImage}`
              : client.profileImage,
          }}
          style={[
            styles.clientCardAvatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      );
    }

    return (
      <View
        style={[
          styles.clientCardAvatarPlaceholder,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
        <Text style={styles.clientCardInitial}>
          {client?.username?.[0]?.toUpperCase() ||
            client?.firstName?.[0]?.toUpperCase() ||
            "C"}
        </Text>
      </View>
    );
  };

  // Filter appointments based on search and filters
  const getFilteredAppointments = () => {
    let filtered = todayAppointments;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (apt) =>
          apt.customer?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          apt.customer?.firstName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedStatusFilter.length > 0) {
      filtered = filtered.filter((apt) =>
        selectedStatusFilter.includes(apt.status),
      );
    }

    return filtered;
  };

  // Filter client bookings based on search
  const getFilteredClientBookings = () => {
    let filtered = clientBookings;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (booking) =>
          booking.customer?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.customer?.firstName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.service?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.service?.category
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedBookingStatusFilter.length > 0) {
      filtered = filtered.filter((booking) =>
        selectedBookingStatusFilter.includes(booking.status),
      );
    }

    return filtered;
  };

  const clearFilters = () => {
    setSelectedStatusFilter([]);
    setSelectedBookingStatusFilter([]);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    const filteredAppointments = getFilteredAppointments();
    const filteredBookings = getFilteredClientBookings();
    Toast.show({
      type: "success",
      text1: "Filters Applied",
      text2: `Showing ${filteredAppointments.length} appointments and ${filteredBookings.length} bookings`,
    });
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getAllUpcomingAppointments = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return clientBookings
      .filter((booking) => {
        if (!booking.customer) return false;

        const bookingDate = new Date(booking.appointmentDate);
        bookingDate.setHours(0, 0, 0, 0);

        const isUpcoming =
          booking.status === "upcoming" ||
          booking.status === "confirmed" ||
          booking.status === "pending";

        const isFutureOrToday = bookingDate >= now;

        return isUpcoming && isFutureOrToday;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
        const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
        return dateA.getTime() - dateB.getTime();
      });
  };

  // Get current month and year for attendance report
  const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const renderContent = () => {
    try {
      if (!fontsLoaded || loading) {
        return (
          <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
              <ActivityIndicator
                size="large"
                color="#619AE4"
                style={styles.loader}
              />
            </SafeAreaView>
          </View>
        );
      }

      const filteredAppointments = getFilteredAppointments();
      const upcomingAppointments = getAllUpcomingAppointments();

      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={toggleMenu}
                style={styles.hamburgerButton}>
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
                      text2: `${
                        filteredAppointments.length || 0
                      } appointments today`,
                    });
                  }}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="white"
                  />
                  {filteredAppointments.length > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {filteredAppointments.length > 9
                          ? "9+"
                          : filteredAppointments.length}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

                <ProfileImage size={42} />
              </View>
            </View>

            {/* Menu */}
            {menuVisible && (
              <View style={styles.menu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/(staff)/(staff-tabs)/profile");
                  }}>
                  <Text style={styles.menuText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/(staff)/(menu)/leaderboards");
                  }}>
                  <Text style={styles.menuText}>Leaderboards</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/(staff)/(menu)/favorites");
                  }}>
                  <Text style={styles.menuText}>Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/(staff)/(menu)/bookings");
                  }}>
                  <Text style={styles.menuText}>Client Bookings</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main Content */}
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
              {/* Greeting Section - ENHANCED WITH EMPLOYEE STATUS */}
              <View style={styles.greetingContainer}>
                <View style={styles.greetingTextContainer}>
                  <Text style={styles.greetingText}>
                    Welcome Back!{" "}
                    <Text style={styles.usernameText}>
                      {user?.firstName || user?.username || "Staff"}
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
                      <Text style={styles.statusTime}>
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Search Bar - ENHANCED */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Feather name="search" size={18} color="#999" />
                  <TextInput
                    placeholder="Search for clients, learning modules and leaderboards..."
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
                  {(selectedStatusFilter.length > 0 ||
                    selectedBookingStatusFilter.length > 0) && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>
                        {selectedStatusFilter.length +
                          selectedBookingStatusFilter.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Appointment Card - ENHANCED */}
              {filteredAppointments.length > 0 && (
                <View style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIcon}>
                      <MaterialIcons name="event" size={20} color="#619AE4" />
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentTitle}>Appointment</Text>
                      <Text style={styles.appointmentTime}>
                        Today,{" "}
                        {formatTime(filteredAppointments[0].appointmentTime)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.appointmentAction}>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#619AE4"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.appointmentLocation}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#9CA3AF"
                    />
                    <Text style={styles.locationText}>
                      SandreaLee Salon, 2184 Loyola St
                    </Text>
                  </View>
                </View>
              )}

              {/* Upcoming Clients - ENHANCED */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Clients</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() =>
                      router.push("/(staff)/(staff-tabs)/appointments")
                    }>
                    <Text style={styles.seeAll}>See All</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#619AE4"
                    />
                  </TouchableOpacity>
                </View>

                {upcomingAppointments.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.clientsScrollContainer}>
                    {upcomingAppointments.map((appointment, index) => (
                      <View
                        key={`${appointment.id}-${index}`}
                        style={styles.clientCard}>
                        <ClientAvatar client={appointment.customer} size={80} />
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName} numberOfLines={1}>
                            {appointment.customer?.firstName ||
                              appointment.customer?.username}
                          </Text>
                          <Text style={styles.clientService} numberOfLines={1}>
                            {appointment.service?.name || "Service"}
                          </Text>
                          <View style={styles.clientTime}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color="#619AE4"
                            />
                            <Text style={styles.clientTimeText}>
                              {formatTime(appointment.appointmentTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color="#6B7280"
                      style={{ marginBottom: 12 }}
                    />
                    <Text style={styles.emptyStateText}>
                      No upcoming clients
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Check back later for scheduled appointments
                    </Text>
                  </View>
                )}
              </View>

              {/* Learning Modules - ENHANCED */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Learning Modules</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() =>
                      router.push("/(staff)/(staff-tabs)/training")
                    }>
                    <Text style={styles.seeAll}>See All</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#619AE4"
                    />
                  </TouchableOpacity>
                </View>

                {learningModules.length > 0 ? (
                  <View style={styles.learningModulesContainer}>
                    {learningModules.slice(0, 2).map((module) => (
                      <TouchableOpacity
                        key={module.id}
                        style={styles.learningModuleCard}
                        onPress={() => {
                          Toast.show({
                            type: "info",
                            text1: "Learning Module",
                            text2: module.title,
                          });
                        }}>
                        <View style={styles.moduleHeader}>
                          <View style={styles.moduleTextContent}>
                            <Text style={styles.moduleTitle} numberOfLines={2}>
                              {module.title}
                            </Text>
                            <Text style={styles.moduleInstructor}>
                              By{" "}
                              {module.instructor?.name ||
                                "SandreaLee Education"}
                            </Text>
                          </View>
                          <View style={styles.moduleProgress}>
                            <Text style={styles.progressPercentage}>
                              {Math.round(module.progress || 0)}%
                            </Text>
                            <Text style={styles.progressLabel}>Done</Text>
                          </View>
                        </View>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${module.progress || 0}%` },
                              ]}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="book-outline"
                      size={48}
                      color="#6B7280"
                      style={{ marginBottom: 12 }}
                    />
                    <Text style={styles.emptyStateText}>
                      No learning modules
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Start your training journey today
                    </Text>
                  </View>
                )}
              </View>

              {/* Leaderboards - ENHANCED */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Leaderboards</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => router.push("/(staff)/(menu)/leaderboards")}>
                    <Text style={styles.seeAll}>See All</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#619AE4"
                    />
                  </TouchableOpacity>
                </View>

                {leaderboardData.length > 0 ? (
                  <View style={styles.leaderboardContainer}>
                    {leaderboardData.slice(0, 3).map((entry, index) => (
                      <View
                        key={entry.userId._id}
                        style={styles.leaderboardItem}>
                        <View style={styles.leaderboardLeft}>
                          <View style={styles.leaderboardRankContainer}>
                            <Text style={styles.leaderboardRank}>
                              {index + 1}
                            </Text>
                          </View>
                          {entry.userId.profileImage ? (
                            <Image
                              source={{
                                uri: entry.userId.profileImage.startsWith(
                                  "/uploads/",
                                )
                                  ? `https://sandrealeesalon.onrender.com${entry.userId.profileImage}`
                                  : entry.userId.profileImage,
                              }}
                              style={styles.leaderboardAvatar}
                            />
                          ) : (
                            <View style={styles.leaderboardAvatarPlaceholder}>
                              <Text style={styles.leaderboardInitial}>
                                {entry.userId.username?.[0]?.toUpperCase() ||
                                  "U"}
                              </Text>
                            </View>
                          )}
                          <View style={styles.leaderboardInfo}>
                            <Text style={styles.leaderboardName}>
                              {entry.userId._id === user?.id
                                ? "You"
                                : entry.userId.username}
                            </Text>
                            <Text style={styles.leaderboardPosition}>
                              {entry.userId.position}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.leaderboardPoints}>
                          <Text style={styles.leaderboardPointsText}>
                            {entry.totalPoints || 0} pts
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="trophy-outline"
                      size={48}
                      color="#6B7280"
                      style={{ marginBottom: 12 }}
                    />
                    <Text style={styles.emptyStateText}>
                      No leaderboard data
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Complete tasks to earn points
                    </Text>
                  </View>
                )}
              </View>

              {/* Attendance Reports - ENHANCED */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Attendance Reports</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => {
                      Toast.show({
                        type: "info",
                        text1: "Attendance",
                        text2: "View detailed attendance reports",
                      });
                    }}>
                    <Text style={styles.seeAll}>View All</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#619AE4"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <Text style={styles.attendanceMonth}>
                      {getCurrentMonthYear()}
                    </Text>
                    <Text style={styles.attendancePercentage}>
                      {monthlyAttendance?.attendancePercentage || 0}%
                    </Text>
                  </View>
                  <View style={styles.attendanceStats}>
                    <View style={styles.attendanceStat}>
                      <Text style={styles.attendanceStatValue}>
                        {monthlyAttendance?.workingDays || 0}
                      </Text>
                      <Text style={styles.attendanceStatLabel}>
                        Working Days
                      </Text>
                    </View>
                    <View style={styles.attendanceStat}>
                      <Text style={styles.attendanceStatValue}>
                        {monthlyAttendance?.present || 0}
                      </Text>
                      <Text style={styles.attendanceStatLabel}>Present</Text>
                    </View>
                    <View style={styles.attendanceStat}>
                      <Text style={styles.attendanceStatValue}>
                        {monthlyAttendance?.absent || 0}
                      </Text>
                      <Text style={styles.attendanceStatLabel}>Absent</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Filter Modal */}
            <Modal
              visible={filterModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setFilterModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter</Text>
                    <TouchableOpacity
                      onPress={() => setFilterModalVisible(false)}>
                      <Feather name="x" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalScroll}>
                    <View style={styles.filterSection}>
                      <Text style={styles.filterSectionTitle}>
                        Appointment Status
                      </Text>
                      {[
                        "upcoming",
                        "confirmed",
                        "completed",
                        "cancelled",
                        "pending",
                      ].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={styles.filterOption}
                          onPress={() => toggleStatusFilter(status)}>
                          <View
                            style={[
                              styles.checkbox,
                              selectedStatusFilter.includes(status) &&
                                styles.checkboxActive,
                            ]}>
                            {selectedStatusFilter.includes(status) && (
                              <Feather name="check" size={16} color="white" />
                            )}
                          </View>
                          <Text style={styles.filterOptionText}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
    } catch (error) {
      console.error("❌ Error rendering StaffHome:", error);
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Something went wrong</Text>
              <Text style={styles.errorSubtext}>Please pull to refresh</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      );
    }
  };

  return renderContent();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  safeArea: { flex: 1 },
  loader: { marginTop: 50 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
  rightIcons: { flexDirection: "row", alignItems: "center", gap: 16 },
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
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  profileImageContainer: {
    borderRadius: 50,
    overflow: "hidden",
  },
  imageLoadingPlaceholder: {
    position: "absolute",
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  // Menu Styles
  menu: {
    position: "absolute",
    top: 80,
    left: 20,
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

  // Content Styles
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20 },

  // Greeting Section - ENHANCED
  greetingContainer: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  greetingTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "400",
    flex: 1,
  },
  usernameText: {
    color: "white",
    fontWeight: "700",
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  statusTime: {
    color: "white",
    fontSize: 10,
    fontFamily: "Urbanist",
    marginLeft: 4,
    opacity: 0.9,
  },

  // Search and Filter - ENHANCED
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Urbanist",
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

  // Appointment Card - ENHANCED
  appointmentCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#619AE4",
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  appointmentTime: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  appointmentAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAll: {
    color: "#619AE4",
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginRight: 4,
    fontSize: 14,
  },

  // Upcoming Clients - ENHANCED
  clientsScrollContainer: {
    gap: 16,
  },
  clientCard: {
    width: 140,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  clientInfo: {
    marginTop: 12,
    alignItems: "center",
    width: "100%",
  },
  clientName: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  clientService: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 8,
  },
  clientTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clientTimeText: {
    color: "#619AE4",
    fontSize: 11,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },

  // Client Avatar Styles
  clientCardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  clientCardAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#619AE4",
    justifyContent: "center",
    alignItems: "center",
  },
  clientCardInitial: {
    color: "white",
    fontSize: 28,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },

  // Learning Modules - ENHANCED
  learningModulesContainer: {
    gap: 12,
  },
  learningModuleCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  moduleTextContent: {
    flex: 1,
    marginRight: 12,
  },
  moduleTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  moduleInstructor: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  moduleProgress: {
    alignItems: "center",
  },
  progressPercentage: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  progressLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: "Urbanist",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#619AE4",
    borderRadius: 3,
  },

  // Leaderboards - ENHANCED
  leaderboardContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  leaderboardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  leaderboardRankContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#619AE4",
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardRank: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  leaderboardAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#619AE4",
    justifyContent: "center",
    alignItems: "center",
  },
  leaderboardInitial: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  leaderboardPosition: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  leaderboardPoints: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaderboardPointsText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },

  // Attendance Reports - ENHANCED
  attendanceCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  attendanceMonth: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  attendancePercentage: {
    color: "#619AE4",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  attendanceStat: {
    alignItems: "center",
    flex: 1,
  },
  attendanceStatValue: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  attendanceStatLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },

  // Empty States
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  emptyStateText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Urbanist",
    textAlign: "center",
  },

  // Modal Styles
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
});
