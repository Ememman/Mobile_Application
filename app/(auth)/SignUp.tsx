"use client";

import { icons } from "@/constants/icons";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = "https://sandrealeesalon.onrender.com/api";

// Updated image assets with correct names
const images = {
  bgBottom: require("@/assets/images/Main_BG_Bottom.png"),
  bgTop: require("@/assets/images/Main_BG_Top.png"),
  salonLogo: require("@/assets/images/SalonLogoSignUp.png"),
  signUpIllustration: require("@/assets/images/SignUpIllustration.png"),
  carousel: [
    require("@/assets/images/first-img.png"),
    require("@/assets/images/second-img.png"),
    require("@/assets/images/third-img.png"),
  ],
};

type RegistrationStep =
  | "role_selection"
  | "onboarding"
  | "auth_method"
  | "phone_entry"
  | "phone_verification"
  | "profile_setup"
  | "password_setup"
  | "email_setup"
  | "email_verification"
  | "completion";

interface PasswordStrength {
  strength: "weak" | "medium" | "strong";
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: "info" | "success" | "error";
}

// Custom Alert Component
const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  type = "info",
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "info" | "success" | "error";
}) => {
  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#71D29C";
      case "error":
        return "#FF4444";
      default:
        return "#4A90E2";
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "warning";
      default:
        return "information-circle";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconContainer}>
              <Ionicons name={getIconName()} size={24} color={getIconColor()} />
            </View>
            <Text style={styles.alertTitle}>{title}</Text>
          </View>

          <Text style={styles.alertMessage}>{message}</Text>

          <TouchableOpacity
            style={[
              styles.alertButton,
              type === "success" && styles.alertButtonSuccess,
              type === "error" && styles.alertButtonError,
            ]}
            onPress={onClose}>
            {type === "success" ? (
              <LinearGradient
                colors={["#76C4FF", "#0449D3", "#0348D3"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                  borderRadius: 8,
                  paddingVertical: 12,
                  width: "100%",
                  alignItems: "center",
                }}>
                <Text style={styles.alertButtonText}>OK</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.alertButtonText}>OK</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Custom Hook for Alerts
const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return { alert, showAlert, hideAlert };
};

