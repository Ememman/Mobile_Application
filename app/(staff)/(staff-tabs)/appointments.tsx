// appointments.tsx - COMPLETE UPDATED WITH AUTOMATIC COMPLETION
"use client";

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { staffApiClient } from "@/app/lib/staffApiClient";
import { useFonts } from "expo-font";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/app/lib/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface ClientAppointment {
  _id: string;
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

type TabType = "upcoming" | "completed" | "cancelled";

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
      "http://10.74.230.139:3000/api/attendance/status",
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

// Helper function for status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case "upcoming":
      return "#3B82F6";
    case "confirmed":
      return "#10B981";
    case "completed":
      return "#6B7280";
    case "cancelled":
      return "#EF4444";
    case "pending":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

// Helper function to check if appointment time is near (within 30 minutes)
const isAppointmentNear = (
  appointmentDate: string,
  appointmentTime: string,
): boolean => {
  try {
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`,
    );
    const now = new Date();
    const timeDifference = appointmentDateTime.getTime() - now.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    // Return true if appointment is within 30 minutes from now
    return minutesDifference <= 30 && minutesDifference > 0;
  } catch (error) {
    console.error("Error checking appointment time:", error);
    return false;
  }
};

// Helper function to check if appointment is ongoing (current time is within appointment time)
const isAppointmentOngoing = (
  appointmentDate: string,
  appointmentTime: string,
  duration: number,
): boolean => {
  try {
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`,
    );
    const now = new Date();
    const appointmentEndTime = new Date(
      appointmentDateTime.getTime() + duration * 60000,
    );

    return now >= appointmentDateTime && now <= appointmentEndTime;
  } catch (error) {
    console.error("Error checking ongoing appointment:", error);
    return false;
  }
};

