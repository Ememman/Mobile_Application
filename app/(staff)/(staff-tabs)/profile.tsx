import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Animated,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants/images";
import { staffApiClient } from "@/app/lib/staffApiClient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SvgUri } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useAuth } from "@/app/lib/authContext";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Interface for Staff User
interface StaffUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  profileImage?: string;
  position?: string;
  phoneNumber?: string;
}

// Interface for Client Appointments
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

// Floating Label Input Component with Icon
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  icon,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  icon?: string;
  editable?: boolean;
}) => {
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const labelStyle = {
    position: "absolute" as const,
    left: icon ? 48 : 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: isFocused ? "#619AE4" : "#666",
    backgroundColor: "#1A1A1F",
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.floatingInputContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <View
        style={[
          styles.floatingInputWrapper,
          isFocused && styles.floatingInputWrapperFocused,
          !editable && styles.floatingInputDisabled,
        ]}>
        {icon && (
          <View style={styles.inputIconContainer}>
            <Ionicons
              name={icon as any}
              size={20}
              color={isFocused ? "#619AE4" : "#666"}
            />
          </View>
        )}
        <TextInput
          style={[styles.floatingInput, icon && styles.floatingInputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#666"
          editable={editable}
        />
      </View>
    </View>
  );
};

// Translation object for different languages
const translations = {
  en: {
    language: "Language",
    profileInfo: "Profile Information",
    bookings: "Client Bookings",
    terms: "Terms & Condition Policy",
    help: "Help & Support",
    logout: "LOG OUT",
    login: "LOG IN",
    staff: "Staff Member",
    staffEmail: "Staff Account",
    username: "Username",
    email: "Email",
    position: "Position",
    phoneNumber: "Phone Number",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    changePassword: "Change Password",
    updateProfile: "Update Profile",
    clientBookings: "Client Bookings",
    bookingDesc: "View and manage all client appointments here.",
    upcomingBookings: "Upcoming",
    completedBookings: "Completed",
    cancelledBookings: "Cancelled",
    noBookings: "No Bookings",
    noBookingsDesc: "No client bookings available.",
    loadingBookings: "Loading bookings...",
    contactUs: "Contact Us",
    phone: "Phone",
    businessHours: "Business Hours",
    salonLocation: "Salon Location",
    faqs: "FAQs",
    sendMessage: "Send Message",
    changePhoto: "Change Photo",
    viewDetails: "View Details",
    markComplete: "Mark Complete",
    cancelAppointment: "Cancel",
    confirmComplete: "Mark as Complete?",
    confirmCompleteMessage:
      "Are you sure you want to mark this appointment as completed?",
    confirmCancel: "Cancel Appointment?",
    confirmCancelMessage: "Are you sure you want to cancel this appointment?",
    appointmentUpdated: "Appointment updated successfully",
    updateFailed: "Failed to update appointment",
  },
  tl: {
    language: "Wika",
    profileInfo: "Impormasyon ng Profile",
    bookings: "Mga Booking ng Kliyente",
    terms: "Mga Tuntunin at Kondisyon",
    help: "Tulong at Suporta",
    logout: "MAG-LOGOUT",
    login: "MAG-LOGIN",
    staff: "Miyembro ng Staff",
    staffEmail: "Staff Account",
    username: "Username",
    email: "Email",
    position: "Posisyon",
    phoneNumber: "Numero ng Telepono",
    currentPassword: "Kasalukuyang Password",
    newPassword: "Bagong Password",
    confirmPassword: "Kumpirmahin ang Bagong Password",
    changePassword: "Baguhin ang Password",
    updateProfile: "I-update ang Profile",
    clientBookings: "Mga Booking ng Kliyente",
    bookingDesc:
      "Tingnan at pamahalaan ang lahat ng appointment ng kliyente dito.",
    upcomingBookings: "Paparating",
    completedBookings: "Nakumpleto",
    cancelledBookings: "Nakansela",
    noBookings: "Walang Booking",
    noBookingsDesc: "Walang available na booking ng kliyente.",
    loadingBookings: "Naglo-load ng mga booking...",
    contactUs: "Makipag-ugnayan sa Amin",
    phone: "Telepono",
    businessHours: "Oras ng Negosyo",
    salonLocation: "Lokasyon ng Salon",
    faqs: "Mga Madalas Itanong",
    sendMessage: "Magpadala ng Mensahe",
    changePhoto: "Baguhin ang Larawan",
    viewDetails: "Tingnan ang Detalye",
    markComplete: "Markahan bilang Tapos",
    cancelAppointment: "Kanselahin",
    confirmComplete: "Markahan bilang Tapos?",
    confirmCompleteMessage:
      "Sigurado ka bang gusto mong markahan ang appointment na ito bilang tapos?",
    confirmCancel: "Kanselahin ang Appointment?",
    confirmCancelMessage:
      "Sigurado ka bang gusto mong kanselahin ang appointment na ito?",
    appointmentUpdated: "Matagumpay na na-update ang appointment",
    updateFailed: "Hindi na-update ang appointment",
  },
  ceb: {
    language: "Pinulongan",
    profileInfo: "Impormasyon sa Profile",
    bookings: "Mga Booking sa Kliyente",
    terms: "Mga Termino ug Kondisyon",
    help: "Tabang ug Suporta",
    logout: "PAG-LOGOUT",
    login: "PAG-LOGIN",
    staff: "Miyembro sa Staff",
    staffEmail: "Staff Account",
    username: "Username",
    email: "Email",
    position: "Posisyon",
    phoneNumber: "Numero sa Telepono",
    currentPassword: "Kasamtangang Password",
    newPassword: "Bag-ong Password",
    confirmPassword: "Kumpirmahin ang Bag-ong Password",
    changePassword: "Usbon ang Password",
    updateProfile: "I-update ang Profile",
    clientBookings: "Mga Booking sa Kliyente",
    bookingDesc:
      "Tan-awa ug dumala ang tanan nga appointment sa kliyente dinhi.",
    upcomingBookings: "Umaabot",
    completedBookings: "Nahuman",
    cancelledBookings: "Nakansela",
    noBookings: "Walay Booking",
    noBookingsDesc: "Walay available nga booking sa kliyente.",
    loadingBookings: "Nag-load sa mga booking...",
    contactUs: "Kontaka Kami",
    phone: "Telepono",
    businessHours: "Oras sa Negosyo",
    salonLocation: "Lokasyon sa Salon",
    faqs: "Mga Kanunay Pangutana",
    sendMessage: "Pagpadala og Mensahe",
    changePhoto: "Usba ang Litrato",
    viewDetails: "Tan-awa ang Detalye",
    markComplete: "Markahi nga Nahuman",
    cancelAppointment: "Kansela",
    confirmComplete: "Markahi nga Nahuman?",
    confirmCompleteMessage:
      "Sigurado ka ba nga gusto nimong markahan kini nga appointment nga nahuman?",
    confirmCancel: "Kanselahon ang Appointment?",
    confirmCancelMessage:
      "Sigurado ka ba nga gusto nimong kanselahon kini nga appointment?",
    appointmentUpdated: "Appointment nga gipamala niadtong malampuson",
    updateFailed: "Napakyas sa pag-update sa appointment",
  },
  zh: {
    language: "语言",
    profileInfo: "个人信息",
    bookings: "客户预订",
    terms: "条款与条件",
    help: "帮助与支持",
    logout: "登出",
    login: "登录",
    staff: "员工成员",
    staffEmail: "员工账户",
    username: "用户名",
    email: "电子邮件",
    position: "职位",
    phoneNumber: "电话号码",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    changePassword: "更改密码",
    updateProfile: "更新资料",
    clientBookings: "客户预订",
    bookingDesc: "在此查看和管理所有客户预约。",
    upcomingBookings: "即将到来",
    completedBookings: "已完成",
    cancelledBookings: "已取消",
    noBookings: "无预订",
    noBookingsDesc: "没有可用的客户预订。",
    loadingBookings: "加载预订中...",
    contactUs: "联系我们",
    phone: "电话",
    businessHours: "营业时间",
    salonLocation: "沙龙位置",
    faqs: "常见问题",
    sendMessage: "发送消息",
    changePhoto: "更换照片",
    viewDetails: "查看详情",
    markComplete: "标记完成",
    cancelAppointment: "取消",
    confirmComplete: "标记为完成？",
    confirmCompleteMessage: "您确定要将此预约标记为已完成吗？",
    confirmCancel: "取消预约？",
    confirmCancelMessage: "您确定要取消此预约吗？",
    appointmentUpdated: "预约更新成功",
    updateFailed: "更新预约失败",
  },
};

// Helper function for status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case "upcoming":
    case "confirmed":
      return "#3B82F6";
    case "completed":
      return "#10B981";
    case "cancelled":
      return "#EF4444";
    case "pending":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

// Enhanced Profile Image Component
const ProfileImage = ({
  imageUrl,
  size = 60,
  username,
}: {
  imageUrl?: string;
  size?: number;
  username?: string;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    console.log("❌ Failed to load profile image, using fallback");
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log("✅ Profile image loaded successfully");
    setImageLoading(false);
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
      }}>
      {imageUrl && !imageError ? (
        <View style={{ position: "relative" }}>
          {imageLoading && (
            <View
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: "#1F2937",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}>
              <ActivityIndicator size="small" color="#619AE4" />
            </View>
          )}
          <Image
            source={{
              uri: imageUrl.startsWith("/uploads/")
                ? `https://sandrealeesalon.onrender.com${imageUrl}`
                : imageUrl,
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
          <Text
            style={{ color: "white", fontSize: size * 0.4, fontWeight: "700" }}>
            {username?.[0]?.toUpperCase() || "S"}
          </Text>
        </View>
      )}
    </View>
  );
};

// Enhanced Client Avatar Component
const ClientAvatar = ({
  client,
  size = 50,
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
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "#E63946",
        }}
        onError={() => setImageError(true)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#619AE4",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E63946",
      }}>
      <Text style={{ color: "white", fontSize: size * 0.4, fontWeight: "700" }}>
        {client?.username?.[0]?.toUpperCase() ||
          client?.firstName?.[0]?.toUpperCase() ||
          "C"}
      </Text>
    </View>
  );
};

