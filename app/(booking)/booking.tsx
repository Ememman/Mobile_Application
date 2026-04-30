import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "@/constants/images";
import { apiClient, Service } from "@/app/api/apiClient";
import QRCode from "react-native-qrcode-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Stylist {
  _id: string;
  username: string;
  position: string;
  rating?: number;
  reviewCount?: number;
  topRated?: boolean;
  profileImage?: string;
}

type BookingScreenType =
  | "details"
  | "stylist"
  | "datetime"
  | "summary"
  | "payment"
  | "receipt"
  | "receiptInfo"
  | "status";

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedService = JSON.parse(params.service as string) as Service;

  const [currentScreen, setCurrentScreen] =
    useState<BookingScreenType>("details");
  const [selectedTab, setSelectedTab] = useState("about");
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [paymentType, setPaymentType] = useState<"online" | "salon">("online");
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState({
    referenceNumber: "",
    name: "",
    amountPaid: "",
    dateOfTransaction: "",
  });
  const [proofImage, setProofImage] = useState<any>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "approved" | "denied"
  >("idle");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stylistSelectionType, setStylistSelectionType] = useState<
    "any" | "specific" | null
  >(null);
  const [paymentOption, setPaymentOption] = useState<"full" | "downpayment">(
    "full",
  );

  // NEW STATES FOR OVERLAYS
  const [showTermsOverlay, setShowTermsOverlay] = useState(false);
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false);

  // NEW STATES FOR AVAILABILITY
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const referenceNumberRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);

  const screens: BookingScreenType[] = [
    "details",
    "stylist",
    "datetime",
    "summary",
    "payment",
    "receipt",
    "receiptInfo",
    "status",
  ];

  // Check authentication and user status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        console.log("🔐 Checking authentication status...");

        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        console.log("👤 Stored user:", user);

        if (user) {
          try {
            console.log("✅ Valid user session:");
            setIsAuthenticated(true);
            setIsGuest(user.isGuest || false);
          } catch {
            console.log("❌ Token invalid, creating guest session...");
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            await apiClient.createGuestSession();
            setIsAuthenticated(true);
            setIsGuest(true);
          }
        } else {
          console.log("👥 Creating guest session...");
          await apiClient.createGuestSession();
          console.log("🎭 Guest user created");
          setIsAuthenticated(true);
          setIsGuest(true);
        }
      } catch (error: any) {
        console.error(
          "❌ Error checking auth status:",
          error.message,
          error.stack,
        );
        try {
          await apiClient.createGuestSession();
          setIsAuthenticated(true);
          setIsGuest(true);
        } catch (guestError: any) {
          console.error(
            "❌ Failed to create guest session:",
            guestError.message,
          );
          setIsAuthenticated(false);
          setIsGuest(true);
        }
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthStatus();
    requestImagePermissions();
  }, []);

  useEffect(() => {
    if (currentScreen === "summary") {
      setShowConfirmModal(true);
    }
  }, [currentScreen]);

  // NEW FUNCTION: Fetch available time slots
  const fetchAvailableTimeSlots = useCallback(
    async (date: Date, staffId?: string | null) => {
      if (!date) return;

      try {
        setLoadingSlots(true);

        const dateString = date.toISOString().split("T")[0];
        console.log(
          "📅 Fetching available slots for:",
          dateString,
          "Staff:",
          staffId,
        );

        const response = await apiClient.getAvailableTimeSlots(
          dateString,
          staffId,
        );

        if (response.success) {
          console.log("✅ Available slots:", response.availableSlots);
          console.log("❌ Booked slots:", response.bookedSlots);

          setAvailableSlots(response.availableSlots || []);
          setBookedSlots(response.bookedSlots || []);
        } else {
          console.warn("⚠️ No available slots data, using default slots");
          // Fallback to all slots if API fails
          const allSlots = generateTimeSlots();
          setAvailableSlots(allSlots);
          setBookedSlots([]);
        }
      } catch (error: any) {
        console.error("❌ Error fetching available slots:", error.message);
        // Fallback to all slots
        const allSlots = generateTimeSlots();
        setAvailableSlots(allSlots);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [],
  );

  // NEW FUNCTION: Check if time slot is available
  const isTimeSlotAvailable = (time: string): boolean => {
    // If no available slots data yet, assume all slots are available
    if (availableSlots.length === 0 && bookedSlots.length === 0) {
      return true;
    }

    // Check if the time is in the available slots and not in booked slots
    const isAvailable =
      availableSlots.includes(time) && !bookedSlots.includes(time);
    console.log(`⏰ Slot ${time} available:`, isAvailable);
    return isAvailable;
  };

  // UPDATE: Date selection to fetch availability
  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes

    // Determine staff ID based on selection
    const staffId =
      stylistSelectionType === "specific" &&
      selectedStylist &&
      selectedStylist !== "any"
        ? selectedStylist
        : undefined;

    await fetchAvailableTimeSlots(date, staffId);
  };

  // UPDATE: Stylist selection functions to handle availability
  const handleAnyStylistSelect = async () => {
    setStylistSelectionType("any");
    setSelectedStylist("any");

    // Randomly assign a stylist when "Any Stylist" is selected
    if (stylists.length > 0) {
      const randomIndex = Math.floor(Math.random() * stylists.length);
      const randomStylist = stylists[randomIndex];
      setSelectedStylist(randomStylist._id);
    }

    // If date is already selected, refetch available slots for any stylist
    if (selectedDate) {
      await fetchAvailableTimeSlots(selectedDate, null);
    }
  };

  const handleYourStylistSelect = async () => {
    setStylistSelectionType("specific");
    setSelectedStylist(null); // Reset specific selection

    // If date is already selected, clear available slots until specific stylist is selected
    if (selectedDate) {
      setAvailableSlots([]);
      setBookedSlots([]);
    }
  };

  const handleSpecificStylistSelect = async (stylistId: string) => {
    setSelectedStylist(stylistId);

    // If date is already selected, refetch available slots for this stylist
    if (selectedDate) {
      await fetchAvailableTimeSlots(selectedDate, stylistId);
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!currentPaymentId) {
      console.log("⚠️ [POLL] No payment ID, skipping check");
      return;
    }

    try {
      console.log("🔄 [POLL] Checking payment status for:", currentPaymentId);

      const statusResponse = await apiClient.getPaymentStatus(currentPaymentId);

      console.log(
        "📥 [POLL] Status response:",
        JSON.stringify(statusResponse, null, 2),
      );

      if (statusResponse && statusResponse.success && statusResponse.data) {
        const status = statusResponse.data.status;

        console.log("📊 [POLL] Payment status from server:", status);
        console.log("📊 [POLL] Current local status:", paymentStatus);

        // ✅ Check for BOTH "approved" AND "completed"
        if (status === "approved" || status === "completed") {
          console.log(
            "✅✅✅ [POLL] Status is APPROVED/COMPLETED - updating UI!",
          );
          setPaymentStatus("approved");
          setPaymentStatusMessage(
            statusResponse.data.processingNotes ||
              "You're all booked! We look forward to seeing you soon.",
          );
        } else if (status === "denied") {
          console.log("❌ [POLL] Status is DENIED - updating UI");
          setPaymentStatus("denied");
          setPaymentStatusMessage(
            statusResponse.data.processingNotes ||
              "Your payment transaction has failed. Please check the proof of payment attached.",
          );
        } else if (status === "processing") {
          console.log("⏳ [POLL] Status still PROCESSING");
          if (paymentStatus !== "processing") {
            setPaymentStatus("processing");
          }
        } else {
          console.log("⚠️ [POLL] Unknown status:", status);
        }
      } else {
        console.error("❌ [POLL] Invalid response structure:", statusResponse);
      }
    } catch (error: any) {
      console.error(
        "❌ [POLL] Error checking payment status:",
        error.message,
        error.stack,
      );
    }
  }, [currentPaymentId, paymentStatus]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    console.log(
      "🎯 [POLLING SETUP] Screen:",
      currentScreen,
      "Payment ID:",
      currentPaymentId,
      "Status:",
      paymentStatus,
    );

    if (
      currentScreen === "status" &&
      currentPaymentId &&
      paymentStatus === "processing"
    ) {
      console.log("✅ [POLLING SETUP] Starting polling every 3 seconds");

      // Check immediately
      checkPaymentStatus();

      // Then check every 3 seconds
      interval = setInterval(() => {
        console.log("⏰ [POLLING] Interval tick - checking status");
        checkPaymentStatus();
      }, 3000);
    } else {
      console.log("⏹️ [POLLING SETUP] Polling not started:", {
        isStatusScreen: currentScreen === "status",
        hasPaymentId: !!currentPaymentId,
        isProcessing: paymentStatus === "processing",
      });
    }

    return () => {
      if (interval) {
        console.log("🛑 [POLLING CLEANUP] Stopping polling");
        clearInterval(interval);
      }
    };
  }, [currentScreen, currentPaymentId, paymentStatus, checkPaymentStatus]);

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to upload payment proof.",
      );
    }
  };

  const handleBack = () => {
    const idx = screens.indexOf(currentScreen);
    if (idx === 0) {
      router.back();
    } else {
      setCurrentScreen(screens[idx - 1]);
    }
  };

  const handleContinueFromDetails = async () => {
    if (!selectedService) return;

    try {
      setLoading(true);
      const stylistsResponse = await apiClient.getStylists();
      if (stylistsResponse.success) {
        setStylists(stylistsResponse.data);
      }
      setCurrentScreen("stylist");
    } catch (error: any) {
      console.error("Error fetching stylists:", error.message, error.stack);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load stylists.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromStylist = async () => {
    if (!stylistSelectionType) {
      Toast.show({
        type: "error",
        text1: "Selection Required",
        text2: "Please select a stylist preference.",
      });
      return;
    }

    if (stylistSelectionType === "specific" && !selectedStylist) {
      Toast.show({
        type: "error",
        text1: "Selection Required",
        text2: "Please select your preferred stylist.",
      });
      return;
    }

    try {
      setLoading(true);
      setCurrentScreen("datetime");
    } catch (error: any) {
      console.error("Error fetching time slots:", error.message, error.stack);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load available times.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDateTime = () => {
    if (!selectedDate || !selectedTime) {
      Toast.show({
        type: "error",
        text1: "Selection Required",
        text2: "Please select both date and time.",
      });
      return;
    }

    // NEW: Check if selected time is available
    if (!isTimeSlotAvailable(selectedTime)) {
      Toast.show({
        type: "error",
        text1: "Time Not Available",
        text2: "Please select an available time slot.",
      });
      return;
    }

    setCurrentScreen("summary");
  };

  // Calculate payment amounts based on payment option
  const calculatePaymentAmounts = () => {
    if (!selectedService)
      return { downpaymentAmount: 0, remainingAmount: 0, totalAmount: 0 };

    const servicePrice =
      parseInt(selectedService.priceRange.replace(/[^0-9]/g, "")) || 0;

    if (paymentOption === "full") {
      return {
        downpaymentAmount: 0,
        remainingAmount: 0,
        totalAmount: servicePrice,
        displayAmount: `₱${servicePrice}.00`,
      };
    } else {
      // 30% downpayment
      const downpaymentAmount = Math.round(servicePrice * 0.3);
      const remainingAmount = servicePrice - downpaymentAmount;
      return {
        downpaymentAmount,
        remainingAmount,
        totalAmount: servicePrice,
        displayAmount: `₱${downpaymentAmount}.00 (30% downpayment)`,
      };
    }
  };

  const handleProceedToPayment = async (
    selectedPaymentOption: "full" | "downpayment" = "full",
  ) => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please complete all booking details.",
      });
      return;
    }

    // NEW: Check if selected time is still available
    if (!isTimeSlotAvailable(selectedTime)) {
      Toast.show({
        type: "error",
        text1: "Time No Longer Available",
        text2:
          "The selected time slot has been taken. Please choose another time.",
      });
      return;
    }

    if (!authChecked) {
      Toast.show({
        type: "error",
        text1: "Please Wait",
        text2: "Checking authentication status...",
      });
      return;
    }

    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to create a booking.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => router.push("/(auth)") },
      ]);
      return;
    }

    if (isGuest) {
      Alert.alert(
        "Complete Registration",
        "Please complete your profile to create a booking.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Complete Profile",
            onPress: () => router.push("/(auth)/SignUp"),
          },
        ],
      );
      return;
    }

    try {
      setLoading(true);

      const currentUser = await apiClient.getCurrentUser();
      console.log("👤 Current user for booking:", currentUser);

      if (!currentUser.user || currentUser.user.isGuest) {
        throw new Error("Invalid user session. Please log in again.");
      }

      // FIXED: Proper time formatting for HH:MM AM/PM format
      if (!selectedTime) {
        throw new Error("Time is required. Please select a time.");
      }

      // Convert the time to proper HH:MM AM/PM format
      let formattedTime = selectedTime.trim();

      // Ensure proper format (e.g., "9:30 AM" -> "09:30 AM")
      const timeParts = formattedTime.split(" ");
      if (timeParts.length === 2) {
        const [time, period] = timeParts;
        const [hours, minutes] = time.split(":");

        // Pad single-digit hours with leading zero
        const paddedHours = hours.padStart(2, "0");
        // Ensure minutes are always 2 digits
        const paddedMinutes = (minutes || "00").padStart(2, "0");

        formattedTime = `${paddedHours}:${paddedMinutes} ${period.toUpperCase()}`;
      }

      // Final validation - must match HH:MM AM/PM format exactly
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/;
      if (!timeRegex.test(formattedTime)) {
        console.error(
          "❌ Invalid time format after processing:",
          formattedTime,
        );
        throw new Error(
          `Invalid time format: "${selectedTime}". Please select a valid time like "09:30 AM".`,
        );
      }

      console.log("🕒 DEBUG - Original time:", selectedTime);
      console.log("🕒 DEBUG - Formatted time for API:", formattedTime);

      const bookingData = {
        serviceId: selectedService._id,
        stylistPreference: stylistSelectionType === "any" ? "any" : "specific",
        selectedStylistId:
          selectedStylist && selectedStylist !== "any"
            ? selectedStylist
            : undefined,
        preferredDate: selectedDate.toISOString().split("T")[0],
        preferredTime: formattedTime, // Use the properly formatted time
        customerNotes: "",
        paymentOption: selectedPaymentOption,
        downpaymentPercentage: selectedPaymentOption === "downpayment" ? 30 : 0,
      };

      console.log(
        "📤 Sending booking data to API:",
        JSON.stringify(bookingData, null, 2),
      );

      const bookingResponse =
        await apiClient.createBookingWithPaymentOption(bookingData);

      console.log("📥 Booking response:", bookingResponse);

      if (bookingResponse && bookingResponse.success) {
        setCurrentBookingId(bookingResponse.data._id);

        if (paymentType === "salon") {
          setPaymentStatus("approved");
          setPaymentStatusMessage(
            selectedPaymentOption === "downpayment"
              ? "Your appointment has been recorded with 30% downpayment. Pay remaining at salon."
              : "Your appointment has been recorded. Pay at the salon.",
          );
          setCurrentScreen("status");
        } else {
          setCurrentScreen("payment");
        }
        Toast.show({
          type: "success",
          text1: "Booking Created",
          text2: `Your appointment has been scheduled with ${
            selectedPaymentOption === "downpayment"
              ? "30% downpayment"
              : "full payment"
          }!`,
        });
      } else {
        throw new Error(
          bookingResponse?.message ||
            "Failed to create booking - no response data",
        );
      }
    } catch (error: any) {
      console.error("❌ Error creating booking:", error.message, error.stack);

      if (
        error.message.includes("User not found") ||
        error.message.includes("Access denied") ||
        error.message.includes("Invalid user session") ||
        error.message.includes("unauthorized") ||
        error.message.includes("token") ||
        error.message.includes("Authentication") ||
        error.message.includes("Session expired")
      ) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        setIsAuthenticated(false);
        setIsGuest(true);
        setAuthChecked(true);

        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => router.push("/(auth)") },
          ],
        );
      } else if (error.message.includes("Network error")) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again.",
          [{ text: "OK", style: "default" }],
        );
      } else if (
        error.message.includes("Invalid time format") ||
        error.message.includes("Time must be in HH:MM AM/PM format")
      ) {
        Alert.alert(
          "Invalid Time Format",
          error.message ||
            "Please select a valid time for your appointment in the format HH:MM AM/PM (e.g., 9:30 AM).",
          [
            {
              text: "OK",
              style: "default",
              onPress: () => setCurrentScreen("datetime"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Booking Failed",
          error.message ||
            "There was a problem creating your booking. Please try again.",
          [
            { text: "OK", style: "default" },
            { text: "Try Again", onPress: () => setCurrentScreen("summary") },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!currentBookingId || !paymentMethod) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Booking or payment method is missing.",
      });
      return;
    }

    try {
      setLoading(true);

      // Get booking details to determine payment type
      const bookingResponse = await apiClient.getBookingById(currentBookingId);
      const booking = bookingResponse.data;

      const paymentFor =
        booking.paymentOption === "downpayment" ? "downpayment" : "full";

      const paymentResponse = await apiClient.createPaymentForBooking({
        bookingId: currentBookingId,
        paymentMethod: paymentMethod,
        paymentFor: paymentFor,
      });

      console.log(
        "🔍 Full payment response:",
        JSON.stringify(paymentResponse, null, 2),
      );

      if (paymentResponse && paymentResponse.success && paymentResponse.data) {
        const paymentId = paymentResponse.data._id;

        if (paymentId) {
          console.log("✅ Setting payment ID:", paymentId);
          setCurrentPaymentId(paymentId);
          setPaymentStatus("processing");
          setCurrentScreen("receipt");
        } else {
          console.error(
            "❌ No payment ID found in response:",
            paymentResponse.data,
          );
          throw new Error("Failed to get payment ID from server");
        }
      } else {
        throw new Error(paymentResponse?.message || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("❌ Error creating payment:", error);
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message || "Failed to create payment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0]);
        Toast.show({
          type: "success",
          text1: "Image Selected",
          text2: "Payment proof image has been selected.",
        });
      }
    } catch (error: any) {
      console.error("Error picking image:", error.message, error.stack);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to select image.",
      });
    }
  };

  const handleContinueToPersonalInfo = () => {
    if (!proofImage) {
      Toast.show({
        type: "error",
        text1: "Missing Proof",
        text2: "Please upload payment proof.",
      });
      return;
    }
    setCurrentScreen("receiptInfo");
  };

  const handleEditReference = () => {
    Alert.prompt(
      "Edit Reference Number",
      "Enter the reference number:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: (newRef: string | undefined) => {
            if (newRef && newRef.trim()) {
              setReceiptData((prev) => ({ ...prev, referenceNumber: newRef }));
            }
          },
        },
      ],
      "plain-text",
      receiptData.referenceNumber,
    );
  };

  const handleEditName = () => {
    Alert.prompt(
      "Edit Name",
      "Enter your name:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: (newName: string | undefined) => {
            if (newName && newName.trim()) {
              setReceiptData((prev) => ({ ...prev, name: newName }));
            }
          },
        },
      ],
      "plain-text",
      receiptData.name,
    );
  };

  const handleEditAmount = () => {
    const currentAmount = receiptData.amountPaid.replace(/[^0-9]/g, "");
    Alert.prompt(
      "Edit Amount",
      "Enter the amount paid (numbers only):",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: (newAmount: string | undefined) => {
            if (newAmount && !isNaN(parseFloat(newAmount))) {
              setReceiptData((prev) => ({ ...prev, amountPaid: newAmount }));
            } else if (newAmount) {
              Toast.show({
                type: "error",
                text1: "Invalid Amount",
                text2: "Please enter numbers only for the amount.",
              });
            }
          },
        },
      ],
      "plain-text",
      currentAmount,
    );
  };

  const handleSubmitProof = async () => {
    if (!currentPaymentId) {
      Toast.show({
        type: "error",
        text1: "Missing Payment ID",
        text2: "Payment ID is missing. Please try again.",
      });
      return;
    }

    if (!proofImage) {
      Toast.show({
        type: "error",
        text1: "Missing Proof",
        text2: "Please upload payment proof.",
      });
      return;
    }

    if (
      !receiptData.referenceNumber ||
      !receiptData.name ||
      !receiptData.amountPaid ||
      !receiptData.dateOfTransaction
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all payment details.",
      });
      return;
    }

    try {
      setUploadingProof(true);

      console.log("=== UPLOAD DEBUG INFO ===");
      console.log("Payment ID:", currentPaymentId);
      console.log("Image URI:", proofImage.uri);
      console.log("Image details:", {
        uri: proofImage.uri,
        type: proofImage.type,
        mimeType: proofImage.mimeType,
        fileName: proofImage.fileName,
        fileSize: proofImage.fileSize,
        width: proofImage.width,
        height: proofImage.height,
      });
      console.log("Receipt data:", receiptData);
      console.log("========================");

      const formData = new FormData();

      const imageFile = {
        uri:
          Platform.OS === "ios"
            ? proofImage.uri.replace("file://", "")
            : proofImage.uri,
        type: proofImage.mimeType || proofImage.type || "image/jpeg",
        name: proofImage.fileName || "payment-proof.jpg",
      };

      console.log("📸 Image file object:", imageFile);

      formData.append("proofImage", imageFile as any);
      formData.append("referenceNumber", receiptData.referenceNumber);
      formData.append("name", receiptData.name);
      formData.append("amountPaid", receiptData.amountPaid);
      formData.append("dateOfTransaction", receiptData.dateOfTransaction);

      console.log(
        "📤 FormData prepared, uploading to payment ID:",
        currentPaymentId,
      );

      const uploadResponse = await apiClient.uploadProofOfPayment(
        currentPaymentId,
        formData,
      );

      console.log("📥 Upload response:", uploadResponse);

      if (uploadResponse.success) {
        setPaymentStatus("processing");
        setCurrentScreen("status");

        Toast.show({
          type: "success",
          text1: "Proof Submitted",
          text2: "Your payment is being verified.",
        });

        setTimeout(() => {
          checkPaymentStatus();
        }, 2000);
      } else {
        throw new Error(uploadResponse.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("❌ Error uploading proof:", error.message);
      console.error("Error stack:", error.stack);

      let errorMessage = "Failed to upload payment proof.";

      if (error.message.includes("Network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Upload timed out. Please try again.";
      } else if (
        error.message.includes("server") ||
        error.message.includes("500")
      ) {
        errorMessage = "Server error. Please try again later.";
      } else if (
        error.message.includes("Authentication") ||
        error.message.includes("token")
      ) {
        errorMessage = "Session expired. Please log in again.";
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: errorMessage,
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRetryPayment = () => {
    setReceiptData({
      referenceNumber: "",
      name: "",
      amountPaid: "",
      dateOfTransaction: "",
    });
    setProofImage(null);
    setPaymentStatus("idle");
    setCurrentScreen("receipt");
  };

  const handleChangePaymentMethod = () => {
    setCurrentScreen("payment");
    setPaymentStatus("idle");
  };

  const handleBackToServices = () => {
    setSelectedStylist(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCurrentBookingId(null);
    setCurrentPaymentId(null);
    setProofImage(null);
    setReceiptData({
      referenceNumber: "",
      name: "",
      amountPaid: "",
      dateOfTransaction: "",
    });
    setPaymentStatus("idle");
    // NEW: Reset availability states
    setAvailableSlots([]);
    setBookedSlots([]);
    setLoadingSlots(false);
    router.back();
  };

  // Generate time slots in proper HH:MM AM/PM format - FIXED VERSION
  const generateTimeSlots = () => {
    const timeSlots = [
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
      "05:00 PM",
      "05:30 PM",
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM",
    ];

    return timeSlots;
  };

  // Get safe rating data for service - FIXED VERSION
  const getSafeRating = (service: Service) => {
    try {
      if (!service.rating) {
        return {
          average: 0,
          totalRaters: 0,
          breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const rating = service.rating;
      return {
        average: typeof rating.average === "number" ? rating.average : 0,
        totalRaters:
          typeof rating.totalRaters === "number"
            ? rating.totalRaters
            : service.totalRaters || 0, // Fallback to service.totalRaters
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

  // NEW COMPONENT: Time Slot Button with availability
  const TimeSlotButton = ({
    time,
    isSelected,
    onSelect,
    isAvailable,
  }: {
    time: string;
    isSelected: boolean;
    onSelect: (time: string) => void;
    isAvailable: boolean;
  }) => {
    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.timeSlotActive,
          !isAvailable && styles.timeSlotUnavailable,
        ]}
        onPress={() => isAvailable && onSelect(time)}
        disabled={!isAvailable}>
        <Text
          style={[
            styles.timeSlotText,
            isSelected && styles.timeSlotTextActive,
            !isAvailable && styles.timeSlotTextUnavailable,
          ]}>
          {time}
        </Text>
        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // NEW COMPONENT: Terms & Policies Overlay with ACTUAL CONTENT
  const TermsAndPoliciesOverlay = () => (
    <Modal
      visible={showTermsOverlay}
      transparent={true}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.overlayContainer}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>Terms & Policies</Text>
          <TouchableOpacity
            onPress={() => setShowTermsOverlay(false)}
            style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.overlayContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.termsContent}>
            <Text style={styles.mainTitle}>TERMS & CONDITIONS</Text>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Data Privacy Policy</Text>
              <Text style={styles.termText}>
                All personal and appointment data is handled according to our
                Privacy Policy. We do not share your information without
                consent.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>User Registration</Text>
              <Text style={styles.termText}>
                Clients must create an account to book appointments. You are
                responsible for maintaining the accuracy of your personal
                information and securing your account credentials.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Late Arrivals</Text>
              <Text style={styles.termText}>
                Arriving 15 minutes or more after your appointment time may
                result in cancellation or delay accommodation to the service.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Health and Safety</Text>
              <Text style={styles.termText}>
                Clients are expected to inform staff of any medical conditions,
                allergies, or sensitivities. The salon is not liable for adverse
                reactions not disclosed beforehand.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Prohibited Behavior</Text>
              <Text style={styles.termText}>
                We reserve the right to refuse service to anyone who is abusive,
                intoxicated, or violates salon policies.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>30% Down Payment Requirement</Text>
              <Text style={styles.termText}>
                By making a reservation, you agree to pay a non-refundable 30%
                down payment to secure your chosen schedule. Your booking will
                only be confirmed once the down payment has been successfully
                submitted and verified by the admin.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>System Availability</Text>
              <Text style={styles.termText}>
                We aim to keep the system online and functional but cannot
                guarantee uninterrupted access due to maintenance or technical
                issues.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Modifications to Terms</Text>
              <Text style={styles.termText}>
                These Terms and Conditions may be updated at any time. Continued
                use of the platform implies acceptance of the current version.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>
                Payment and Order Approval Terms
              </Text>
              <Text style={styles.termText}>
                By submitting a booking or placing an order, you agree that your
                payment will initially be marked as pending until the admin
                verifies the proof of payment you provide. If the proof is
                correct, the payment will be approved; if incorrect, the payment
                will be denied, and the order or booking will not be processed.
              </Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>Unsuitable Conditions</Text>
              <Text style={styles.termText}>
                Services may be declined if a clients hair, skin, or nails are
                in unsuitable condition for treatment. Conditions such as
                excessive damage, infections, allergies, or active skin
                conditions may prevent certain treatments for safety. Clients
                should inform the salon of any concerns before booking services.
              </Text>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Contact Information</Text>
              <View style={styles.contactItem}>
                <Ionicons name="business-outline" size={16} color="#619AE4" />
                <Text style={styles.contactText}>SandreaLee Salon</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={16} color="#619AE4" />
                <Text style={styles.contactText}>
                  2184 Loyola St, Sampaloc, Manila
                </Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={16} color="#619AE4" />
                <Text style={styles.contactText}>+63 992 5433 570</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={16} color="#619AE4" />
                <Text style={styles.contactText}>info@sandrealee.com</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.overlayFooter}>
          <TouchableOpacity
            onPress={() => setShowTermsOverlay(false)}
            style={styles.agreeButton}>
            <Text style={styles.agreeButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // NEW COMPONENT: Receipt Overlay
  const ReceiptOverlay = () => {
    if (!selectedService) return null;

    const servicePrice =
      parseInt(selectedService.priceRange.replace(/[^0-9]/g, "")) || 0;
    const paymentAmounts = calculatePaymentAmounts();

    return (
      <Modal
        visible={showReceiptOverlay}
        transparent={true}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.overlayContainer}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>Booking Receipt</Text>
            <TouchableOpacity
              onPress={() => setShowReceiptOverlay(false)}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.overlayContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.receiptHeader}>
              <Text style={styles.salonName}>SandreaLee Salon</Text>
              <Text style={styles.receiptSubtitle}>
                2184 Loyola St, Sampaloc, Manila
              </Text>
              <Text style={styles.receiptSubtitle}>+63 992 5433 570</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>Booking Reference</Text>
              <Text style={styles.receiptValue}>
                {currentBookingId ||
                  "BK-" + Math.random().toString(36).substr(2, 9).toUpperCase()}
              </Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>Customer Name</Text>
              <Text style={styles.receiptValue}>
                {receiptData.name || "James"}
              </Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>Service Date & Time</Text>
              <Text style={styles.receiptValue}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {selectedTime}
              </Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.receiptLabel}>Service</Text>
              <Text style={styles.receiptValue}>{selectedService.name}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.pricingSection}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service Fee</Text>
                <Text style={styles.pricingValue}>₱{servicePrice}.00</Text>
              </View>

              {paymentOption === "downpayment" && (
                <>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Downpayment (30%)</Text>
                    <Text style={styles.pricingValue}>
                      ₱{paymentAmounts.downpaymentAmount}.00
                    </Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Remaining Balance</Text>
                    <Text style={styles.pricingValue}>
                      ₱{paymentAmounts.remainingAmount}.00
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={styles.pricingValue}>₱0.00</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {paymentOption === "downpayment"
                    ? "Amount Paid"
                    : "Total Amount"}
                </Text>
                <Text style={styles.totalValue}>
                  {paymentOption === "downpayment"
                    ? `₱${paymentAmounts.downpaymentAmount}.00`
                    : `₱${servicePrice}.00`}
                </Text>
              </View>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.paymentInfoSection}>
              <Text style={styles.paymentMethod}>
                Payment Method:{" "}
                {paymentMethod === "gcash"
                  ? "GCash"
                  : paymentMethod === "paymaya"
                    ? "PayMaya"
                    : paymentMethod === "paypal"
                      ? "PayPal"
                      : "Credit/Debit Card"}
              </Text>
              <Text style={styles.paymentStatus}>
                Status:{" "}
                {paymentStatus === "approved"
                  ? "Approved"
                  : paymentStatus === "processing"
                    ? "Processing"
                    : paymentStatus === "denied"
                      ? "Denied"
                      : "Pending"}
              </Text>
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Important Notes:</Text>
              <Text style={styles.notesText}>
                • Please arrive 10 minutes before your scheduled appointment
              </Text>
              <Text style={styles.notesText}>
                • Bring valid ID for verification
              </Text>
              <Text style={styles.notesText}>
                • Cancellations must be made 24 hours in advance
              </Text>
              {paymentOption === "downpayment" && (
                <Text style={styles.notesText}>
                  • Remaining balance of ₱{paymentAmounts.remainingAmount}.00
                  payable at salon
                </Text>
              )}
            </View>

            <View style={styles.thankYouSection}>
              <Text style={styles.thankYouText}>
                Thank you for choosing SandreaLee Salon!
              </Text>
            </View>
          </ScrollView>

          <View style={styles.overlayFooter}>
            <TouchableOpacity
              onPress={() => setShowReceiptOverlay(false)}
              style={styles.closeReceiptButton}>
              <Text style={styles.closeReceiptButtonText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // SERVICE DETAILS SCREEN
  const ServiceDetailsScreen = () => {
    if (!selectedService) return null;

    const safeRating = getSafeRating(selectedService);
    const averageRating = safeRating.average;
    const totalRaters = safeRating.totalRaters;

    const getCategoryImage = () => {
      const category = selectedService.category;
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
      return categoryImages[category] || images.profile;
    };

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Service Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.bookingScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.serviceDetailsContainer}>
            <View style={styles.salonImageContainer}>
              <Image
                source={getCategoryImage()}
                style={styles.categoryImageLarge}
              />
            </View>

            <Text style={styles.salonNameLarge}>SandreaLee Salon</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.addressTextSmall}>
                2184 Loyola St, Sampaloc, Manila
              </Text>
            </View>
            <View style={styles.ratingRowLarge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingTextLarge}>5.0 (1,000 reviews)</Text>
            </View>

            <View style={[styles.serviceInfoCard, styles.cardShadow]}>
              <Text style={styles.detailServiceTitle}>
                {selectedService.name}
              </Text>
              <View style={styles.serviceMetaInfo}>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="time-outline" size={16} color="#619AE4" />
                  <Text style={styles.serviceMetaText}>
                    {selectedService.duration}
                  </Text>
                </View>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="cash-outline" size={16} color="#619AE4" />
                  <Text style={styles.servicePriceText}>
                    {selectedService.priceRange}
                  </Text>
                </View>
                <View style={styles.serviceMetaItem}>
                  <Ionicons name="star" size={16} color="#619AE4" />
                  <Text style={styles.serviceMetaText}>
                    {averageRating > 0
                      ? averageRating.toFixed(1)
                      : "No ratings"}{" "}
                    ({totalRaters} reviews)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tabsContainer}>
              {["About", "Service", "Discounts", "Review"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab.toLowerCase())}
                  style={[
                    styles.tabButton,
                    selectedTab === tab.toLowerCase() && styles.tabButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab.toLowerCase() && styles.tabTextActive,
                    ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedTab === "about" && (
              <View style={styles.tabContent}>
                <Text style={styles.aboutText}>
                  Experience the perfect blend of artistry and luxury with
                  SandreaLee Salon&apos;s expert services. From haircuts to spa
                  treatments, we provide personalized care tailored just for
                  you.
                </Text>
                <View style={[styles.openingHoursCard, styles.cardShadow]}>
                  <View style={styles.openingHoursHeader}>
                    <Ionicons name="time-outline" size={20} color="#619AE4" />
                    <Text style={styles.openingHoursTitle}>Opening Hours</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Monday - Friday</Text>
                    <Text style={styles.hoursTime}>9:30 AM - 8:30 PM</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Saturday - Sunday</Text>
                    <Text style={styles.hoursTime}>9:30 AM - 8:30 PM</Text>
                  </View>
                </View>
              </View>
            )}

            {selectedTab === "service" && (
              <View style={styles.tabContent}>
                <View style={[styles.serviceDetailCard, styles.cardShadow]}>
                  <Text style={styles.serviceDescriptionTitle}>
                    Service Description
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {`Our expert ${selectedService.name} service provides top-quality results with attention to detail and customer satisfaction.`}
                  </Text>

                  <View style={styles.featuresList}>
                    <Text style={styles.featuresTitle}>Whats Included:</Text>
                    <View style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#22C55E"
                      />
                      <Text style={styles.featureText}>
                        Professional service execution
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#22C55E"
                      />
                      <Text style={styles.featureText}>
                        Quality products used
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#22C55E"
                      />
                      <Text style={styles.featureText}>
                        Expert consultation
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {selectedTab === "discounts" && (
              <View style={styles.tabContent}>
                <Text style={styles.noDiscountsText}>
                  You don&apos;t have any discounts
                </Text>
              </View>
            )}

            {selectedTab === "review" && (
              <View style={styles.tabContent}>
                <View style={styles.reviewSummary}>
                  <Text style={styles.reviewCount}>1K reviews on</Text>
                  <View style={styles.starsRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name="star" size={20} color="#FFD700" />
                    ))}
                  </View>
                  <Text style={styles.averageRating}>4.9</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleContinueFromDetails}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // STYLIST SELECTION SCREEN
  const StylistSelectionScreen = () => {
    // Function to get full image URL
    const getFullImageUrl = (imagePath: string | undefined) => {
      if (!imagePath) return null;

      // If it's already a full URL (from external source like DiceBear), return as is
      if (imagePath.startsWith("http")) {
        return imagePath;
      }

      // If it's a local upload path, construct the full URL
      if (imagePath.startsWith("/uploads/")) {
        return `http://10.74.230.139:3000${imagePath}`;
      }

      return null;
    };

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Choose Your Stylist</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.bookingScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.stylistContainer}>
            {/* Any Stylist Option */}
            <TouchableOpacity
              style={[
                styles.stylistOption,
                stylistSelectionType === "any" && styles.stylistOptionActive,
              ]}
              onPress={handleAnyStylistSelect}>
              <View style={styles.stylistIconContainer}>
                <Ionicons name="people-outline" size={24} color="#619AE4" />
              </View>
              <View style={styles.stylistInfo}>
                <Text style={styles.stylistName}>Any Stylist</Text>
                <Text style={styles.stylistSubtext}>
                  Next available stylist
                </Text>
              </View>
              {stylistSelectionType === "any" && (
                <Ionicons name="checkmark-circle" size={20} color="#619AE4" />
              )}
            </TouchableOpacity>

            {/* Your Stylist Option */}
            <TouchableOpacity
              style={[
                styles.stylistOption,
                stylistSelectionType === "specific" &&
                  styles.stylistOptionActive,
              ]}
              onPress={handleYourStylistSelect}>
              <View style={styles.stylistIconContainer}>
                <Ionicons name="person-outline" size={24} color="#619AE4" />
              </View>
              <View style={styles.stylistInfo}>
                <Text style={styles.stylistName}>Your Stylist</Text>
                <Text style={styles.stylistSubtext}>Choose per service</Text>
              </View>
              {stylistSelectionType === "specific" && (
                <Ionicons name="checkmark-circle" size={20} color="#619AE4" />
              )}
            </TouchableOpacity>

            {/* Specific Stylist List - Only show when "Your Stylist" is selected */}
            {stylistSelectionType === "specific" &&
              stylists.map((stylist) => {
                const fullImageUrl = getFullImageUrl(stylist.profileImage);

                return (
                  <TouchableOpacity
                    key={stylist._id}
                    style={[
                      styles.stylistOption,
                      selectedStylist === stylist._id &&
                        styles.stylistOptionActive,
                    ]}
                    onPress={() => handleSpecificStylistSelect(stylist._id)}>
                    <View style={styles.stylistImageContainer}>
                      {fullImageUrl ? (
                        <Image
                          source={{ uri: fullImageUrl }}
                          style={styles.stylistImage}
                          onError={(e) => {
                            console.log(
                              "❌ Image load error:",
                              e.nativeEvent.error,
                            );
                            console.log("Failed URL:", fullImageUrl);
                          }}
                          onLoad={() =>
                            console.log(
                              "✅ Image loaded successfully:",
                              fullImageUrl,
                            )
                          }
                        />
                      ) : (
                        <View style={styles.stylistAvatar}>
                          <Text style={styles.stylistInitial}>
                            {stylist.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.stylistInfo}>
                      <Text style={styles.stylistName}>{stylist.username}</Text>
                      <Text style={styles.stylistSubtext}>
                        {stylist.position}
                      </Text>
                      {stylist.rating && (
                        <View style={styles.stylistRating}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.stylistRatingText}>
                            {stylist.rating} ({stylist.reviewCount || 0})
                          </Text>
                        </View>
                      )}
                    </View>
                    {stylist.topRated && (
                      <View style={styles.topRatedBadge}>
                        <Ionicons name="star" size={10} color="#1F2937" />
                        <Text style={styles.topRatedText}>Top Rated</Text>
                      </View>
                    )}
                    {selectedStylist === stylist._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#619AE4"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleContinueFromStylist}
            disabled={
              !stylistSelectionType ||
              (stylistSelectionType === "specific" && !selectedStylist)
            }>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.continueButton,
                (!stylistSelectionType ||
                  (stylistSelectionType === "specific" && !selectedStylist)) &&
                  styles.continueButtonDisabled,
              ]}>
              <Text style={styles.continueButtonText}>
                {stylistSelectionType === "any"
                  ? "Continue with Any Stylist"
                  : stylistSelectionType === "specific"
                    ? "Select and Continue"
                    : "Select and Continue"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // DATE & TIME SELECTION SCREEN - UPDATED WITH AVAILABILITY
  const DateTimeSelectionScreen = () => {
    const getNextDays = (count: number) => {
      const days = [];
      for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        days.push(date);
      }
      return days;
    };

    const nextDays = getNextDays(7);

    const onChangeDate = (event: any, selected: Date | undefined) => {
      setShowDatePicker(Platform.OS === "ios");
      if (selected) {
        handleDateSelect(selected);
      }
    };

    // Use generated time slots but filter by availability
    const allTimeSlots = generateTimeSlots();

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Date and Time</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.bookingScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.dateTimeContainer}>
            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
                contentContainerStyle={styles.dateScrollContent}>
                {nextDays.map((date, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dateButton,
                      selectedDate?.toDateString() === date.toDateString() &&
                        styles.dateButtonActive,
                    ]}
                    onPress={() => handleDateSelect(date)}>
                    <Text style={styles.dateDayText}>
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </Text>
                    <Text style={styles.dateMonthText}>
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </Text>
                    <Text style={styles.dateNumberText}>{date.getDate()}</Text>
                    <View style={styles.durationContainer}>
                      <Ionicons name="time-outline" size={10} color="#9CA3AF" />
                      <Text style={styles.durationText}>1 hour</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.moreDatesButton}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.moreDatesText}>More dates</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Time Selection - UPDATED WITH AVAILABILITY */}
            <View style={styles.timeSection}>
              <View style={styles.timeSectionHeader}>
                <Text style={styles.sectionTitle}>Select Time</Text>
                {loadingSlots && (
                  <View style={styles.loadingSlotsContainer}>
                    <ActivityIndicator size="small" color="#619AE4" />
                    <Text style={styles.loadingSlotsText}>
                      Checking availability...
                    </Text>
                  </View>
                )}
              </View>

              {selectedDate && (
                <View style={styles.availabilityInfo}>
                  <Text style={styles.availabilityText}>
                    {stylistSelectionType === "specific" &&
                    selectedStylist &&
                    selectedStylist !== "any"
                      ? `Available times for ${
                          stylists.find((s) => s._id === selectedStylist)
                            ?.username || "selected stylist"
                        }`
                      : "Available times for any stylist"}
                  </Text>
                  <Text style={styles.availabilitySubtext}>
                    {
                      availableSlots.filter((slot) => isTimeSlotAvailable(slot))
                        .length
                    }{" "}
                    slots available
                  </Text>
                </View>
              )}

              <View style={styles.timeSlotsGrid}>
                {allTimeSlots.map((time) => (
                  <TimeSlotButton
                    key={time}
                    time={time}
                    isSelected={selectedTime === time}
                    onSelect={setSelectedTime}
                    isAvailable={isTimeSlotAvailable(time)}
                  />
                ))}
              </View>

              {!loadingSlots && availableSlots.length === 0 && selectedDate && (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="time-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.noSlotsText}>No available slots</Text>
                  <Text style={styles.noSlotsSubtext}>
                    Please select a different date or try another stylist
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleConfirmDateTime}
            disabled={
              !selectedDate ||
              !selectedTime ||
              !isTimeSlotAvailable(selectedTime)
            }>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.continueButton,
                (!selectedDate ||
                  !selectedTime ||
                  !isTimeSlotAvailable(selectedTime)) &&
                  styles.continueButtonDisabled,
              ]}>
              <Text style={styles.continueButtonText}>
                {!selectedDate || !selectedTime
                  ? "Select Date & Time"
                  : !isTimeSlotAvailable(selectedTime)
                    ? "Time Not Available"
                    : "Confirm Appointment"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // BOOKING SUMMARY SCREEN - UPDATED WITH PAYMENT OPTIONS
  const BookingSummaryScreen = () => {
    if (!selectedService || !selectedDate || !selectedTime) return null;

    const servicePrice =
      parseInt(selectedService.priceRange.replace(/[^0-9]/g, "")) || 0;
    const paymentAmounts = calculatePaymentAmounts();

    const safeRating = getSafeRating(selectedService);
    const starRating = apiClient.getStarRating(safeRating.average);
    const totalRaters = safeRating.totalRaters;

    // Get the selected stylist name for display
    const getSelectedStylistName = () => {
      if (stylistSelectionType === "any") {
        return "Any Available Stylist";
      } else if (selectedStylist) {
        const stylist = stylists.find((s) => s._id === selectedStylist);
        return stylist?.username || "Selected Stylist";
      }
      return "Not selected";
    };

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Booking Summary</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.bookingScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryServiceCard, styles.cardShadow]}>
              <View style={styles.summaryServiceHeader}>
                <Text style={styles.summaryServiceName}>
                  {selectedService.name}
                </Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: starRating.full }).map((_, i) => (
                    <Ionicons
                      key={`full-${i}`}
                      name="star"
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                  {starRating.half && (
                    <Ionicons
                      key="half"
                      name="star-half"
                      size={14}
                      color="#FFD700"
                    />
                  )}
                  {Array.from({ length: starRating.empty }).map((_, i) => (
                    <Ionicons
                      key={`empty-${i}`}
                      name="star-outline"
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                  <Text style={styles.ratingCount}>{totalRaters}</Text>
                </View>
              </View>
              <View style={styles.serviceMetaRow}>
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text style={styles.serviceMetaText}>
                  {selectedService.duration}
                </Text>
              </View>
              <View style={styles.serviceMetaRow}>
                <Ionicons name="cash-outline" size={16} color="#9CA3AF" />
                <Text style={styles.servicePriceText}>
                  {selectedService.priceRange}
                </Text>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Booking Details</Text>
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>Date</Text>
                <Text style={styles.summaryDetailValue}>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  at {selectedTime}
                </Text>
              </View>
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>Stylist</Text>
                <Text style={styles.summaryDetailValue}>
                  {getSelectedStylistName()}
                </Text>
              </View>
            </View>

            {/* NEW: Payment Option Selection */}
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Payment Option</Text>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentOption === "full" && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentOption("full")}>
                <View>
                  <Text style={styles.paymentOptionTitle}>Pay Full Amount</Text>
                  <Text style={styles.paymentOptionSubtext}>
                    Pay the complete service amount now
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    paymentOption === "full" && styles.radioButtonActive,
                  ]}>
                  {paymentOption === "full" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentOption === "downpayment" && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentOption("downpayment")}>
                <View>
                  <Text style={styles.paymentOptionTitle}>Pay Downpayment</Text>
                  <Text style={styles.paymentOptionSubtext}>
                    Pay 30% now, remaining 70% at the salon
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    paymentOption === "downpayment" && styles.radioButtonActive,
                  ]}>
                  {paymentOption === "downpayment" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Payment Method</Text>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === "online" && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentType("online")}>
                <View>
                  <Text style={styles.paymentOptionTitle}>Pay Online Now</Text>
                  <Text style={styles.paymentOptionSubtext}>
                    Secure your booking instantly
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    paymentType === "online" && styles.radioButtonActive,
                  ]}>
                  {paymentType === "online" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === "salon" && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentType("salon")}>
                <View>
                  <Text style={styles.paymentOptionTitle}>Pay at Salon</Text>
                  <Text style={styles.paymentOptionSubtext}>
                    Settle payment after your appointment
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    paymentType === "salon" && styles.radioButtonActive,
                  ]}>
                  {paymentType === "salon" && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.pricingCard, styles.cardShadow]}>
              <Text style={styles.pricingTitle}>Pricing Details</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{selectedService.name}</Text>
                <Text style={styles.pricingValue}>₱{servicePrice}.00</Text>
              </View>

              {/* Show downpayment details if selected */}
              {paymentOption === "downpayment" && (
                <>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Downpayment (30%)</Text>
                    <Text style={styles.pricingValue}>
                      ₱{paymentAmounts.downpaymentAmount}.00
                    </Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Remaining Balance</Text>
                    <Text style={styles.pricingValue}>
                      ₱{paymentAmounts.remainingAmount}.00
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={styles.pricingValue}>₱0.00</Text>
              </View>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.pricingTotalLabel}>
                  {paymentOption === "downpayment"
                    ? "Amount to Pay Now"
                    : "Total Amount"}
                </Text>
                <Text style={styles.pricingTotalValue}>
                  {paymentOption === "downpayment"
                    ? `₱${paymentAmounts.downpaymentAmount}.00`
                    : `₱${servicePrice}.00`}
                </Text>
              </View>

              {/* Payment policy note */}
              {paymentOption === "downpayment" && (
                <View style={styles.policyNote}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#619AE4"
                  />
                  <Text style={styles.policyText}>
                    30% downpayment is non-refundable reservation fee. 70% is
                    refundable if cancelled.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.cardShadow]}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowConfirmModal(false)}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Just to confirm would you like to go ahead with this service?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonNo}
                  onPress={handleBack}>
                  <Text style={styles.modalButtonTextNo}>No, go back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                  <LinearGradient
                    colors={["#619AE4", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.modalButtonYes}>
                    <Text style={styles.modalButtonTextYes}>Yes, Confirm</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {/* UPDATED: Terms & Policies Link */}
              <TouchableOpacity
                style={styles.modalLink}
                onPress={() => {
                  setShowConfirmModal(false);
                  setShowTermsOverlay(true);
                }}>
                <Text style={styles.modalLinkText}>Read Terms & Policies</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleProceedToPayment(paymentOption)}>
            <LinearGradient
              colors={["#619AE4", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.continueButton}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {paymentOption === "downpayment"
                    ? `Pay ₱${paymentAmounts.downpaymentAmount}.00 Now`
                    : `Pay ₱${servicePrice}.00 Now`}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // PAYMENT METHOD SCREEN
  const PaymentMethodScreen = () => (
    <View style={styles.bookingScreenContainer}>
      <View style={styles.bookingHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.bookingHeaderTitle}>Payment Method</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.bookingScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === "gcash" && styles.paymentMethodActive,
            ]}
            onPress={() => setPaymentMethod("gcash")}>
            <View style={styles.paymentMethodLeft}>
              <Image
                source={
                  images.gcash || { uri: "https://example.com/gcash.png" }
                }
                style={styles.paymentIconImage}
              />
              <Text style={styles.paymentMethodText}>GCash</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "gcash" && styles.radioButtonActive,
              ]}>
              {paymentMethod === "gcash" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === "paymaya" && styles.paymentMethodActive,
            ]}
            onPress={() => setPaymentMethod("paymaya")}>
            <View style={styles.paymentMethodLeft}>
              <Image
                source={
                  images.paymaya || { uri: "https://example.com/paymaya.png" }
                }
                style={styles.paymentIconImage}
              />
              <Text style={styles.paymentMethodText}>PayMaya</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "paymaya" && styles.radioButtonActive,
              ]}>
              {paymentMethod === "paymaya" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === "paypal" && styles.paymentMethodActive,
            ]}
            onPress={() => setPaymentMethod("paypal")}>
            <View style={styles.paymentMethodLeft}>
              <Image
                source={
                  images.paypal || { uri: "https://example.com/paypal.png" }
                }
                style={styles.paymentIconImage}
              />
              <Text style={styles.paymentMethodText}>PayPal</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "paypal" && styles.radioButtonActive,
              ]}>
              {paymentMethod === "paypal" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === "credit" && styles.paymentMethodActive,
            ]}
            onPress={() => setPaymentMethod("credit")}>
            <View style={styles.paymentMethodLeft}>
              <Ionicons name="card-outline" size={20} color="#619AE4" />
              <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === "credit" && styles.radioButtonActive,
              ]}>
              {paymentMethod === "credit" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePayNow}>
          <LinearGradient
            colors={["#76C4FF", "#0449D3", "#0348D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.continueButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Pay Now</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // RECEIPT SCREEN - UPLOAD IMAGE
  const ReceiptScreen = () => (
    <View style={styles.bookingScreenContainer}>
      <View style={styles.bookingHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.bookingHeaderTitle}>Receipt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.bookingScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.receiptContainer}>
          <View style={[styles.qrCodeContainer, styles.cardShadow]}>
            <View style={styles.qrCodePlaceholder}>
              <QRCode
                value={`payment:${currentPaymentId || "pending"}`}
                size={180}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrCodeText}>
                Scan this QR code to finalize your payment
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}>
            <Ionicons name="cloud-upload-outline" size={18} color="white" />
            <Text style={styles.uploadButtonText}>
              {proofImage
                ? "Change Payment Screenshot"
                : "Upload an image of your payment"}
            </Text>
          </TouchableOpacity>

          {proofImage && (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: proofImage.uri }}
                style={styles.selectedImage}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProofImage(null)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleContinueToPersonalInfo}>
          <LinearGradient
            colors={["#76C4FF", "#0449D3", "#0348D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Submit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // RECEIPT INFO SCREEN - AUTO-GENERATED DATA (FIXED)
  const ReceiptInfoScreen = () => {
    // Auto-generate receipt data only once when screen loads
    useEffect(() => {
      const generateReceiptData = async () => {
        // Only generate if data is empty to prevent infinite loops
        if (!receiptData.referenceNumber) {
          // Generate reference number (random 10-digit number)
          const referenceNumber = Math.floor(
            1000000000 + Math.random() * 9000000000,
          ).toString();

          // Get current user name or use default
          const userName = "James"; // In a real app, you'd get this from user profile

          // Get service price and format it - REMOVE CURRENCY SYMBOL for server
          const servicePrice = selectedService
            ? parseInt(selectedService.priceRange.replace(/[^0-9]/g, "")) || 0
            : 0;

          // Get booking details to determine the correct amount
          let amountToPay = servicePrice;
          if (currentBookingId) {
            try {
              const bookingResponse =
                await apiClient.getBookingById(currentBookingId);
              const booking = bookingResponse.data;
              if (booking.paymentOption === "downpayment") {
                amountToPay = booking.downpaymentAmount;
              }
            } catch {
              console.warn(
                "Could not fetch booking details, using service price",
              );
            }
          }

          // Get current date in YYYY-MM-DD format
          const currentDate = new Date().toISOString().split("T")[0];

          setReceiptData({
            referenceNumber,
            name: userName,
            amountPaid: amountToPay.toString(), // Use the correct amount
            dateOfTransaction: currentDate,
          });

          Toast.show({
            type: "success",
            text1: "Receipt Info Generated",
            text2: "All fields have been auto-filled for you!",
          });
        }
      };

      generateReceiptData();
    }, []); // Empty dependency array to run only once

    // Format amount for display (add currency symbol)
    const formatAmountForDisplay = (amount: string) => {
      const numericAmount = amount.replace(/[^0-9]/g, "");
      return `₱${numericAmount}.00`;
    };

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Receipt Information</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
          <ScrollView
            style={styles.bookingScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.receiptInfoScrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.receiptContainer}>
              {!currentPaymentId && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerTitle}>
                    Missing Payment ID
                  </Text>
                  <Text style={styles.errorBannerText}>
                    Payment ID is missing. Please try again.
                  </Text>
                </View>
              )}

              <View style={styles.receiptForm}>
                <Text style={styles.formLabel}>
                  Your payment information has been auto-filled
                </Text>
                <Text style={styles.formSubtext}>
                  Review the details below and submit your payment
                </Text>

                <View style={styles.autoGeneratedCard}>
                  <View style={styles.autoGeneratedHeader}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#22C55E"
                    />
                    <Text style={styles.autoGeneratedTitle}>
                      Auto-Generated Receipt
                    </Text>
                  </View>

                  <View style={styles.generatedField}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.generatedFieldLabel}>
                        Reference Number
                      </Text>
                      <TouchableOpacity
                        onPress={handleEditReference}
                        style={styles.editButton}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#619AE4"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.generatedValueContainer}>
                      <Text style={styles.generatedValue}>
                        {receiptData.referenceNumber}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.generatedField}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.generatedFieldLabel}>Name</Text>
                      <TouchableOpacity
                        onPress={handleEditName}
                        style={styles.editButton}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#619AE4"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.generatedValueContainer}>
                      <Text style={styles.generatedValue}>
                        {receiptData.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.generatedField}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.generatedFieldLabel}>
                        Amount Paid
                      </Text>
                      <TouchableOpacity
                        onPress={handleEditAmount}
                        style={styles.editButton}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#619AE4"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.generatedValueContainer}>
                      <Text style={[styles.generatedValue, styles.amountValue]}>
                        {formatAmountForDisplay(receiptData.amountPaid)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.generatedField}>
                    <Text style={styles.generatedFieldLabel}>
                      Date of Transaction
                    </Text>
                    <View style={styles.generatedValueContainer}>
                      <Text style={styles.generatedValue}>
                        {receiptData.dateOfTransaction}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Hidden text inputs for form submission compatibility */}
                <TextInput
                  ref={referenceNumberRef}
                  style={styles.hiddenInput}
                  value={receiptData.referenceNumber}
                  onChangeText={(text) =>
                    setReceiptData((prev) => ({
                      ...prev,
                      referenceNumber: text,
                    }))
                  }
                />
                <TextInput
                  ref={nameRef}
                  style={styles.hiddenInput}
                  value={receiptData.name}
                  onChangeText={(text) =>
                    setReceiptData((prev) => ({ ...prev, name: text }))
                  }
                />
                <TextInput
                  ref={amountRef}
                  style={styles.hiddenInput}
                  value={receiptData.amountPaid} // This sends the numeric value without currency symbol
                  onChangeText={(text) => {
                    // Only allow numeric input for amount
                    const numericText = text.replace(/[^0-9]/g, "");
                    setReceiptData((prev) => ({
                      ...prev,
                      amountPaid: numericText,
                    }));
                  }}
                  keyboardType="numeric"
                />
                <TextInput
                  ref={dateRef}
                  style={styles.hiddenInput}
                  value={receiptData.dateOfTransaction}
                  onChangeText={(text) =>
                    setReceiptData((prev) => ({
                      ...prev,
                      dateOfTransaction: text,
                    }))
                  }
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleSubmitProof}
            disabled={uploadingProof}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.continueButton}>
              {uploadingProof ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Submit Payment</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // PAYMENT STATUS SCREEN
  const PaymentStatusScreen = () => {
    const [booking, setBooking] = useState<any>(null);

    useEffect(() => {
      const fetchBookingDetails = async () => {
        if (currentBookingId) {
          try {
            const bookingResponse =
              await apiClient.getBookingById(currentBookingId);
            setBooking(bookingResponse.data);
          } catch (error) {
            console.error("Error fetching booking details:", error);
          }
        }
      };

      fetchBookingDetails();
    }, [currentBookingId]);

    const getStatusColor = () => {
      switch (paymentStatus) {
        case "approved":
          return "#22C55E";
        case "denied":
          return "#EF4444";
        default:
          return "#F59E0B";
      }
    };

    const getStatusText = () => {
      switch (paymentStatus) {
        case "approved":
          return "Approved";
        case "denied":
          return "Denied";
        default:
          return "Pending";
      }
    };

    return (
      <View style={styles.bookingScreenContainer}>
        <View style={styles.bookingHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.bookingHeaderTitle}>Payment Status</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.bookingScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusCard, styles.cardShadow]}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Salon</Text>
                <Text style={styles.statusValue}>SandreaLee Salon</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusBadge, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Customer Name</Text>
                <Text style={styles.statusValue}>
                  {receiptData.name || "James"}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Phone</Text>
                <Text style={styles.statusValue}>+63 992 5433 570</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Booking Date</Text>
                <Text style={styles.statusValue}>
                  {selectedDate?.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Booking Time</Text>
                <Text style={styles.statusValue}>{selectedTime}</Text>
              </View>
              {selectedStylist && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Stylist</Text>
                  <Text style={styles.statusValue}>
                    {stylists.find((s) => s._id === selectedStylist)
                      ?.username || "Selected Stylist"}
                  </Text>
                </View>
              )}
              {currentBookingId && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Payment Option</Text>
                  <Text style={styles.statusValue}>
                    {booking?.paymentOption === "downpayment"
                      ? "30% Downpayment"
                      : "Full Payment"}
                  </Text>
                </View>
              )}
              {booking?.paymentOption === "downpayment" && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Downpayment Paid</Text>
                    <Text style={styles.statusValue}>
                      ₱{booking?.downpaymentAmount || 0}.00
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Remaining Balance</Text>
                    <Text style={styles.statusValue}>
                      ₱{booking?.remainingAmount || 0}.00
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.pricingSummaryCard, styles.cardShadow]}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  {selectedService?.name || "Service"}
                </Text>
                <Text style={styles.pricingValue}>
                  {selectedService?.priceRange}
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount</Text>
                <Text style={styles.pricingValue}>₱0.00</Text>
              </View>
            </View>

            {paymentStatus === "processing" && (
              <View style={[styles.processingCard, styles.cardShadow]}>
                <ActivityIndicator size="large" color="#619AE4" />
                <Text style={styles.processingTitle}>
                  Processing Your Payment...
                </Text>
                <Text style={styles.processingSubtext}>
                  Please wait while we complete your transaction.
                </Text>
              </View>
            )}

            {paymentStatus === "denied" && (
              <View style={[styles.messageCard, styles.cardShadow]}>
                <Ionicons name="close-circle" size={50} color="#EF4444" />
                <Text style={styles.errorMessage}>{paymentStatusMessage}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={handleRetryPayment}>
                    <LinearGradient
                      colors={["#76C4FF", "#0449D3", "#0348D3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.retryButton}>
                      <Text style={styles.retryButtonText}>
                        Re-upload Proof
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changeMethodButton}
                    onPress={handleChangePaymentMethod}>
                    <Text style={styles.changeMethodText}>
                      Change Payment Method
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paymentStatus === "approved" && (
              <View style={[styles.messageCard, styles.cardShadow]}>
                <Ionicons name="checkmark-circle" size={50} color="#22C55E" />
                <Text style={styles.successMessage}>
                  Your salon appointment is confirmed! {paymentStatusMessage}
                </Text>
                <View style={styles.actionButtons}>
                  {/* UPDATED: View Receipt Button */}
                  <TouchableOpacity
                    style={styles.viewReceiptButton}
                    onPress={() => setShowReceiptOverlay(true)}>
                    <Text style={styles.viewReceiptText}>View Receipt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBackToServices}>
                    <LinearGradient
                      colors={["#76C4FF", "#0449D3", "#0348D3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.backHomeButton}>
                      <Text style={styles.backHomeText}>Back to Home</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  // RENDER CURRENT SCREEN
  const renderCurrentScreen = () => {
    if (loading && !authChecked) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#619AE4" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      );
    }
    switch (currentScreen) {
      case "details":
        return <ServiceDetailsScreen />;
      case "stylist":
        return <StylistSelectionScreen />;
      case "datetime":
        return <DateTimeSelectionScreen />;
      case "summary":
        return <BookingSummaryScreen />;
      case "payment":
        return <PaymentMethodScreen />;
      case "receipt":
        return <ReceiptScreen />;
      case "receiptInfo":
        return <ReceiptInfoScreen />;
      case "status":
        return <PaymentStatusScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.bookingScreenContainer}>
      {renderCurrentScreen()}

      {/* NEW: Overlay Components */}
      <TermsAndPoliciesOverlay />
      <ReceiptOverlay />

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bookingScreenContainer: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    backgroundColor: "#0A0E17",
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 24,
  },
  bookingHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bookingScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  receiptInfoScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    backgroundColor: "#0A0E17",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0E17",
    padding: 20,
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  serviceDetailsContainer: {
    padding: 20,
  },
  salonImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  categoryImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: "#1F2937",
  },
  salonNameLarge: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  addressTextSmall: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
  },
  ratingRowLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 24,
  },
  ratingTextLarge: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  serviceInfoCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  detailServiceTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  serviceMetaInfo: {
    gap: 12,
  },
  serviceMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  serviceMetaText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  servicePriceText: {
    color: "#22C55E",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  tabButtonActive: {
    backgroundColor: "#3352E8",
    borderColor: "#619AE4",
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "white",
  },
  tabContent: {
    marginBottom: 20,
  },
  aboutText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  openingHoursCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  openingHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  openingHoursTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  hoursDay: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  hoursTime: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  serviceDetailCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  serviceDescriptionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 12,
  },
  serviceDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featuresTitle: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
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
  noDiscountsText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    paddingVertical: 40,
  },
  reviewSummary: {
    alignItems: "center",
    paddingVertical: 24,
  },
  reviewCount: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 12,
    fontFamily: "Urbanist",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  averageRating: {
    color: "white",
    fontSize: 32,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 8,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#619AE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  stylistContainer: {
    padding: 20,
    gap: 16,
  },
  stylistOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  stylistOptionActive: {
    borderWidth: 2,
    borderColor: "#619AE4",
    backgroundColor: "#1E3A5F",
  },
  stylistIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0A0E17",
    alignItems: "center",
    justifyContent: "center",
  },
  stylistImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  stylistImage: {
    width: "100%",
    height: "100%",
  },
  stylistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#619AE4",
    alignItems: "center",
    justifyContent: "center",
  },
  stylistInitial: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  stylistSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  stylistRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  stylistRatingText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  topRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  topRatedText: {
    color: "#1F2937",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  dateTimeContainer: {
    padding: 20,
  },
  dateSection: {
    marginBottom: 30,
  },
  timeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  dateScroll: {
    marginBottom: 0,
  },
  dateScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  dateButton: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#374151",
  },
  dateButtonActive: {
    borderColor: "#619AE4",
    borderWidth: 2,
  },
  dateDayText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateMonthText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateNumberText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  moreDatesButton: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  moreDatesText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  timeSlot: {
    backgroundColor: "#1F2937",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: (SCREEN_WIDTH - 40) / 1,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#374151",
    position: "relative",
  },
  timeSlotActive: {
    borderColor: "#619AE4",
    borderWidth: 2,
  },
  timeSlotUnavailable: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
    opacity: 0.6,
  },
  timeSlotText: {
    color: "#4D5766",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  timeSlotTextActive: {
    color: "white",
  },
  timeSlotTextUnavailable: {
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  unavailableText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Urbanist",
  },
  timeSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingSlotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingSlotsText: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  availabilityInfo: {
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#619AE4",
  },
  availabilityText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  availabilitySubtext: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  noSlotsContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    marginTop: 20,
  },
  noSlotsText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  noSlotsSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryServiceCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  summaryServiceHeader: {
    marginBottom: 16,
  },
  summaryServiceName: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  summarySection: {
    marginBottom: 24,
  },
  summarySectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryDetailRow: {
    marginBottom: 12,
  },
  summaryDetailLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  summaryDetailValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  paymentOptionActive: {
    borderWidth: 2,
    borderColor: "#619AE4",
    backgroundColor: "#1E3A5F",
  },
  paymentOptionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentOptionSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonActive: {
    borderColor: "#619AE4",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#619AE4",
  },
  pricingCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  pricingTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pricingLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  pricingValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  pricingDivider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 16,
  },
  pricingTotalLabel: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  pricingTotalValue: {
    color: "#22C55E",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  policyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    borderRadius: 8,
    gap: 8,
  },
  policyText: {
    flex: 1,
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalClose: {
    alignSelf: "flex-end",
    padding: 4,
  },
  modalTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonNo: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextNo: {
    margin: 6,
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalButtonYes: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextYes: {
    margin: 6,
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalLink: {
    marginTop: 16,
  },
  modalLinkText: {
    color: "#619AE4",
    fontSize: 13,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  paymentMethodContainer: {
    padding: 20,
    gap: 16,
  },
  paymentMethodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  paymentMethodActive: {
    borderWidth: 2,
    borderColor: "#619AE4",
    backgroundColor: "#1E3A5F",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  paymentIconImage: {
    width: 24,
    height: 24,
  },
  paymentMethodText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptContainer: {
    padding: 20,
  },
  qrCodeContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  qrCodePlaceholder: {
    alignItems: "center",
  },
  qrCodeText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  selectedImageContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 24,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 16,
    padding: 4,
  },
  receiptForm: {
    gap: 20,
  },
  formLabel: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  formInput: {
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    borderWidth: 1,
    borderColor: "#374151",
  },
  autoGeneratedCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#22C55E",
    marginBottom: 20,
  },
  autoGeneratedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  autoGeneratedTitle: {
    color: "#22C55E",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  generatedField: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  generatedFieldLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  editButtonText: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  generatedValueContainer: {
    backgroundColor: "#0A0E17",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  generatedValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  amountValue: {
    color: "#22C55E",
  },
  hiddenInput: {
    display: "none",
    height: 0,
    width: 0,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorBannerTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  errorBannerText: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 18,
  },
  statusContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  statusLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  statusValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    textAlign: "right",
  },
  statusBadge: {
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  pricingSummaryCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  processingCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  processingTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  processingSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  errorMessage: {
    color: "#EF4444",
    fontSize: 16,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  successMessage: {
    color: "#22C55E",
    fontSize: 16,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButtons: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  changeMethodButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  changeMethodText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  viewReceiptButton: {
    backgroundColor: "#1F2937",
    borderWidth: 2,
    borderColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  viewReceiptText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  backHomeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  backHomeText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  serviceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  ratingCount: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 4,
    fontFamily: "Urbanist",
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  // NEW STYLES FOR OVERLAYS
  overlayContainer: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  overlayTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  overlayContent: {
    flex: 1,
    padding: 20,
  },
  overlayFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
  },

  // Terms & Policies Specific Styles
  termsContent: {
    paddingBottom: 20,
  },
  mainTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  termSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#619AE4",
  },
  termTitle: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  termText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  contactTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  agreeButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  agreeButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },

  // Receipt Overlay Styles
  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  salonName: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
  },
  receiptSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 16,
  },
  receiptSection: {
    marginBottom: 16,
  },
  receiptLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  receiptValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  pricingSection: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  totalLabel: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  totalValue: {
    color: "#22C55E",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  paymentInfoSection: {
    marginBottom: 20,
  },
  paymentMethod: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 8,
  },
  paymentStatus: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 12,
  },
  notesText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
    marginBottom: 8,
  },
  thankYouSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  thankYouText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
  },
  closeReceiptButton: {
    backgroundColor: "#1F2937",
    borderWidth: 2,
    borderColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeReceiptButtonText: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
});
