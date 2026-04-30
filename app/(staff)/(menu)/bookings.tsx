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
import { staffApiClient } from "@/app/lib/staffApiClient";
import { images } from "@/constants/images";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

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

type TabType = "recent" | "completed";

export default function StaffBookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointment | null>(null);

  const tabIndicatorPosition = React.useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Urbanist: require("../../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  // REAL-TIME UPDATE: Refresh when app becomes active
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
  }, []);

  // REAL-TIME UPDATE: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ Auto-refreshing appointments...");
      loadAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log("📋 Loading all staff appointments");

      const response = await staffApiClient.getAllBookingsForStaff({
        status: "all",
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        console.log("✅ Appointments loaded:", response.data.length);

        const transformedAppointments: ClientAppointment[] = response.data
          .map((apt: any) => ({
            _id: apt._id || apt.id,
            id: apt._id || apt.id,
            customer: {
              id: apt.customer?._id || apt.customer?.id || "",
              username: apt.customer?.username || "Unknown",
              firstName:
                apt.customer?.firstName || apt.customer?.username || "Unknown",
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
              apt.status === "confirmed" || apt.status === "pending"
                ? "upcoming"
                : apt.status,
            notes: apt.notes || apt.customerNotes,
            salonLocation: apt.salonLocation || {
              name: "SandreaLee Salon",
              address: "2184 Loyola St, Sampaloc, Manila",
            },
            totalAmount: apt.totalAmount || apt.servicePrice || 0,
            paymentStatus: apt.paymentStatus || "pending",
            createdAt: apt.createdAt,
          }))
          // REMOVED: Authentication filter - show all appointments regardless of staff
          .filter((apt: ClientAppointment) => {
            // Only show appointments that have a stylist assigned
            const hasStylist = !!apt.selectedStylist;

            if (!hasStylist) {
              console.log(
                `❌ Filtered out appointment - no stylist assigned:`,
                {
                  client: apt.customer.firstName,
                },
              );
            }

            return hasStylist;
          });

        console.log(
          "✅ All staff appointments:",
          transformedAppointments.length,
        );
        setAppointments(transformedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.error("❌ Error loading appointments:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load appointments.",
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
    await loadAppointments();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Appointments updated!",
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

  const getFilteredAppointments = (): ClientAppointment[] => {
    let filtered: ClientAppointment[] = [];

    if (activeTab === "recent") {
      // Recent = upcoming + confirmed + pending
      filtered = appointments.filter(
        (apt) =>
          apt.status === "upcoming" ||
          apt.status === "confirmed" ||
          apt.status === "pending",
      );
    } else {
      // Completed appointments
      filtered = appointments.filter((apt) => apt.status === "completed");
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
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

    const categoryLower = category.toLowerCase();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "upcoming":
        return "#3B82F6";
      case "completed":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleViewReceipt = (appointment: ClientAppointment) => {
    setSelectedAppointment(appointment);
    setReceiptModalVisible(true);
  };

  const ClientAvatar = ({
    client,
    size = 40,
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

  const AppointmentCard = ({
    appointment,
  }: {
    appointment: ClientAppointment;
  }) => {
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleViewReceipt(appointment)}
        activeOpacity={0.7}>
        <View style={styles.cardContent}>
          {/* Left: Client Avatar and Service Image */}
          <View style={styles.imageContainer}>
            <ClientAvatar client={appointment.customer} size={60} />
            <View style={styles.serviceImageOverlay}>
              <Image
                source={getCategoryImage(appointment.service.category)}
                style={styles.serviceImage}
              />
            </View>
          </View>

          {/* Right: Appointment Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.dateStatusRow}>
              <Text style={styles.dateTime}>
                {formatDate(appointment.appointmentDate)}{" "}
                {formatTimeWithAMPM(appointment.appointmentTime)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${getStatusColor(appointment.status)}20`,
                  },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(appointment.status) },
                  ]}>
                  {getStatusText(appointment.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.clientName}>
              {appointment.customer.firstName}
            </Text>
            <Text style={styles.clientPhone}>
              {appointment.customer.phoneNumber || "No phone provided"}
            </Text>

            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Service: </Text>
              <Text style={styles.serviceName}>{appointment.service.name}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Amount: </Text>
              <Text style={styles.priceValue}>₱{appointment.totalAmount}</Text>
              <View
                style={[
                  styles.paymentStatusBadge,
                  {
                    backgroundColor:
                      appointment.paymentStatus === "paid"
                        ? "#10B98120"
                        : "#F59E0B20",
                    marginLeft: 8,
                  },
                ]}>
                <Text
                  style={[
                    styles.paymentStatusText,
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
            </View>

            {/* Display assigned stylist */}
            {appointment.selectedStylist && (
              <View style={styles.stylistRow}>
                <Text style={styles.stylistLabel}>Stylist: </Text>
                <Text style={styles.stylistName}>
                  {appointment.selectedStylist.username}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ReceiptModal = () => {
    if (!selectedAppointment) return null;

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
              <Text style={styles.receiptTitle}>Appointment Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.receiptScroll}>
              <View style={styles.receiptSalonSection}>
                <Image
                  source={require("../../../assets/images/SandreaLeeSalonLogoCapstone.png")}
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
                  <Text style={styles.receiptLabel}>Appointment ID</Text>
                  <Text style={styles.receiptValue}>
                    #{selectedAppointment._id.slice(-8).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <View
                    style={[
                      styles.receiptStatusBadge,
                      {
                        backgroundColor: `${getStatusColor(
                          selectedAppointment.status,
                        )}20`,
                      },
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            selectedAppointment.status,
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.receiptStatusText,
                        { color: getStatusColor(selectedAppointment.status) },
                      ]}>
                      {getStatusText(selectedAppointment.status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.receiptClientSection}>
                <Text style={styles.receiptSectionTitle}>
                  Client Information
                </Text>
                <View style={styles.clientDetailRow}>
                  <ClientAvatar
                    client={selectedAppointment.customer}
                    size={50}
                  />
                  <View style={styles.clientDetails}>
                    <Text style={styles.receiptClientName}>
                      {selectedAppointment.customer.firstName}
                    </Text>
                    <Text style={styles.receiptClientEmail}>
                      {selectedAppointment.customer.email}
                    </Text>
                    <Text style={styles.receiptClientPhone}>
                      {selectedAppointment.customer.phoneNumber || "No phone"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Display assigned stylist in receipt */}
              {selectedAppointment.selectedStylist && (
                <View style={styles.receiptStylistSection}>
                  <Text style={styles.receiptSectionTitle}>
                    Assigned Stylist
                  </Text>
                  <View style={styles.stylistDetailRow}>
                    {selectedAppointment.selectedStylist.profileImage ? (
                      <Image
                        source={{
                          uri: selectedAppointment.selectedStylist.profileImage.startsWith(
                            "/uploads/",
                          )
                            ? `http://10.74.230.139:3000${selectedAppointment.selectedStylist.profileImage}`
                            : selectedAppointment.selectedStylist.profileImage,
                        }}
                        style={styles.stylistAvatar}
                      />
                    ) : (
                      <View style={styles.stylistAvatarPlaceholder}>
                        <Text style={styles.stylistAvatarText}>
                          {selectedAppointment.selectedStylist.username[0]?.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.stylistDetails}>
                      <Text style={styles.stylistName}>
                        {selectedAppointment.selectedStylist.username}
                      </Text>
                      <Text style={styles.stylistPosition}>
                        {selectedAppointment.selectedStylist.position}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.receiptServiceSection}>
                <Text style={styles.receiptSectionTitle}>Service Details</Text>
                <View style={styles.serviceDetailRow}>
                  <Image
                    source={getCategoryImage(
                      selectedAppointment.service.category,
                    )}
                    style={styles.receiptServiceImage}
                  />
                  <View style={styles.receiptServiceInfo}>
                    <Text style={styles.receiptServiceName}>
                      {selectedAppointment.service.name}
                    </Text>
                    <Text style={styles.receiptServiceCategory}>
                      {selectedAppointment.service.category}
                    </Text>
                    <View style={styles.receiptServiceMeta}>
                      <View style={styles.receiptMetaItem}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.receiptMetaText}>
                          {selectedAppointment.service.duration} mins
                        </Text>
                      </View>
                      <View style={styles.receiptMetaItem}>
                        <Ionicons
                          name="pricetag-outline"
                          size={14}
                          color="#9CA3AF"
                        />
                        <Text style={styles.receiptMetaText}>
                          {selectedAppointment.service.priceRange}
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
                      {formatDate(selectedAppointment.appointmentDate)}
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
                      {formatTimeWithAMPM(selectedAppointment.appointmentTime)}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#619AE4"
                    />
                  </View>
                  <View>
                    <Text style={styles.receiptDetailLabel}>Location</Text>
                    <Text style={styles.receiptDetailValue}>
                      {selectedAppointment.salonLocation.name}
                    </Text>
                    <Text style={styles.receiptDetailSubtext}>
                      {selectedAppointment.salonLocation.address}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedAppointment.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.receiptSectionTitle}>Client Notes</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>
                      {selectedAppointment.notes}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.receiptPaymentSection}>
                <Text style={styles.receiptSectionTitle}>Payment Details</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Status</Text>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      {
                        backgroundColor:
                          selectedAppointment.paymentStatus === "paid"
                            ? "#10B98120"
                            : "#F59E0B20",
                      },
                    ]}>
                    <Text
                      style={[
                        styles.paymentStatusText,
                        {
                          color:
                            selectedAppointment.paymentStatus === "paid"
                              ? "#10B981"
                              : "#F59E0B",
                        },
                      ]}>
                      {selectedAppointment.paymentStatus
                        .charAt(0)
                        .toUpperCase() +
                        selectedAppointment.paymentStatus.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total Amount</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₱{selectedAppointment.totalAmount}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptTimestamps}>
                <Text style={styles.timestampText}>
                  Created: {formatDateShort(selectedAppointment.createdAt)}
                </Text>
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

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Staff Bookings</Text>
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
              Recent Appointments
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
        ) : getFilteredAppointments().length > 0 ? (
          <View style={styles.bookingsList}>
            {getFilteredAppointments().map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyStateText}>
              No {activeTab} appointments
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === "recent"
                ? "There are no upcoming appointments"
                : "There are no completed appointments yet"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Receipt Modal */}
      <ReceiptModal />

      <Toast />
    </SafeAreaView>
  );
}

// Add these new styles for the stylist information
const styles = StyleSheet.create({
  // ... all your existing styles remain the same

  // Add these new styles:
  stylistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  stylistLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  stylistName: {
    color: "#F59E0B",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptStylistSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  stylistDetailRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  stylistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  stylistAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  stylistAvatarText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  stylistDetails: {
    flex: 1,
    justifyContent: "center",
  },
  stylistPosition: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginTop: 2,
  },

  // ... rest of your existing styles
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
    width: 80,
    height: 80,
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
  serviceImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  serviceImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
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
  clientName: {
    color: "#E5E7EB",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 2,
  },
  clientPhone: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 6,
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  priceLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  priceValue: {
    color: "#22C55E",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
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
  loader: {
    marginTop: 100,
  },
  // RECEIPT MODAL STYLES
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
  receiptClientSection: {
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
  clientDetailRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  clientDetails: {
    flex: 1,
  },
  receiptClientName: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  receiptClientEmail: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  receiptClientPhone: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  receiptServiceSection: {
    paddingHorizontal: 20,
    marginTop: 24,
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
  receiptDetailSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  notesSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  notesCard: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
  },
  receiptPaymentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
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