// Enhanced Auto-scrolling Carousel Component
const AutoScrollCarousel = ({
  data,
  currentIndex,
  onIndexChange,
}: {
  data: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  useEffect(() => {
    if (!autoScrollEnabled) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % data.length;
      onIndexChange(nextIndex);

      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, data.length, onIndexChange, autoScrollEnabled]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onScrollBeginDrag = () => {
    setAutoScrollEnabled(false);
  };

  const onScrollEndDrag = () => {
    setTimeout(() => setAutoScrollEnabled(true), 5000);
  };

  const onMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    onIndexChange(newIndex);
  };

  const handleDotPress = (index: number) => {
    setAutoScrollEnabled(false);
    onIndexChange(index);
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setTimeout(() => setAutoScrollEnabled(true), 5000);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast">
        {data.map((item, index) => (
          <View key={index} style={styles.carouselSlide}>
            <View style={styles.carouselImageContainer}>
              <Image
                source={images.carousel[index]}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.carouselContent}>
              <Text style={styles.carouselTitle}>{item.title}</Text>
              <Text style={styles.carouselDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.carouselDots}>
        {data.map((_, index) => {
          const dotOpacity = scrollX.interpolate({
            inputRange: [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          const dotScale = scrollX.interpolate({
            inputRange: [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: "clamp",
          });

          return (
            <TouchableOpacity key={index} onPress={() => handleDotPress(index)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    opacity: dotOpacity,
                    transform: [{ scale: dotScale }],
                  },
                  currentIndex === index && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function SignUp() {
  const [currentStep, setCurrentStep] =
    useState<RegistrationStep>("role_selection");
  const [role, setRole] = useState<"customer" | "staff" | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Form data
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtpDigits, setEmailOtpDigits] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Alert hook
  const { alert, showAlert, hideAlert } = useAlert();

  // Refs for OTP inputs
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Email OTP refs (6 digits)
  const emailOtpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Input refs for auto-focus
  const phoneInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const firstNameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (password && currentStep === "password_setup") {
      checkPasswordStrength(password);
    }
  }, [password, currentStep]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-focus inputs when steps change
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      switch (currentStep) {
        case "phone_entry":
          phoneInputRef.current?.focus();
          break;
        case "phone_verification":
          otpRefs[0].current?.focus();
          break;
        case "profile_setup":
          firstNameInputRef.current?.focus();
          break;
        case "password_setup":
          passwordInputRef.current?.focus();
          break;
        case "email_setup":
          emailInputRef.current?.focus();
          break;
        case "email_verification":
          emailOtpRefs[0].current?.focus();
          break;
      }
    }, 300);

    return () => clearTimeout(focusTimeout);
  }, [currentStep]);

  const checkPasswordStrength = async (pwd: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/check-password-strength`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setPasswordStrength(data.data);
      }
    } catch (error) {
      console.error("Password strength check error:", error);
    }
  };

  const handleSendPhoneOTP = async () => {
    const formattedPhone = phoneNumber.startsWith("0")
      ? phoneNumber
      : `0${phoneNumber}`;

    if (formattedPhone.length !== 11) {
      showAlert(
        "Error",
        "Phone number must be 11 digits including leading 0",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          role,
          email: email || undefined, // ✅ FIXED: Add email for fallback
        }),
      });

      const data = await response.json();
      if (data.success) {
        // ✅ FIXED: Show which channel was used
        const channelMessage =
          data.channel === "email"
            ? `Verification code sent to your email${
                email ? ": " + email : ""
              }. Please check your inbox.`
            : `OTP sent via SMS to +63${phoneNumber}`;

        const channelIcon = data.channel === "email" ? "📧" : "📱";

        showAlert(
          "Success",
          `${channelIcon} ${data.message || channelMessage}`,
          "success",
        );

        setCurrentStep("phone_verification");
        setResendCooldown(60);
      } else {
        showAlert("Error", data.message, "error");
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      showAlert("Error", "Please enter complete OTP", "error");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith("0")
        ? phoneNumber
        : `0${phoneNumber}`;

      const response = await fetch(`${API_BASE_URL}/auth/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formattedPhone, otp: otpCode }),
      });

      const data = await response.json();
      if (data.success) {
        setUserId(data.userId);
        setCurrentStep("profile_setup");
        showAlert("Success", "Phone number verified successfully!", "success");
      } else {
        showAlert("Error", data.message, "error");
        setOtp(["", "", "", ""]);
        otpRefs[0].current?.focus();
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to verify OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await handleSendPhoneOTP();
  };

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    setUsernameError("");
    setUsernameSuggestions([]);

    if (text.length >= 7) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: text }),
        });

        const data = await response.json();

        if (data.success && data.available) {
          setUsernameError("");
          setUsernameSuggestions([]);
        } else {
          setUsernameError(
            data.message ||
              "This username isn't available. Try a different one.",
          );
          setUsernameSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameError("Error checking username availability");
      }
    } else if (text.length > 0) {
      setUsernameError("Username must be at least 7 characters");
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameError("");
    setUsernameSuggestions([]);
    usernameInputRef.current?.focus();
  };

  const handlePickImage = async () => {
    // Ask for media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to upload an image.",
      );
      return;
    }

    // Open the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile images
      quality: 0.8, // Compress image
    });

    // If the user didn't cancel
    if (!result.canceled) {
      const pickedImage = result.assets[0].uri;
      console.log("Picked Image:", pickedImage);

      // ✅ Store the image URI in state
      setProfileImage(pickedImage);
      showAlert(
        "Success",
        "Profile photo selected. It will be uploaded when you complete registration.",
        "success",
      );
    }
  };

  const handleSetupProfile = async () => {
    if (!firstName.trim()) {
      showAlert("Error", "First name is required", "error");
      return;
    }
    if (username.length < 7) {
      showAlert("Error", "Username must be at least 7 characters", "error");
      return;
    }

    if (usernameError) {
      showAlert("Error", "Please choose a different username", "error");
      return;
    }

    // ✅ FIX: Check if userId exists before proceeding
    if (!userId) {
      showAlert("Error", "User ID not found. Please try again.", "error");
      return;
    }

    setLoading(true);
    try {
      // ✅ Create FormData for multipart upload with image
      const formData = new FormData();
      formData.append("userId", userId); // ✅ Now userId is guaranteed to be a string
      formData.append("username", username);
      formData.append("firstName", firstName);

      // ✅ If user picked an image, append it
      if (profileImage) {
        const filename = `profile-${userId}-${Date.now()}.jpg`;
        const file = {
          uri: profileImage,
          type: "image/jpeg",
          name: filename,
        } as any;

        formData.append("profileImage", file);
        console.log("Image file appended to FormData");
      }

      const response = await fetch(`${API_BASE_URL}/auth/setup-profile`, {
        method: "POST",
        // Don't set Content-Type header - fetch will set it automatically for FormData
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        console.log("Profile setup successful:", data);
        setCurrentStep("password_setup");
      } else {
        showAlert("Error", data.message, "error");
      }
    } catch (error: any) {
      console.error("Profile setup error:", error);
      showAlert("Error", error.message || "Failed to setup profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = () => {
    if (!passwordStrength || !passwordStrength.checks.length) {
      showAlert(
        "Error",
        "Password must be 8-20 characters with uppercase and lowercase",
        "error",
      );
      return;
    }
    setCurrentStep("email_setup");
  };

  const handleSetupEmail = async () => {
    const emailRegex = /^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      showAlert("Error", "Please enter a valid email", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/setup-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, password }),
      });

      const data = await response.json();
      if (data.success) {
        // ✅ FIXED: Better messaging
        showAlert(
          "Success",
          `📧 Verification code sent to ${email}. Please check your inbox and spam folder.`,
          "success",
        );
        setCurrentStep("email_verification");
      } else {
        showAlert("Error", data.message, "error");
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to setup email", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const emailOtpCode = emailOtpDigits.join("");
    if (emailOtpCode.length !== 6) {
      showAlert("Error", "Please enter complete verification code", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: emailOtpCode }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep("completion");
        showAlert("Success", "Email verified successfully!", "success");
      } else {
        showAlert("Error", data.message, "error");
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to verify email", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleEmailOTPInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...emailOtpDigits];
    newOtp[index] = value;
    setEmailOtpDigits(newOtp);
    if (value && index < 5) {
      emailOtpRefs[index + 1].current?.focus();
    }
  };

  const handleOTPKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleEmailOTPKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !emailOtpDigits[index] && index > 0) {
      emailOtpRefs[index - 1].current?.focus();
    }
  };

  const getProgressText = () => {
    if (currentStep === "phone_entry") return "1 / 3";
    if (currentStep === "phone_verification") return "2 / 3";
    if (currentStep === "profile_setup") return "3 / 3";
    if (currentStep === "password_setup") return "3 / 3";
    if (currentStep === "email_setup") return "1 / 2";
    if (currentStep === "email_verification") return "2 / 2";
    return "";
  };

  const carouselData = [
    {
      title: "Effortless Elegance,\nPerfected at Every Visit",
      description:
        "At Sandrelle Salon, we don't just follow beauty trends—we redefine them. Let our skilled artists craft a look that reflects your unique radiance, leaving you confident, empowered, and utterly transformed.",
    },
    {
      title: "Indulge in Timeless Glamour,\nEmbrace Unshakable Confidence",
      description:
        "At Sandrelle Salon, we craft more than beauty—we curate transformations. Step into a sanctuary where precision meets pampering, and every treatment is designed to reveal your most radiant self.",
    },
    {
      title: "Glow like a Celebrity.\nWithout the Price Tag",
      description:
        "At Sandrelle Salon, we don't just style hair—we create show-stopping transformations that belong on the red carpet. From the moment you walk through our doors, you'll be treated to an A-list experience where every snip, stroke, and style is crafted to make you look and feel absolutely iconic.",
    },
  ];

  const renderRoleSelection = () => (
    <View style={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={images.salonLogo}
          style={styles.salonLogo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Your Sanctuary of Glow & Confidence</Text>

      <View style={styles.illustrationContainer}>
        <Image
          source={images.signUpIllustration}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.sectionTitle}>Select Your Role</Text>

      <TouchableOpacity
        style={[styles.roleButton, role === "staff" && styles.roleButtonActive]}
        onPress={() => setRole("staff")}>
        <View
          style={[styles.roleIcon, role === "staff" && styles.roleIconActive]}>
          <Image source={icons.staff} style={styles.roleIconImage} />
        </View>
        <View style={styles.roleTextContainer}>
          <Text
            style={[
              styles.roleTitle,
              role === "staff" && styles.roleTextActive,
            ]}>
            Salon Staff
          </Text>
          <Text style={styles.roleDescription}>
            Professional service providers
          </Text>
        </View>
        {role === "staff" && (
          <View style={styles.roleCheckmark}>
            <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          role === "customer" && styles.roleButtonActive,
        ]}
        onPress={() => setRole("customer")}>
        <View
          style={[
            styles.roleIcon,
            role === "customer" && styles.roleIconActive,
          ]}>
          <Image source={icons.customer} style={styles.roleIconImage} />
        </View>
        <View style={styles.roleTextContainer}>
          <Text
            style={[
              styles.roleTitle,
              role === "customer" && styles.roleTextActive,
            ]}>
            Customer
          </Text>
          <Text style={styles.roleDescription}>
            Beauty and wellness seekers
          </Text>
        </View>
        {role === "customer" && (
          <View style={styles.roleCheckmark}>
            <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.roleNote}>
        Choose your account type to get started with your beauty journey
      </Text>

      <TouchableOpacity
        disabled={!role}
        onPress={() => setCurrentStep("onboarding")}>
        <LinearGradient
          colors={
            role ? ["#76C4FF", "#0449D3", "#0348D3"] : ["#444", "#333", "#222"]
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
            style={styles.nextButtonIcon}
          />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)")}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOnboarding = () => (
    <View style={styles.onboardingContainer}>
      <AutoScrollCarousel
        data={carouselData}
        currentIndex={carouselIndex}
        onIndexChange={setCarouselIndex}
      />

      <View style={styles.onboardingActions}>
        <TouchableOpacity onPress={() => setCurrentStep("auth_method")}>
          <LinearGradient
            colors={["#76C4FF", "#0449D3", "#0348D3"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)")}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAuthMethod = () => (
    <View style={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={images.salonLogo}
          style={styles.salonLogo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Elevate Your Beauty.{"\n"}Embrace Your Shine.
      </Text>
      <Text style={styles.subNote}>
        Create a profile, follow other accounts, make your own Account!
      </Text>

      <TouchableOpacity
        style={styles.authMethodButton}
        onPress={() => setCurrentStep("phone_entry")}>
        <Image source={icons.email} style={styles.authMethodIcon} />
        <Text style={styles.authMethodText}>Use Phone Number or Email</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.socialButton}>
        <Image source={icons.facebook} style={styles.socialButtonIcon} />
        <Text style={styles.socialButtonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialButton}>
        <Image source={icons.google} style={styles.socialButtonIcon} />
        <Text style={styles.socialButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By signing up, you agree to Sandrelles{" "}
        <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)")}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhoneEntry = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Phone</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Email</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("auth_method")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Add your Phone Number {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "33%" }]} />
          </View>

          <Text style={styles.stepHeading}>Let&apos;s Get Started!</Text>

          {/* ✅ NEW: Email Input for Backup Verification */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Email (optional - for backup)"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneInputRef.current?.focus()}
            />
          </View>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>PH +63</Text>
              <Ionicons name="chevron-down" size={16} color="#888" />
            </View>
            <TextInput
              ref={phoneInputRef}
              style={styles.phoneInput}
              placeholder="9123456789"
              placeholderTextColor="#888"
              value={phoneNumber}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
                setPhoneNumber(cleaned);
              }}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSendPhoneOTP}
            />
          </View>

          {/* ✅ UPDATED: Better explanation */}
          <Text style={styles.phoneNote}>
            Enter your 10-digit mobile number (without 0). Example: 9123456789
            {"\n\n"}
            💡 <Text style={{ color: "#4A90E2" }}>Tip:</Text> Add your email for
            backup verification if SMS fails.
          </Text>

          <TouchableOpacity
            style={[loading && styles.sendCodeButtonDisabled]}
            onPress={handleSendPhoneOTP}
            disabled={loading}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.sendCodeButton}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendCodeButtonText}>Send Code</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderPhoneVerification = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Phone</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Email</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("phone_entry")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Verify Your Phone Number {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "66%" }]} />
          </View>

          <Text style={styles.stepHeading}>Verify its you</Text>
          <Text style={styles.stepSubheading}>Enter 4-Digit Code</Text>
          <Text style={styles.stepNote}>
            We&apos;ve sent a 4-digit code to +63{phoneNumber}. Please enter it
            below.
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={otpRefs[index]}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOTPInput(index, value)}
                onKeyPress={({ nativeEvent }) =>
                  handleOTPKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={1}
                returnKeyType={index === 3 ? "done" : "next"}
              />
            ))}
          </View>

          {resendCooldown > 0 ? (
            <Text style={styles.resendText}>
              Resend code: {resendCooldown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendLink}>
                Didn&apos;t Receive the OTP? Resend Code
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleVerifyPhoneOTP}
            disabled={otp.join("").length !== 4}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                styles.verifyButton,
                otp.join("").length !== 4 && styles.verifyButtonDisabled,
              ]}>
              <Text style={styles.verifyButtonText}>Verify</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderProfileSetup = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 100, android: 100 })}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.contentContainer,
            { paddingBottom: keyboardVisible ? 300 : 40 },
          ]}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Phone</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Email</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("phone_verification")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Complete Your Profile {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>

          <Text style={styles.stepHeading}>Almost There!</Text>
          <Text style={styles.stepSubheading}>Enter Your Name</Text>
          <Text style={styles.stepNote}>You can always change it later</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#888" />
            <TextInput
              ref={firstNameInputRef}
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#888"
              autoCapitalize="words"
              returnKeyType="next"
              value={firstName}
              onChangeText={setFirstName}
              onSubmitEditing={() => usernameInputRef.current?.focus()}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              usernameError && styles.inputContainerError,
            ]}>
            <Ionicons name="person-outline" size={20} color="#888" />
            <TextInput
              ref={usernameInputRef}
              style={styles.input}
              placeholder="Username (min 7 characters)"
              placeholderTextColor="#888"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSetupProfile}
            />
          </View>

          {usernameError && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color="#FF4444" />
              <Text style={styles.errorText}>{usernameError}</Text>
            </View>
          )}

          {usernameSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try these instead:</Text>
              {usernameSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleUseSuggestion(suggestion)}>
                  <Ionicons name="sparkles" size={16} color="#4A90E2" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4A90E2" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color="#4A90E2" />
            <Text style={styles.uploadButtonText}>
              {profileImage
                ? "Change Profile Photo"
                : "Upload Profile Photo (optional)"}
            </Text>
            {profileImage && (
              <Ionicons name="checkmark-circle" size={20} color="#71D29C" />
            )}
          </TouchableOpacity>

          {profileImage && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: profileImage }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProfileImage(null)}>
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[loading && styles.continueButtonDisabled]}
            onPress={handleSetupProfile}
            disabled={loading}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.continueButtonGradient}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderPasswordSetup = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Phone</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Email</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("profile_setup")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Complete Your Profile {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>

          <Text style={styles.stepHeading}>Almost There!</Text>
          <Text style={styles.stepSubheading}>Create Password</Text>
          <Text style={styles.stepNote}>
            Think of a password for your account!
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSetupPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {passwordStrength && (
            <View style={styles.passwordStrengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${
                      (passwordStrength.checks.length ? 1 : 0) * 33.33 +
                      (passwordStrength.checks.number ? 1 : 0) * 33.33 +
                      (passwordStrength.checks.symbol ? 1 : 0) * 33.33
                    }%`,
                    backgroundColor: passwordStrength.color,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.passwordRequirements}>
            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength?.checks.length
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength?.checks.length ? "#71D29C" : "#888"}
              />
              <Text style={styles.requirementText}>
                8-20 characters with uppercase and lowercase
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength?.checks.number
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength?.checks.number ? "#71D29C" : "#888"}
              />
              <Text style={styles.requirementText}>A number</Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name={
                  passwordStrength?.checks.symbol
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={passwordStrength?.checks.symbol ? "#71D29C" : "#888"}
              />
              <Text style={styles.requirementText}>A symbol</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleSetupPassword}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderEmailSetup = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Email</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("password_setup")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Add your Email {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" />
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSetupEmail}
            />
          </View>

          <TouchableOpacity
            style={[loading && styles.sendCodeButtonDisabled]}
            onPress={handleSetupEmail}
            disabled={loading}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.sendCodeButton}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendCodeButtonText}>Send Code</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderEmailVerification = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          <Text style={styles.signUpHeader}>Sign up</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextActive}>Email</Text>
              <View style={styles.tabIndicator} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep("email_setup")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.stepTitle}>
            Verify your Email {getProgressText()}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>

          <Text style={styles.stepHeading}>Confirm Your Email</Text>
          <Text style={styles.stepNote}>
            Please enter the 6-digit code we sent to {email}
          </Text>

          <View style={styles.emailOtpContainer}>
            {emailOtpDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={emailOtpRefs[index]}
                style={[styles.emailOtpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleEmailOTPInput(index, value)}
                onKeyPress={({ nativeEvent }) =>
                  handleEmailOTPKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={1}
                returnKeyType={index === 5 ? "done" : "next"}
              />
            ))}
          </View>

          <Text style={styles.verificationNote}>
            Didn&apos;t receive an email or something went wrong
          </Text>

          <TouchableOpacity>
            <Text style={styles.resendLink}>
              Didn&apos;t Receive the OTP? Resend Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={emailOtpDigits.join("").length !== 6}>
            <LinearGradient
              colors={["#76C4FF", "#0449D3", "#0348D3"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                styles.verifyButton,
                emailOtpDigits.join("").length !== 6 &&
                  styles.verifyButtonDisabled,
              ]}>
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to Sandrelles{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  const renderCompletion = () => (
    <View style={styles.contentContainer}>
      <View style={styles.successIconContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={60} color="#71D29C" />
        </View>
      </View>

      <Text style={styles.successTitle}>
        Your account{"\n"}was successfully created!
      </Text>
      <Text style={styles.successSubtitle}>
        Only one click to explore Sandrelle Salon
      </Text>

      <Text style={styles.successDivider}>OR</Text>

      <Text style={styles.successNote}>
        Would you like to set-up your email now or would you like to set it up
        later on your profile information?{" "}
        <Text style={styles.successLink}>Learn More</Text>
      </Text>

      <TouchableOpacity onPress={() => router.push("/(auth)")}>
        <LinearGradient
          colors={["#76C4FF", "#0449D3", "#0348D3"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.successButton}>
          <Text style={styles.successButtonText}>Go to Login</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.successDivider}>OR</Text>

      <TouchableOpacity
        style={styles.successButtonSecondary}
        onPress={() => router.push("/(tabs)")}>
        <Text style={styles.successButtonSecondaryText}>Set-up Email</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/Main_BG_Top.png")}
        style={styles.backgroundImageTop}
        resizeMode="cover"
      />
      <Image
        source={require("../../assets/images/Main_BG_Bottom.png")}
        style={styles.backgroundImageBottom}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        {currentStep === "role_selection" && renderRoleSelection()}
        {currentStep === "onboarding" && renderOnboarding()}
        {currentStep === "auth_method" && renderAuthMethod()}
        {currentStep === "phone_entry" && renderPhoneEntry()}
        {currentStep === "phone_verification" && renderPhoneVerification()}
        {currentStep === "profile_setup" && renderProfileSetup()}
        {currentStep === "password_setup" && renderPasswordSetup()}
        {currentStep === "email_setup" && renderEmailSetup()}
        {currentStep === "email_verification" && renderEmailVerification()}
        {currentStep === "completion" && renderCompletion()}
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundImageBottom: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
    opacity: 100,
  },
  backgroundImageTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
    opacity: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  keyboardAvoidingView: {
    flex: 1,
  },

  // Logo and Branding
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  salonLogo: {
    width: 120,
    height: 120,
  },

  // Typography
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  subNote: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  signUpHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    color: "#B0B0B0",
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 8,
  },
  stepHeading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 24,
    marginBottom: 8,
  },
  stepSubheading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  stepNote: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },

  // Illustration
  illustrationContainer: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  illustrationImage: {
    width: "80%",
    height: "100%",
  },

  // Role Selection
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 31, 0.8)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(42, 42, 42, 0.5)",
    marginBottom: 12,
  },
  roleButtonActive: {
    borderColor: "#4A90E2",
    backgroundColor: "rgba(74, 144, 226, 0.1)",
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(42, 42, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  roleIconActive: {
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    borderColor: "#4A90E2",
  },
  roleIconImage: {
    width: 24,
    height: 24,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  roleTextActive: {
    color: "#4A90E2",
  },
  roleDescription: {
    fontSize: 13,
    color: "#B0B0B0",
  },
  roleCheckmark: {
    marginLeft: 8,
  },
  roleNote: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  // Buttons
  nextButton: {
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 24,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  nextButtonIcon: {
    // Icon styling if needed
  },
  continueButton: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    marginHorizontal: 24,
  },
  continueButtonGradient: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  authMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 26, 31, 0.9)",
    borderRadius: 25,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
    marginBottom: 16,
    gap: 12,
  },
  authMethodIcon: {
    width: 20,
    height: 20,
  },
  authMethodText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 26, 31, 0.9)",
    borderRadius: 25,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
    gap: 12,
  },
  socialButtonIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  sendCodeButton: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  sendCodeButtonDisabled: {
    opacity: 0.6,
  },
  sendCodeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  verifyButton: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 26, 31, 0.9)",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.5)",
    marginTop: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "600",
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  dividerText: {
    color: "#888",
    fontSize: 13,
  },

  // Terms
  terms: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  termsLink: {
    color: "#4A90E2",
    textDecorationLine: "underline",
  },

  // Login Link
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 13,
    color: "#888",
  },
  loginLink: {
    fontSize: 13,
    color: "#4A90E2",
    fontWeight: "600",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: "center",
    position: "relative",
  },
  tabText: {
    color: "#888",
    fontSize: 15,
  },
  tabTextActive: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4A90E2",
  },

  // Back Button
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
  },

  // Progress Bar
  progressBar: {
    height: 3,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A90E2",
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 8,
  },
  countryCodeText: {
    color: "#fff",
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    color: "#fff",
    fontSize: 15,
  },
  phoneNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },

  // Generic Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
    marginTop: 16,
  },
  inputContainerError: {
    borderColor: "#FF4444",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#FF4444",
    flex: 1,
  },

  // Suggestions
  suggestionsContainer: {
    marginTop: 12,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  suggestionText: {
    color: "#4A90E2",
    fontSize: 14,
    flex: 1,
  },

  // OTP Input
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  otpInput: {
    width: 56,
    height: 56,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: "#4A90E2",
  },
  emailOtpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  emailOtpInput: {
    width: 48,
    height: 48,
    backgroundColor: "#1A1A1F",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  // Resend
  resendText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  resendLink: {
    fontSize: 13,
    color: "#4A90E2",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
  },
  verificationNote: {
    fontSize: 12,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },

  // Password Strength
  passwordStrengthBar: {
    height: 3,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 12,
  },
  strengthFill: {
    height: "100%",
  },
  passwordRequirements: {
    marginTop: 16,
    gap: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: "#B0B0B0",
  },

  // Carousel
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselSlide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  carouselImageContainer: {
    width: width - 48,
    height: 400,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  carouselTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 32,
  },
  carouselDescription: {
    fontSize: 14,
    color: "#E0E0E0",
    textAlign: "center",
    lineHeight: 20,
  },
  carouselDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A90E2",
  },
  dotActive: {
    backgroundColor: "#4A90E2",
  },

  // Onboarding
  onboardingContainer: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  onboardingActions: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Success/Completion
  successIconContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(113, 210, 156, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  successDivider: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginVertical: 20,
  },
  successNote: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  successLink: {
    color: "#4A90E2",
    textDecorationLine: "underline",
  },
  successButton: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 32,
  },
  successButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  successButtonSecondary: {
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: "#4A90E2",
    backgroundColor: "transparent",
  },
  successButtonSecondaryText: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "700",
  },

  // Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  alertContainer: {
    backgroundColor: "#1A1A1F",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  alertButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#4A90E2",
  },
  alertButtonSuccess: {
    backgroundColor: "transparent",
  },
  alertButtonError: {
    backgroundColor: "#FF4444",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Add these to your styles object in SignUp.tsx

  imagePreviewContainer: {
    alignItems: "center",
    marginTop: 16,
    position: "relative",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1A1F",
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
  },
});