const StaffProfileScreen = () => {
  const { user: authUser, logout: authLogout } = useAuth();

  // State management
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("language");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Profile form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Bookings state
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsTab, setBookingsTab] = useState<
    "upcoming" | "completed" | "cancelled"
  >("upcoming");
  const [selectedAppointment, setSelectedAppointment] =
    useState<ClientAppointment | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  const t = translations[selectedLanguage as keyof typeof translations];

  // Load language preference
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (authUser) {
        loadUserProfile();
      }
    }, [authUser]),
  );

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error("Error loading language preference:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Load staff profile from your API
      const staffData: StaffUser = {
        id: authUser?.id || "",
        username: authUser?.username || "",
        email: authUser?.email || "",
        firstName: authUser?.firstName,
        profileImage: authUser?.profileImage,
        position: authUser?.position || "Staff",
        phoneNumber: authUser?.phoneNumber,
      };

      setUser(staffData);
      setUsername(staffData.username);
      setEmail(staffData.email);
      setPosition(staffData.position || "");
      setPhoneNumber(staffData.phoneNumber || "");
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await staffApiClient.getAllClientAppointments({
        status: "all",
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const transformedAppointments: ClientAppointment[] = response.data.map(
          (apt: any) => ({
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
          }),
        );

        setAppointments(transformedAppointments);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load client bookings",
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await AsyncStorage.setItem("selectedLanguage", lang);
      setSelectedLanguage(lang);
      setShowLanguageModal(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Language changed successfully",
      });
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      // Implement your profile update API call here
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
      });
      await loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Passwords do not match",
      });
      return;
    }

    try {
      setLoading(true);
      // Implement your password change API call here
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Password changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Implement image upload here
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile picture updated",
      });
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authLogout();
          router.replace("/(staff)/(auth)");
        },
      },
    ]);
  };

  const handleViewAppointmentDetails = (appointment: ClientAppointment) => {
    setSelectedAppointment(appointment);
    setReceiptModalVisible(true);
  };

  // FIXED: Enhanced appointment status update function
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: "completed" | "cancelled",
  ) => {
    try {
      setLoading(true);

      console.log(`🔄 Updating appointment ${appointmentId} to ${newStatus}`);

      let response;

      if (newStatus === "completed") {
        // Use the correct API method for completing appointments
        response = await staffApiClient.updateAppointmentStatus(appointmentId, {
          status: "completed",
        });
      } else if (newStatus === "cancelled") {
        // Use the correct API method for cancelling appointments
        response = await staffApiClient.cancelAppointment(
          appointmentId,
          "Cancelled by salon staff",
        );
      }

      if (response && response.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt,
          ),
        );

        Toast.show({
          type: "success",
          text1: "Success",
          text2: t.appointmentUpdated,
        });

        // Refresh the bookings list
        await loadClientBookings();
      } else {
        throw new Error(response?.message || "Failed to update appointment");
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || t.updateFailed,
      });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced confirmation handlers for appointment actions
  const handleMarkComplete = (appointment: ClientAppointment) => {
    Alert.alert(t.confirmComplete, t.confirmCompleteMessage, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "default",
        onPress: () => updateAppointmentStatus(appointment.id, "completed"),
      },
    ]);
  };

  const handleCancelAppointment = (appointment: ClientAppointment) => {
    Alert.alert(t.confirmCancel, t.confirmCancelMessage, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => updateAppointmentStatus(appointment.id, "cancelled"),
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    if (activeTab === "bookings") {
      await loadClientBookings();
    }
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "language":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>{t.language}</Text>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.languageSelectorText}>
                {selectedLanguage === "en" && "English"}
                {selectedLanguage === "tl" && "Tagalog"}
                {selectedLanguage === "ceb" && "Cebuano"}
                {selectedLanguage === "zh" && "Chinese"}
              </Text>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "profile":
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>{t.profileInfo}</Text>

            <View style={styles.profilePictureSection}>
              <View style={styles.profilePictureContainer}>
                <ProfileImage
                  imageUrl={user?.profileImage}
                  size={100}
                  username={user?.username}
                />
                <TouchableOpacity
                  style={styles.cameraIconContainer}
                  onPress={handleImagePick}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.changePhotoText}>{t.changePhoto}</Text>
            </View>

            <View style={styles.formSection}>
              <FloatingLabelInput
                label={t.username}
                value={username}
                onChangeText={setUsername}
                icon="person-outline"
              />
              <FloatingLabelInput
                label={t.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                editable={false}
              />
              <FloatingLabelInput
                label={t.position}
                value={position}
                onChangeText={setPosition}
                icon="briefcase-outline"
                editable={false}
              />
              <FloatingLabelInput
                label={t.phoneNumber}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateProfile}>
                <Text style={styles.updateButtonText}>{t.updateProfile}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>{t.changePassword}</Text>
              <FloatingLabelInput
                label={t.currentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />
              <FloatingLabelInput
                label={t.newPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />
              <FloatingLabelInput
                label={t.confirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleChangePassword}>
                <Text style={styles.updateButtonText}>{t.changePassword}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case "bookings":
        if (!appointments.length && !bookingsLoading) {
          loadClientBookings();
        }

        const filteredAppointments = appointments.filter(
          (apt) => apt.status === bookingsTab,
        );

        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>{t.clientBookings}</Text>
            <Text style={styles.tabDescription}>{t.bookingDesc}</Text>

            {/* Bookings Tabs */}
            <View style={styles.bookingsTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.bookingsTab,
                  bookingsTab === "upcoming" && styles.bookingsTabActive,
                ]}
                onPress={() => setBookingsTab("upcoming")}>
                <Text
                  style={[
                    styles.bookingsTabText,
                    bookingsTab === "upcoming" && styles.bookingsTabTextActive,
                  ]}>
                  {t.upcomingBookings}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bookingsTab,
                  bookingsTab === "completed" && styles.bookingsTabActive,
                ]}
                onPress={() => setBookingsTab("completed")}>
                <Text
                  style={[
                    styles.bookingsTabText,
                    bookingsTab === "completed" && styles.bookingsTabTextActive,
                  ]}>
                  {t.completedBookings}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bookingsTab,
                  bookingsTab === "cancelled" && styles.bookingsTabActive,
                ]}
                onPress={() => setBookingsTab("cancelled")}>
                <Text
                  style={[
                    styles.bookingsTabText,
                    bookingsTab === "cancelled" && styles.bookingsTabTextActive,
                  ]}>
                  {t.cancelledBookings}
                </Text>
              </TouchableOpacity>
            </View>

            {bookingsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E63946" />
                <Text style={styles.loadingText}>{t.loadingBookings}</Text>
              </View>
            ) : filteredAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#666" />
                <Text style={styles.emptyStateTitle}>{t.noBookings}</Text>
                <Text style={styles.emptyStateText}>{t.noBookingsDesc}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.bookingsList}
                showsVerticalScrollIndicator={false}>
                {filteredAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.clientInfo}>
                        <ClientAvatar client={appointment.customer} size={50} />
                        <View style={styles.clientDetails}>
                          <Text style={styles.clientName}>
                            {appointment.customer.firstName}
                          </Text>
                          <Text style={styles.clientEmail}>
                            {appointment.customer.email}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(appointment.status),
                          },
                        ]}>
                        <Text style={styles.statusText}>
                          {appointment.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appointmentBody}>
                      <View style={styles.serviceInfo}>
                        <Ionicons
                          name="cut-outline"
                          size={20}
                          color="#E63946"
                        />
                        <Text style={styles.serviceName}>
                          {appointment.service.name}
                        </Text>
                      </View>
                      <View style={styles.appointmentMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color="#888"
                          />
                          <Text style={styles.metaText}>
                            {new Date(
                              appointment.appointmentDate,
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#888"
                          />
                          <Text style={styles.metaText}>
                            {appointment.appointmentTime}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Total:</Text>
                        <Text style={styles.priceValue}>
                          ₱{appointment.totalAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appointmentActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          handleViewAppointmentDetails(appointment)
                        }>
                        <Text style={styles.actionButtonText}>
                          {t.viewDetails}
                        </Text>
                      </TouchableOpacity>

                      {/* FIXED: Enhanced action buttons with proper status checks */}
                      {appointment.status === "upcoming" && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.completeButton]}
                            onPress={() => handleMarkComplete(appointment)}
                            disabled={loading}>
                            {loading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.actionButtonText}>
                                {t.markComplete}
                              </Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleCancelAppointment(appointment)}
                            disabled={loading}>
                            {loading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.actionButtonText}>
                                {t.cancelAppointment}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Show different actions for completed/cancelled appointments */}
                      {(appointment.status === "completed" ||
                        appointment.status === "cancelled") && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.disabledButton]}
                          disabled={true}>
                          <Text style={styles.actionButtonText}>
                            {appointment.status === "completed"
                              ? "Completed"
                              : "Cancelled"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case "terms":
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>{t.terms}</Text>

            <Text style={styles.termsSectionTitle}>
              1. Staff Responsibilities
            </Text>
            <Text style={styles.termsText}>
              As a staff member, you are expected to maintain professional
              conduct, provide excellent service to clients, and follow all
              salon policies and procedures.
            </Text>

            <Text style={styles.termsSectionTitle}>2. Client Privacy</Text>
            <Text style={styles.termsText}>
              All client information must be kept confidential. You must not
              share or discuss client details outside of professional contexts.
            </Text>

            <Text style={styles.termsSectionTitle}>
              3. Attendance and Punctuality
            </Text>
            <Text style={styles.termsText}>
              Staff members are expected to arrive on time for all scheduled
              shifts and appointments. Notify management in advance for any
              absences.
            </Text>

            <Text style={styles.termsSectionTitle}>
              4. Professional Standards
            </Text>
            <Text style={styles.termsText}>
              Maintain appropriate appearance and hygiene standards. Treat all
              clients and colleagues with respect and professionalism.
            </Text>
          </ScrollView>
        );

      case "help":
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>{t.help}</Text>

            <View style={styles.helpSection}>
              <Ionicons name="call-outline" size={24} color="#E63946" />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>{t.phone}</Text>
                <Text style={styles.helpDescription}>+63 123 456 7890</Text>
              </View>
            </View>

            <View style={styles.helpSection}>
              <Ionicons name="time-outline" size={24} color="#E63946" />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>{t.businessHours}</Text>
                <Text style={styles.helpDescription}>
                  Monday - Sunday{"\n"}9:00 AM - 8:00 PM
                </Text>
              </View>
            </View>

            <View style={styles.helpSection}>
              <Ionicons name="location-outline" size={24} color="#E63946" />
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>{t.salonLocation}</Text>
                <Text style={styles.helpDescription}>
                  2184 Loyola St, Sampaloc, Manila
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>{t.sendMessage}</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <ProfileImage
            imageUrl={user?.profileImage}
            size={60}
            username={user?.username}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{user?.username || t.staff}</Text>
            <Text style={styles.headerEmail}>
              {user?.email || t.staffEmail}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <TouchableOpacity
          style={[
            styles.menuItem,
            activeTab === "language" && styles.menuItemActive,
          ]}
          onPress={() => setActiveTab("language")}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="language-outline" size={24} color="#fff" />
            <Text style={styles.menuItemText}>{t.language}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            activeTab === "profile" && styles.menuItemActive,
          ]}
          onPress={() => setActiveTab("profile")}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.menuItemText}>{t.profileInfo}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            activeTab === "bookings" && styles.menuItemActive,
          ]}
          onPress={() => setActiveTab("bookings")}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="calendar-outline" size={24} color="#fff" />
            <Text style={styles.menuItemText}>{t.bookings}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            activeTab === "terms" && styles.menuItemActive,
          ]}
          onPress={() => setActiveTab("terms")}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.menuItemText}>{t.terms}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            activeTab === "help" && styles.menuItemActive,
          ]}
          onPress={() => setActiveTab("help")}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.menuItemText}>{t.help}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Content Modal */}
      <Modal
        visible={activeTab !== ""}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveTab("")}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setActiveTab("")}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {renderTabContent()}
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.languageModalOverlay}>
          <View style={styles.languageModalContent}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.modalTitle}>{t.language}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent}>
              {Object.entries({
                en: "English",
                tl: "Tagalog",
                ceb: "Cebuano",
                zh: "Chinese",
              }).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === code && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageChange(code)}>
                  <Text style={styles.languageText}>{name}</Text>
                  {selectedLanguage === code && (
                    <Ionicons name="checkmark" size={24} color="#E63946" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Appointment Details Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setReceiptModalVisible(false)}>
        {selectedAppointment && (
          <View style={styles.receiptModalContent}>
            <View style={styles.receiptHeader}>
              <TouchableOpacity
                style={styles.receiptCloseButton}
                onPress={() => setReceiptModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.receiptTitle}>Appointment Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.receiptScroll}>
              <View style={styles.receiptSalonSection}>
                <Image
                  source={images.salonlogo}
                  style={styles.receiptLogo}
                  resizeMode="contain"
                />
                <Text style={styles.receiptSalonName}>SandreaLee Salon</Text>
                <Text style={styles.receiptSalonAddress}>
                  {selectedAppointment.salonLocation.address}
                </Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptInfoSection}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Appointment ID</Text>
                  <Text style={styles.receiptValue}>
                    #{selectedAppointment.id.slice(-8).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>
                  <View
                    style={[
                      styles.receiptStatusBadge,
                      {
                        backgroundColor: getStatusColor(
                          selectedAppointment.status,
                        ),
                      },
                    ]}>
                    <View style={styles.receiptStatusDot} />
                    <Text style={styles.receiptStatusText}>
                      {selectedAppointment.status.toUpperCase()}
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
                      {selectedAppointment.customer.phoneNumber}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.receiptServiceSection}>
                <Text style={styles.receiptSectionTitle}>Service Details</Text>
                <View style={styles.serviceDetailCard}>
                  <Text style={styles.serviceName}>
                    {selectedAppointment.service.name}
                  </Text>
                  <Text style={styles.serviceCategory}>
                    {selectedAppointment.service.category}
                  </Text>
                  <View style={styles.serviceMeta}>
                    <View style={styles.serviceMetaItem}>
                      <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.serviceMetaText}>
                        {selectedAppointment.service.duration} mins
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.receiptDetailsSection}>
                <Text style={styles.receiptSectionTitle}>
                  Appointment Information
                </Text>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#619AE4"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptDetailLabel}>Date</Text>
                    <Text style={styles.receiptDetailValue}>
                      {new Date(
                        selectedAppointment.appointmentDate,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptDetailItem}>
                  <View style={styles.receiptDetailIcon}>
                    <Ionicons name="time-outline" size={20} color="#619AE4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptDetailLabel}>Time</Text>
                    <Text style={styles.receiptDetailValue}>
                      {selectedAppointment.appointmentTime}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedAppointment.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.receiptSectionTitle}>Notes</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.receiptDetailSubtext}>
                      {selectedAppointment.notes}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.receiptPaymentSection}>
                <Text style={styles.receiptSectionTitle}>Payment</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total Amount</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₱{selectedAppointment.totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptFooter}>
                <Text style={styles.receiptFooterText}>
                  Thank you for choosing SandreaLee Salon
                </Text>
                <Text style={styles.receiptFooterSubtext}>
                  We look forward to serving you
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.receiptCloseButtonBottom}
              onPress={() => setReceiptModalVisible(false)}>
              <LinearGradient
                colors={["#619AE4", "#4A7FC7"]}
                style={styles.receiptCloseGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.receiptCloseText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 24,
    backgroundColor: "#0B0B0F",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerEmail: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B0B0F",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  menuItemActive: {
    borderColor: "#E63946",
    backgroundColor: "#1F2937",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E63946",
    padding: 18,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 40,
    gap: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1F",
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: "#0B0B0F",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  tabDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B0B0F",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginTop: 12,
  },
  languageSelectorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  languageModalContent: {
    backgroundColor: "#1A1A1F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  languageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    flex: 1,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  languageItemActive: {
    backgroundColor: "#2A2A2A",
  },
  languageText: {
    color: "#fff",
    fontSize: 16,
  },
  bookingsTabsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "#0B0B0F",
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  bookingsTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookingsTabActive: {
    backgroundColor: "#0348D3",
  },
  bookingsTabText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  bookingsTabTextActive: {
    color: "#fff",
  },
  bookingsList: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: "#0B0B0F",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  clientEmail: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  appointmentBody: {
    marginBottom: 16,
    gap: 12,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  appointmentMeta: {
    flexDirection: "row",
    gap: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  priceLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  priceValue: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "700",
  },
  appointmentActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#619AE4",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: "#10B981",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  disabledButton: {
    backgroundColor: "#6B7280",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  termsSectionTitle: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
  },
  termsText: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 40,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  helpDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: "#E63946",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 12,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 14,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#E63946",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1A1A1F",
  },
  changePhotoText: {
    color: "#E63946",
    fontSize: 14,
    fontWeight: "600",
  },
  floatingInputContainer: {
    marginBottom: 24,
    position: "relative",
  },
  floatingInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  floatingInputWrapperFocused: {
    borderColor: "#619AE4",
  },
  floatingInputDisabled: {
    opacity: 0.6,
  },
  inputIconContainer: {
    position: "absolute",
    left: 16,
    zIndex: 2,
  },
  floatingInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 18,
    color: "#fff",
    fontSize: 16,
  },
  floatingInputWithIcon: {
    paddingLeft: 52,
  },
  formSection: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: "#E63946",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Receipt Modal Styles
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
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
    fontWeight: "700",
    marginBottom: 8,
  },
  receiptSalonAddress: {
    color: "#9CA3AF",
    fontSize: 13,
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
  },
  receiptValue: {
    color: "white",
    fontSize: 14,
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
  receiptStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  receiptStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  receiptClientSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  receiptSectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  clientDetailRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  receiptClientName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  receiptClientEmail: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 4,
  },
  receiptClientPhone: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  receiptServiceSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  serviceDetailCard: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  serviceCategory: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: 12,
  },
  serviceMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  serviceMetaText: {
    color: "#9CA3AF",
    fontSize: 12,
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
    marginBottom: 2,
  },
  receiptDetailValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  receiptDetailSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
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
  receiptPaymentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  receiptTotalLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  receiptTotalValue: {
    color: "#22C55E",
    fontSize: 20,
    fontWeight: "700",
  },
  receiptFooter: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  receiptFooterText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  receiptFooterSubtext: {
    color: "#6B7280",
    fontSize: 12,
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
    fontWeight: "700",
  },
});

export default StaffProfileScreen;