// Helper function to check if appointment is past due
const isAppointmentPastDue = (
  appointmentDate: string,
  appointmentTime: string,
  duration: number,
): boolean => {
  try {
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`,
    );
    const appointmentEndTime = new Date(
      appointmentDateTime.getTime() + duration * 60000,
    );
    const now = new Date();

    return now > appointmentEndTime;
  } catch (error) {
    console.error("Error checking if appointment is past due:", error);
    return false;
  }
};

// IMPROVED: Check if appointment is today with better date handling
const isAppointmentToday = (appointmentDate: string): boolean => {
  try {
    const today = new Date();
    const appointmentDateObj = new Date(appointmentDate);

    // Reset both dates to midnight for accurate comparison
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const appointmentMidnight = new Date(
      appointmentDateObj.getFullYear(),
      appointmentDateObj.getMonth(),
      appointmentDateObj.getDate(),
    );

    return todayMidnight.getTime() === appointmentMidnight.getTime();
  } catch (error) {
    console.error("Error checking if appointment is today:", error);
    return false;
  }
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointment | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [appointmentForInfo, setAppointmentForInfo] =
    useState<ClientAppointment | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatusData>(
    getStatusConfig("absent"),
  );

  // Hamburger menu animation
  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;

  // ANIMATED TABS
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const tabContentOpacity = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  // Check employee status
  const checkEmployeeStatusData = async () => {
    const status = await checkEmployeeStatus();
    setEmployeeStatus(status);
  };

  // Auto-complete past due appointments
  const autoCompletePastDueAppointment = async (appointmentId: string) => {
    try {
      console.log("🔄 Auto-completing past due appointment:", appointmentId);

      const response = await staffApiClient.completeAppointment(appointmentId);

      if (response.success) {
        console.log("✅ Auto-completed appointment:", appointmentId);
      } else {
        console.error("❌ Failed to auto-complete appointment:", appointmentId);
      }
    } catch (error) {
      console.error("❌ Error auto-completing appointment:", error);
      // Don't show toast for auto-completion errors to avoid annoying the user
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
      checkEmployeeStatusData();
    }, [user?.id]),
  );

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const response = await staffApiClient.getAllBookingsForStaff({
        status: "all",
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const transformedAppointments: ClientAppointment[] = response.data
          .map((apt: any) => {
            // Use _id as the primary ID since that's what MongoDB uses
            const appointmentId = apt._id || apt.id;

            // Check if appointment is past due and should be auto-completed
            const isPastDue = isAppointmentPastDue(
              apt.appointmentDate || apt.preferredDate,
              apt.appointmentTime || apt.preferredTime,
              apt.service?.duration || 60,
            );

            // Auto-complete past due appointments that are still in upcoming status
            let finalStatus = apt.status;
            if (
              (apt.status === "upcoming" ||
                apt.status === "confirmed" ||
                apt.status === "pending") &&
              isPastDue
            ) {
              finalStatus = "completed";
              // Auto-complete the appointment on the server
              autoCompletePastDueAppointment(appointmentId);
            }

            return {
              _id: appointmentId,
              id: appointmentId, // Ensure both id and _id are the same
              customer: {
                id: apt.customer?._id || apt.customer?.id || "",
                username: apt.customer?.username || "Unknown",
                firstName:
                  apt.customer?.firstName ||
                  apt.customer?.username ||
                  "Unknown",
                email: apt.customer?.email || "",
                phoneNumber: apt.customer?.phoneNumber || "",
                profileImage: apt.customer?.profileImage || "",
              },
              service: {
                id: apt.service?._id || apt.service?.id || "",
                name: apt.service?.name || "Unknown Service",
                category: apt.service?.category || "",
                duration: apt.service?.duration || 0,
                priceRange: apt.service?.priceRange || "₱0",
              },
              selectedStylist: apt.selectedStylist
                ? {
                    id: apt.selectedStylist._id || apt.selectedStylist.id,
                    username: apt.selectedStylist.username,
                    profileImage: apt.selectedStylist.profileImage,
                    position: apt.selectedStylist.position,
                  }
                : undefined,
              appointmentDate: apt.appointmentDate || apt.preferredDate,
              appointmentTime: apt.appointmentTime || apt.preferredTime,
              status:
                finalStatus === "confirmed" || finalStatus === "pending"
                  ? "upcoming"
                  : finalStatus,
              notes: apt.notes || apt.customerNotes,
              salonLocation: apt.salonLocation || {
                name: "SandreaLee Salon",
                address: "2184 Loyola St, Sampaloc, Manila",
              },
              totalAmount: apt.totalAmount || apt.servicePrice || 0,
              paymentStatus: apt.paymentStatus || "pending",
              createdAt: apt.createdAt,
            };
          })
          // FILTER: Only show appointments where the selected stylist matches the current staff member
          .filter((apt: ClientAppointment) => {
            if (!user?.id) return false;

            // Check if the appointment has a selected stylist and if it matches the current staff
            const isMyAppointment = apt.selectedStylist?.id === user.id;
            return isMyAppointment;
          });

        console.log(
          "✅ Transformed appointments:",
          transformedAppointments.length,
        );
        if (transformedAppointments.length > 0) {
          console.log("📋 First appointment sample:", {
            id: transformedAppointments[0].id,
            _id: transformedAppointments[0]._id,
            customer: transformedAppointments[0].customer.firstName,
          });
        }

        setAppointments(transformedAppointments);
      }
    } catch (error) {
      console.error("❌ Error loading appointments:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load appointments",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    await checkEmployeeStatusData();
    setRefreshing(false);
  };

  // SEND NOTIFICATION TO CLIENT
  const sendNotificationToClient = async (appointment: ClientAppointment) => {
    try {
      Toast.show({
        type: "success",
        text1: "Notification Sent",
        text2: `Client ${appointment.customer.firstName} has been notified`,
      });
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send notification",
      });
    }
  };

  // SHOW INFO MODAL FOR APPOINTMENT DETAILS
  const showInfoModal = (appointment: ClientAppointment) => {
    setAppointmentForInfo(appointment);
    setInfoModalVisible(true);
  };

  // SHOW DETAILS MODAL
  const handleViewDetails = (appointment: ClientAppointment) => {
    setSelectedAppointment(appointment);
    setDetailsModalVisible(true);
  };

  // TOGGLE MENU FUNCTION
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

  // ANIMATED TAB CHANGE
  const handleTabChange = (tab: TabType) => {
    Animated.timing(tabContentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);

      const tabPositions = { upcoming: 0, completed: 1, cancelled: 2 };
      const position = tabPositions[tab];
      const tabWidth = (width - 32) / 3;

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

  const getFilteredAppointments = () => {
    let filtered = appointments.filter((apt) => {
      if (apt.status !== activeTab) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCustomer = apt.customer.firstName
          .toLowerCase()
          .includes(query);
        const matchesService = apt.service.name.toLowerCase().includes(query);
        const matchesPhone = apt.customer.phoneNumber.includes(query);
        if (!matchesCustomer && !matchesService && !matchesPhone) return false;
      }

      if (selectedFilters.length > 0) {
        const matchesFilter = selectedFilters.some(
          (filter) =>
            apt.service.category.toLowerCase().includes(filter.toLowerCase()) ||
            apt.service.name.toLowerCase().includes(filter.toLowerCase()),
        );
        if (!matchesFilter) return false;
      }

      return true;
    });

    return filtered;
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour =
      hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "Unknown Date";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Invalid Date";

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (d.toDateString() === today.toDateString()) {
        return "Today";
      } else if (d.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateLong = (date: string) => {
    if (!date) return "Unknown Date";
    try {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid Date/Time";
    }
  };

  // HIGHLIGHT TEXT FUNCTION FOR SEARCH
  const HighlightedText = ({
    text,
    highlight,
  }: {
    text: string;
    highlight: string;
  }) => {
    if (!highlight.trim()) {
      return <Text style={styles.normalText}>{text}</Text>;
    }

    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return (
      <Text style={styles.normalText}>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            part
          ),
        )}
      </Text>
    );
  };

  // PROFILE IMAGE COMPONENT
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
                  ? `http://10.74.230.139:3000${user.profileImage}`
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

  // CLIENT AVATAR COMPONENT
  const ClientAvatar = ({
    client,
    size = 60,
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
              ? `http://10.74.230.139:3000${client.profileImage}`
              : client.profileImage,
          }}
          style={[
            styles.clientAvatar,
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
          styles.clientAvatarPlaceholder,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
          {client?.firstName?.[0]?.toUpperCase() ||
            client?.username?.[0]?.toUpperCase() ||
            "C"}
        </Text>
      </View>
    );
  };

  // EMPLOYEE STATUS COMPONENT
  const EmployeeStatusIndicator = () => {
    return (
      <View
        style={[styles.statusBadge, { backgroundColor: employeeStatus.color }]}>
        <Ionicons name={employeeStatus.icon as any} size={12} color="white" />
        <Text style={styles.statusText}>{employeeStatus.message}</Text>
      </View>
    );
  };

  // APPOINTMENT CARD COMPONENT - UPDATED WITHOUT MANUAL ACTIONS
  const AppointmentCard = ({
    appointment,
  }: {
    appointment: ClientAppointment;
  }) => {
    const isNear = isAppointmentNear(
      appointment.appointmentDate,
      appointment.appointmentTime,
    );
    const isOngoing = isAppointmentOngoing(
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.service.duration,
    );
    const isToday = isAppointmentToday(appointment.appointmentDate);
    const isPastDue = isAppointmentPastDue(
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.service.duration,
    );

    // Show auto-completed status for past due appointments
    const wasAutoCompleted = isPastDue && appointment.status === "completed";

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          <ClientAvatar client={appointment.customer} size={60} />
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {appointment.customer.firstName}
            </Text>
            <Text style={styles.serviceName}>{appointment.service.name}</Text>
            <View style={styles.clientContact}>
              <Ionicons name="call-outline" size={14} color="#9CA3AF" />
              <Text style={styles.clientPhoneText}>
                {appointment.customer.phoneNumber || "No phone"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadgeCard,
              {
                backgroundColor: wasAutoCompleted
                  ? "#10B981"
                  : getStatusColor(appointment.status),
              },
            ]}>
            <Text style={styles.statusTextCard}>
              {wasAutoCompleted
                ? "Auto Completed"
                : appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#619AE4" />
              <Text style={styles.detailText}>
                {formatDate(appointment.appointmentDate)}
                {isToday && <Text style={styles.todayBadge}> • Today</Text>}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#619AE4" />
              <Text style={styles.detailText}>
                {formatTime(appointment.appointmentTime)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.detailText}>
                {appointment.salonLocation.name}
              </Text>
            </View>
          </View>

          {/* Status indicators */}
          <View style={styles.statusIndicatorContainer}>
            {isToday && (
              <View style={styles.todayIndicator}>
                <Ionicons name="today" size={14} color="#3B82F6" />
                <Text style={styles.todayIndicatorText}>Today</Text>
              </View>
            )}
            {isNear && (
              <View style={styles.nearIndicator}>
                <Ionicons name="time" size={14} color="#F59E0B" />
                <Text style={styles.nearIndicatorText}>Starting Soon</Text>
              </View>
            )}
            {isOngoing && (
              <View style={styles.ongoingIndicator}>
                <Ionicons name="play-circle" size={14} color="#10B981" />
                <Text style={styles.ongoingIndicatorText}>In Progress</Text>
              </View>
            )}
            {isPastDue && appointment.status !== "completed" && (
              <View style={styles.pastDueIndicator}>
                <Ionicons name="time-outline" size={14} color="#EF4444" />
                <Text style={styles.pastDueIndicatorText}>
                  Past Due - Will Auto Complete
                </Text>
              </View>
            )}
            {wasAutoCompleted && (
              <View style={styles.autoCompletedIndicator}>
                <Ionicons name="checkmark-done" size={14} color="#10B981" />
                <Text style={styles.autoCompletedIndicatorText}>
                  Auto Completed
                </Text>
              </View>
            )}
          </View>

          {appointment.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Client Notes:</Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>₱{appointment.totalAmount}</Text>
            <Text
              style={[
                styles.paymentStatus,
                {
                  color:
                    appointment.paymentStatus === "paid"
                      ? "#10B981"
                      : "#F59E0B",
                },
              ]}>
              {appointment.paymentStatus.toUpperCase()}
            </Text>
          </View>

          {/* Only show View Details button - remove action buttons */}
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleViewDetails(appointment)}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // DETAILS MODAL COMPONENT
  const DetailsModal = () => {
    if (!selectedAppointment) return null;

    const isToday = isAppointmentToday(selectedAppointment.appointmentDate);
    const isNear = isAppointmentNear(
      selectedAppointment.appointmentDate,
      selectedAppointment.appointmentTime,
    );
    const isOngoing = isAppointmentOngoing(
      selectedAppointment.appointmentDate,
      selectedAppointment.appointmentTime,
      selectedAppointment.service.duration,
    );
    const isPastDue = isAppointmentPastDue(
      selectedAppointment.appointmentDate,
      selectedAppointment.appointmentTime,
      selectedAppointment.service.duration,
    );
    const wasAutoCompleted =
      isPastDue && selectedAppointment.status === "completed";

    return (
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.detailsModalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Appointment Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.detailsModalCloseButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsModalBody}>
              {/* Client Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>
                  Client Information
                </Text>
                <View style={styles.clientInfoDetails}>
                  <ClientAvatar
                    client={selectedAppointment.customer}
                    size={80}
                  />
                  <View style={styles.clientTextDetails}>
                    <Text style={styles.clientNameDetails}>
                      {selectedAppointment.customer.firstName}
                    </Text>
                    <Text style={styles.clientEmail}>
                      {selectedAppointment.customer.email}
                    </Text>
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={16} color="#9CA3AF" />
                      <Text style={styles.contactText}>
                        {selectedAppointment.customer.phoneNumber ||
                          "No phone number"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Appointment Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>
                  Appointment Details
                </Text>
                <View style={styles.detailItemModal}>
                  <Ionicons name="cut-outline" size={20} color="#619AE4" />
                  <View style={styles.detailTextModal}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue}>
                      {selectedAppointment.service.name}
                    </Text>
                    <Text style={styles.detailSubtext}>
                      {selectedAppointment.service.category} •{" "}
                      {selectedAppointment.service.duration} mins
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItemModal}>
                  <Ionicons name="calendar-outline" size={20} color="#619AE4" />
                  <View style={styles.detailTextModal}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(
                        selectedAppointment.appointmentDate,
                        selectedAppointment.appointmentTime,
                      )}
                    </Text>
                    {isToday && (
                      <Text style={styles.todayBadgeModal}>
                        Todays Appointment
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.detailItemModal}>
                  <Ionicons name="location-outline" size={20} color="#619AE4" />
                  <View style={styles.detailTextModal}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {selectedAppointment.salonLocation.name}
                    </Text>
                    <Text style={styles.detailSubtext}>
                      {selectedAppointment.salonLocation.address}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status & Payment */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Status & Payment</Text>
                <View style={styles.statusPaymentRow}>
                  <View style={styles.statusContainer}>
                    <Text style={styles.detailLabel}>Appointment Status</Text>
                    <View
                      style={[
                        styles.statusBadgeModal,
                        {
                          backgroundColor: wasAutoCompleted
                            ? "#10B981"
                            : getStatusColor(selectedAppointment.status),
                        },
                      ]}>
                      <Text style={styles.statusTextModal}>
                        {wasAutoCompleted
                          ? "Auto Completed"
                          : selectedAppointment.status.charAt(0).toUpperCase() +
                            selectedAppointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentContainer}>
                    <Text style={styles.detailLabel}>Payment Status</Text>
                    <Text
                      style={[
                        styles.paymentStatusModal,
                        {
                          color:
                            selectedAppointment.paymentStatus === "paid"
                              ? "#10B981"
                              : "#F59E0B",
                        },
                      ]}>
                      {selectedAppointment.paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountContainer}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={styles.amountValue}>
                    ₱{selectedAppointment.totalAmount}
                  </Text>
                </View>
              </View>

              {/* Automatic Completion Info */}
              {(isPastDue || wasAutoCompleted) && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>
                    Automatic Completion
                  </Text>
                  <View style={styles.autoCompletionInfo}>
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color="#3B82F6"
                    />
                    <View style={styles.autoCompletionText}>
                      <Text style={styles.autoCompletionTitle}>
                        {wasAutoCompleted
                          ? "Appointment Auto Completed"
                          : "Pending Auto Completion"}
                      </Text>
                      <Text style={styles.autoCompletionDescription}>
                        {wasAutoCompleted
                          ? "This appointment was automatically marked as completed because it was past its scheduled time."
                          : "This appointment will be automatically marked as completed once it passes its scheduled time."}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Additional Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>
                  Additional Information
                </Text>
                {selectedAppointment.notes ? (
                  <View style={styles.notesContainerModal}>
                    <Text style={styles.notesLabelModal}>Client Notes:</Text>
                    <Text style={styles.notesTextModal}>
                      {selectedAppointment.notes}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noNotesText}>
                    No additional notes provided
                  </Text>
                )}

                <View style={styles.createdInfo}>
                  <Text style={styles.createdLabel}>Appointment Created</Text>
                  <Text style={styles.createdDate}>
                    {new Date(selectedAppointment.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </Text>
                </View>
              </View>

              {/* Status Indicators */}
              {(isToday || isNear || isOngoing || isPastDue) && (
                <View style={styles.statusIndicatorsModal}>
                  <Text style={styles.detailsSectionTitle}>Current Status</Text>
                  <View style={styles.statusIndicatorsRow}>
                    {isToday && (
                      <View style={styles.statusIndicatorModal}>
                        <Ionicons name="today" size={16} color="#3B82F6" />
                        <Text style={styles.statusIndicatorText}>Today</Text>
                      </View>
                    )}
                    {isNear && (
                      <View style={styles.statusIndicatorModal}>
                        <Ionicons name="time" size={16} color="#F59E0B" />
                        <Text style={styles.statusIndicatorText}>
                          Starting Soon
                        </Text>
                      </View>
                    )}
                    {isOngoing && (
                      <View style={styles.statusIndicatorModal}>
                        <Ionicons
                          name="play-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.statusIndicatorText}>
                          In Progress
                        </Text>
                      </View>
                    )}
                    {isPastDue && !wasAutoCompleted && (
                      <View style={styles.statusIndicatorModal}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#EF4444"
                        />
                        <Text style={styles.statusIndicatorText}>Past Due</Text>
                      </View>
                    )}
                    {wasAutoCompleted && (
                      <View style={styles.statusIndicatorModal}>
                        <Ionicons
                          name="checkmark-done"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.statusIndicatorText}>
                          Auto Completed
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.detailsModalFooter}>
              <TouchableOpacity
                style={styles.closeDetailsButton}
                onPress={() => setDetailsModalVisible(false)}>
                <Text style={styles.closeDetailsButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // INFO MODAL COMPONENT - UPDATED WITHOUT MANUAL ACTIONS
  const InfoModal = () => {
    if (!appointmentForInfo) return null;

    const isOngoing = isAppointmentOngoing(
      appointmentForInfo.appointmentDate,
      appointmentForInfo.appointmentTime,
      appointmentForInfo.service.duration,
    );
    const isToday = isAppointmentToday(appointmentForInfo.appointmentDate);
    const isPastDue = isAppointmentPastDue(
      appointmentForInfo.appointmentDate,
      appointmentForInfo.appointmentTime,
      appointmentForInfo.service.duration,
    );

    return (
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Appointment Information</Text>
              <TouchableOpacity
                onPress={() => setInfoModalVisible(false)}
                style={styles.infoModalCloseButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoModalBody}>
              <View style={styles.clientInfoModal}>
                <ClientAvatar client={appointmentForInfo.customer} size={50} />
                <View style={styles.clientDetailsModal}>
                  <Text style={styles.infoModalClientName}>
                    {appointmentForInfo.customer.firstName}
                  </Text>
                  <Text style={styles.infoModalService}>
                    {appointmentForInfo.service.name}
                  </Text>
                  <Text style={styles.infoModalTime}>
                    {formatDate(appointmentForInfo.appointmentDate)} at{" "}
                    {formatTime(appointmentForInfo.appointmentTime)}
                  </Text>
                </View>
              </View>

              {/* Status indicators in modal */}
              <View style={styles.modalStatusIndicators}>
                {isToday && (
                  <View style={styles.modalTodayIndicator}>
                    <Text style={styles.modalTodayText}>
                      Todays Appointment
                    </Text>
                  </View>
                )}
                {isOngoing && (
                  <View style={styles.modalOngoingIndicator}>
                    <Text style={styles.modalOngoingText}>
                      Currently Ongoing
                    </Text>
                  </View>
                )}
                {isPastDue && appointmentForInfo.status !== "completed" && (
                  <View style={styles.modalPastDueIndicator}>
                    <Text style={styles.modalPastDueText}>
                      Past Due - Will Auto Complete
                    </Text>
                  </View>
                )}
                {isPastDue && appointmentForInfo.status === "completed" && (
                  <View style={styles.modalAutoCompletedIndicator}>
                    <Text style={styles.modalAutoCompletedText}>
                      Auto Completed
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>
                  Automatic Completion System
                </Text>
                <Text style={styles.infoDescription}>
                  Appointments are automatically marked as completed when they
                  are past their scheduled time. No manual action is required
                  from staff members.
                </Text>

                <View style={styles.statusInfo}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#3B82F6"
                  />
                  <Text style={styles.statusInfoText}>
                    Current Status: {appointmentForInfo.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.featureText}>
                      Automatic completion for past due appointments
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.featureText}>
                      Real-time status updates
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.featureText}>
                      No manual intervention required
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoModalFooter}>
              <TouchableOpacity
                style={styles.closeInfoButton}
                onPress={() => setInfoModalVisible(false)}>
                <Text style={styles.closeInfoButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* HEADER */}
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
                  text2: `${appointments.length} total appointments`,
                });
              }}>
              <Ionicons name="notifications-outline" size={22} color="white" />
              {appointments.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {appointments.length > 9 ? "9+" : appointments.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <ProfileImage size={42} />
          </View>
        </View>

        {/* MENU */}
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
              style={[styles.menuItem, styles.menuItemActive]}
              onPress={() => setMenuVisible(false)}>
              <Text style={[styles.menuText, styles.menuTextActive]}>
                Client Bookings
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEARCH AND FILTER BAR */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#999" />
            <TextInput
              placeholder="Search for clients, services..."
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
            {selectedFilters.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {selectedFilters.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PAGE TITLE WITH EMPLOYEE STATUS */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Your Clients</Text>
          <EmployeeStatusIndicator />
        </View>

        {/* TAB NAVIGATION - ANIMATED */}
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
            {(["upcoming", "completed", "cancelled"] as TabType[]).map(
              (tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.tab}
                  onPress={() => handleTabChange(tab)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.tabTextActive,
                    ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

        {/* CONTENT WITH VERTICAL SCROLLING */}
        <Animated.View
          style={[styles.contentContainer, { opacity: tabContentOpacity }]}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#619AE4"
              style={styles.loader}
            />
          ) : getFilteredAppointments().length > 0 ? (
            <ScrollView
              style={styles.verticalScroll}
              contentContainerStyle={styles.verticalScrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#619AE4"
                />
              }
              showsVerticalScrollIndicator={false}>
              {getFilteredAppointments().map((appointment) => (
                <AppointmentCard
                  key={appointment._id || appointment.id}
                  appointment={appointment}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>
                No {activeTab} appointments
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeTab === "upcoming"
                  ? "You have no upcoming appointments with clients"
                  : `You don't have any ${activeTab} appointments yet`}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* DETAILS MODAL */}
        <DetailsModal />

        {/* INFO MODAL */}
        <InfoModal />

        {/* FILTER MODAL */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Appointments</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Service Category
                  </Text>
                  {[
                    "Haircut",
                    "Color",
                    "Treatment",
                    "Styling",
                    "Perming",
                    "Rebonding",
                    "Extensions",
                    "Packages",
                  ].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={styles.filterOption}
                      onPress={() => {
                        if (selectedFilters.includes(category)) {
                          setSelectedFilters(
                            selectedFilters.filter((f) => f !== category),
                          );
                        } else {
                          setSelectedFilters([...selectedFilters, category]);
                        }
                      }}>
                      <View
                        style={[
                          styles.checkbox,
                          selectedFilters.includes(category) &&
                            styles.checkboxActive,
                        ]}>
                        {selectedFilters.includes(category) && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <Text style={styles.filterOptionText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSelectedFilters([])}>
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
      </SafeAreaView>
    </View>
  );
}

// UPDATED STYLES WITH NEW INDICATORS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  safeArea: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Urbanist",
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
  menuItemActive: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
  },
  menuText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  menuTextActive: {
    color: "#619AE4",
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
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "400",
    paddingVertical: 8,
  },
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
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
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
  verticalScroll: {
    flex: 1,
  },
  verticalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clientAvatar: {
    borderWidth: 2,
    borderColor: "#619AE4",
  },
  clientAvatarPlaceholder: {
    backgroundColor: "#619AE4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontFamily: "Urbanist",
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  clientName: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Urbanist",
  },
  serviceName: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  clientContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  clientPhoneText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  statusBadgeCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextCard: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  cardDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    borderRadius: 8,
  },
  notesLabel: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  notesText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  priceContainer: {
    alignItems: "flex-start",
    gap: 2,
  },
  priceLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  priceValue: {
    color: "#619AE4",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  paymentStatus: {
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  viewDetailsButton: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#619AE4",
  },
  viewDetailsText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Urbanist",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  loader: {
    marginTop: 50,
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
    maxHeight: "75%",
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
  // NEW STYLES FOR AUTO COMPLETION FUNCTIONALITY
  statusIndicatorContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  todayBadge: {
    color: "#3B82F6",
    fontWeight: "700",
  },
  todayIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  todayIndicatorText: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  nearIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nearIndicatorText: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  ongoingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ongoingIndicatorText: {
    color: "#10B981",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  pastDueIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pastDueIndicatorText: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  autoCompletedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  autoCompletedIndicatorText: {
    color: "#10B981",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  // INFO MODAL STYLES
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  infoModalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  infoModalTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  infoModalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  infoModalBody: {
    padding: 20,
  },
  clientInfoModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  clientDetailsModal: {
    flex: 1,
  },
  infoModalClientName: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  infoModalService: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoModalTime: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  // Modal status indicators
  modalStatusIndicators: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  modalTodayIndicator: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalTodayText: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalOngoingIndicator: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalOngoingText: {
    color: "#10B981",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalPastDueIndicator: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalPastDueText: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalAutoCompletedIndicator: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalAutoCompletedText: {
    color: "#10B981",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  infoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 12,
  },
  infoTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  infoDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statusInfoText: {
    color: "#3B82F6",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  featureList: {
    marginTop: 12,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    flex: 1,
  },
  infoModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  closeInfoButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeInfoButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  // DETAILS MODAL STYLES
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  detailsModalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  detailsModalTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailsModalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsModalBody: {
    padding: 20,
    maxHeight: "80%",
  },
  detailsModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  closeDetailsButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeDetailsButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  clientInfoDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clientTextDetails: {
    flex: 1,
  },
  clientNameDetails: {
    color: "white",
    fontSize: 22,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  clientEmail: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  detailItemModal: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  detailTextModal: {
    flex: 1,
  },
  detailLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  todayBadgeModal: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 4,
  },
  statusPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusContainer: {
    flex: 1,
  },
  paymentContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  statusBadgeModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusTextModal: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  paymentStatusModal: {
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 4,
  },
  amountContainer: {
    marginTop: 8,
  },
  amountValue: {
    color: "#619AE4",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 4,
  },
  notesContainerModal: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesLabelModal: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
  },
  notesTextModal: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
  },
  noNotesText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontStyle: "italic",
    marginBottom: 16,
  },
  createdInfo: {
    marginTop: 8,
  },
  createdLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  createdDate: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  statusIndicatorsModal: {
    marginTop: 16,
  },
  statusIndicatorsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  statusIndicatorModal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusIndicatorText: {
    color: "#3B82F6",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  // Auto completion info styles
  autoCompletionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 12,
  },
  autoCompletionText: {
    flex: 1,
  },
  autoCompletionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  autoCompletionDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
  },
  // SEARCH HIGHLIGHT STYLES
  normalText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Urbanist",
  },
  highlightedText: {
    backgroundColor: "#F59E0B",
    color: "#000",
    fontWeight: "800",
  },
});
