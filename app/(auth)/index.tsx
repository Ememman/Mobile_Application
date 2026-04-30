import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../api/apiClient";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants/icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type LoginStep = "initial" | "roleSelection" | "loginForm" | "forgotPassword";
type UserRole = "customer" | "salon_staff";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: "info" | "success" | "error";
}

interface LoginError {
  type:
    | "DELAY_ACTIVE"
    | "DELAYED_ERROR"
    | "INVALID_CREDENTIALS"
    | "UNKNOWN_ERROR";
  message: string;
  remainingTime?: number;
  delaySeconds?: number;
  failedAttempts?: number;
  delayActive?: boolean;
  recommendForgotPassword?: boolean;
  forgotPasswordMessage?: string;
}

// Enhanced Floating Label Input Component
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  placeholder = "",
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  returnKeyType = "done",
  onSubmitEditing,
  icon,
  error,
  ref,
  style,
  showPasswordToggle = false,
  onTogglePassword,
  editable = true,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: "done" | "next" | "search" | "send" | "go";
  onSubmitEditing?: () => void;
  icon?: string;
  error?: string;
  ref?: React.Ref<TextInput>;
  style?: any;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  editable?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedIsFocused]);

  const labelStyle = {
    position: "absolute" as "absolute",
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["#888", "#4A90E2"],
    }),
    backgroundColor: "#1F1C1C",
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={[styles.floatingInputContainer, style]}>
      <View
        style={[
          styles.floatingInputWrapper,
          isFocused && styles.floatingInputFocused,
          error && styles.floatingInputError,
          !editable && styles.floatingInputDisabled,
        ]}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={isFocused ? "#4A90E2" : "#888"}
            style={styles.floatingInputIcon}
          />
        )}
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          ref={ref}
          style={[
            styles.floatingInput,
            !editable && styles.floatingInputTextDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ""}
          placeholderTextColor="#666"
          editable={editable}
          {...props}
        />
        {showPasswordToggle && onTogglePassword && (
          <TouchableOpacity
            onPress={onTogglePassword}
            style={styles.eyeIcon}
            disabled={!editable}>
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={editable ? "#888" : "#555"}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.floatingErrorContainer}>
          <Ionicons name="warning-outline" size={14} color="#FF4444" />
          <Text style={styles.floatingErrorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

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

// ✅ UPDATED Countdown Timer Component with Real-time Updates
const CountdownTimer = ({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    console.log(`🕒 CountdownTimer: Initializing with ${seconds} seconds`);
    // Reset timer when seconds prop changes
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    console.log(`🕒 CountdownTimer: Starting timer with ${timeLeft} seconds`);

    if (timeLeft <= 0) {
      console.log("✅ CountdownTimer: Timer completed");
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        console.log(`🕒 CountdownTimer: ${prev} -> ${newTime} seconds`);

        if (newTime <= 0) {
          console.log("✅ CountdownTimer: Timer reached 0");
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      console.log("🧹 CountdownTimer: Cleaning up timer");
      clearInterval(timer);
    };
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.countdownContainer}>
      <View style={styles.countdownHeader}>
        <Ionicons name="lock-closed-outline" size={20} color="#FFA500" />
        <Text style={styles.countdownTitle}>Account Temporarily Locked</Text>
      </View>
      <Text style={styles.countdownText}>
        Too many failed attempts. Please wait:
      </Text>
      <Text style={styles.countdownTime}>{formatTime(timeLeft)}</Text>
      <Text style={styles.countdownSubtext}>
        Youll be able to try again when the timer ends
      </Text>
    </View>
  );
};

// ✅ NEW: Real-time Countdown Display Component
const RealTimeCountdown = ({
  remainingTime,
  onComplete,
}: {
  remainingTime: number;
  onComplete: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    console.log(`⏰ RealTimeCountdown: Updated to ${remainingTime} seconds`);
    setTimeLeft(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      console.log("✅ RealTimeCountdown: Timer completed");
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.realTimeCountdownContainer}>
      <View style={styles.realTimeCountdownHeader}>
        <Ionicons name="time-outline" size={18} color="#FFA500" />
        <Text style={styles.realTimeCountdownTitle}>
          Time Remaining: {formatTime(timeLeft)}
        </Text>
      </View>
      <Text style={styles.realTimeCountdownText}>
        You can try again in {timeLeft} seconds
      </Text>
    </View>
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
    type: "info" | "success" | "error" = "info"
  ) => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return { alert, showAlert, hideAlert };
};

export default function Login() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<LoginStep>("initial");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ ENHANCED Delay state management with real-time updates
  const [delayActive, setDelayActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPasswordSuggestion, setShowForgotPasswordSuggestion] =
    useState(false);

  // Forgot password states
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<
    "request" | "reset"
  >("request");

  // Alert hook
  const { alert, showAlert, hideAlert } = useAlert();

  // Debug effect for delay state
  useEffect(() => {
    console.log("🔐 Delay State Update:", {
      delayActive,
      remainingTime,
      failedAttempts,
      showForgotPasswordSuggestion,
    });
  }, [
    delayActive,
    remainingTime,
    failedAttempts,
    showForgotPasswordSuggestion,
  ]);

  // Enhanced: Parse error message to extract structured data
  const parseLoginError = (errorMessage: string): LoginError => {
    try {
      return JSON.parse(errorMessage);
    } catch {
      return {
        type: "UNKNOWN_ERROR",
        message: errorMessage,
      };
    }
  };

  // ✅ UPDATED: Handle different error types with proper delay handling
  const handleLoginError = (error: LoginError) => {
    console.log("🔐 Handling login error:", error);

    switch (error.type) {
      case "DELAY_ACTIVE":
        // Account is temporarily locked, show countdown
        const delaySeconds = error.remainingTime || 0;
        console.log(`⏰ Setting delay active for ${delaySeconds} seconds`);

        setDelayActive(true);
        setRemainingTime(delaySeconds);
        setFailedAttempts(error.failedAttempts || 0);
        setError(
          `Too many failed attempts. Please wait ${delaySeconds} seconds before trying again.`
        );
        showAlert("Account Temporarily Locked", error.message, "error");
        break;

      case "DELAYED_ERROR":
        // Invalid credentials with active delay (after 3+ attempts)
        const delayedSeconds = error.delaySeconds || 0;
        console.log(`⏰ Delayed error with ${delayedSeconds} seconds`);

        setDelayActive(error.delayActive || false);
        setRemainingTime(delayedSeconds);
        setFailedAttempts(error.failedAttempts || 0);
        setError(error.message);
        setShowForgotPasswordSuggestion(error.recommendForgotPassword || false);

        if (error.recommendForgotPassword) {
          showAlert(
            "Multiple Failed Attempts",
            error.forgotPasswordMessage ||
              "Consider using 'Forgot Password' if you can't remember your password.",
            "error"
          );
        }
        break;

      case "INVALID_CREDENTIALS":
        // Regular invalid credentials (first 3 attempts)
        setFailedAttempts(error.failedAttempts || 0);
        setError(error.message);
        setDelayActive(false);
        setRemainingTime(0);
        setShowForgotPasswordSuggestion(false);

        // Show warning for attempts 2-3
        if (error.failedAttempts && error.failedAttempts >= 2) {
          showAlert(
            "Invalid Credentials",
            `You have ${
              4 - error.failedAttempts
            } attempt(s) remaining before a delay is applied.`,
            "error"
          );
        }
        break;

      default:
        // Unknown error
        setError(error.message);
        setDelayActive(false);
        setRemainingTime(0);
        setShowForgotPasswordSuggestion(false);
        showAlert("Login Failed", error.message, "error");
        break;
    }
  };

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    if (delayActive) {
      setError(`Please wait ${remainingTime} seconds before trying again.`);
      return;
    }

    setLoading(true);
    setError("");
    setShowForgotPasswordSuggestion(false);

    try {
      const response = await apiClient.login(
        emailOrPhone,
        password,
        selectedRole
      );

      console.log("🔐 Login API Response:", response);

      if (response.success) {
        // Reset error states on successful login
        console.log("✅ Login successful, resetting delay states");
        setDelayActive(false);
        setFailedAttempts(0);
        setRemainingTime(0);
        setShowForgotPasswordSuggestion(false);

        showAlert("Success", "Login successful!", "success");
        // Navigate to main app (tabs) after a brief delay
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        // ✅ FIXED: Handle API response with delay information
        if (response.delayActive) {
          console.log("⏰ API Response indicates delay is active:", response);
          setDelayActive(true);
          setRemainingTime(response.remainingTime || 0);
          setFailedAttempts(response.failedAttempts || 0);
          setError(
            response.message || "Too many failed attempts. Please wait."
          );
        } else {
          setError(response.message || "Login failed. Please try again.");
          setFailedAttempts(response.failedAttempts || 0);
        }
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err);
      const loginError = parseLoginError(err.message);
      handleLoginError(loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);

    // Automatically redirect to staff login when staff is selected
    if (role === "salon_staff") {
      // Navigate to staff login page
      router.push("/(staff)/(auth)");
      return;
    }
  };

  const handleNextFromRoleSelection = () => {
    if (!selectedRole) {
      showAlert(
        "Role Required",
        "Please select your account type to continue.",
        "error"
      );
      return;
    }

    // If staff is selected, redirect to staff auth
    if (selectedRole === "salon_staff") {
      router.push("/(staff)/(auth)");
      return;
    }

    // For customer, continue with normal flow
    setCurrentStep("loginForm");
  };

  const handleForgotPassword = () => {
    setCurrentStep("forgotPassword");
    setForgotPasswordStep("request");
    setForgotPasswordEmail("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotPasswordEmail.trim()) {
      showAlert("Error", "Please enter your email or phone number", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.forgotPassword(forgotPasswordEmail);

      if (response.success) {
        // ✅ FIXED: Show which channel was used
        const isEmail = forgotPasswordEmail.includes("@");
        const channelInfo = isEmail
          ? `📧 Password reset code sent to your email: ${forgotPasswordEmail}`
          : `📱 Password reset code sent to your phone`;

        showAlert("Success", response.message || channelInfo, "success");
        setForgotPasswordStep("reset");
      } else {
        showAlert(
          "Error",
          response.message || "Failed to send reset instructions",
          "error"
        );
      }
    } catch (error: any) {
      showAlert(
        "Error",
        error.message || "Failed to process your request",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert("Error", "Please fill in all fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.resetPassword(
        resetToken,
        newPassword,
        forgotPasswordEmail
      );

      if (response.success) {
        showAlert(
          "Success",
          response.message || "Password reset successfully!",
          "success"
        );
        // Return to login form after successful reset
        setTimeout(() => {
          setCurrentStep("loginForm");
          setForgotPasswordStep("request");
          // Reset delay states after password reset
          setDelayActive(false);
          setFailedAttempts(0);
          setRemainingTime(0);
        }, 2000);
      } else {
        showAlert(
          "Error",
          response.message || "Failed to reset password",
          "error"
        );
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/(auth)/SignUp");
  };

  const handleBack = () => {
    if (currentStep === "forgotPassword") {
      setCurrentStep("loginForm");
    } else if (currentStep === "loginForm") {
      setCurrentStep("roleSelection");
    } else if (currentStep === "roleSelection") {
      setCurrentStep("initial");
    }
  };

  // ✅ FIXED: Handle countdown completion
  const handleCountdownComplete = () => {
    console.log("✅ Countdown completed, resetting delay states");

    setDelayActive(false);
    setRemainingTime(0);
    setFailedAttempts(0);
    setError("");
    setShowForgotPasswordSuggestion(true);

    // Show message that user can try again
    showAlert(
      "Cooldown Complete",
      "You can now try to login again. Consider using 'Forgot Password' if you're having trouble.",
      "info"
    );
  };

  // ✅ ENHANCED: Get attempt feedback message with exact timing
  const getAttemptFeedback = () => {
    if (failedAttempts === 0) return null;

    if (failedAttempts <= 3) {
      return {
        message: `Attempt ${failedAttempts} of 3 - No delay yet`,
        type: "warning" as const,
      };
    } else {
      const delays = [10, 15, 20, 25, 30, 40, 50, 60];
      const delayIndex = Math.min(failedAttempts - 4, delays.length - 1);
      return {
        message: `Attempt ${failedAttempts} - ${delays[delayIndex]} second delay applied`,
        type: "error" as const,
      };
    }
  };

  // ✅ NEW: Get button text based on current state
  const getLoginButtonText = () => {
    if (loading) {
      return "Logging In...";
    }
    if (delayActive) {
      return `Please Wait... (${remainingTime}s)`;
    }
    return "Log In";
  };

  // Initial screen with login options
  if (currentStep === "initial") {
    return (
      <View style={styles.container}>
        {/* Background Images */}
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
          <View style={styles.contentContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/SalonLogoSignUp.png")}
                style={styles.salonLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Login Account</Text>
            <Text style={styles.subtitle}>
              Your Sanctuary of Glow & Confidence
            </Text>

            {/* Welcome Message */}
            <Text style={styles.welcomeText}>
              Welcome back! Ready for{"\n"}your next glam session?
            </Text>

            {/* Login Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.authMethodButton}
                onPress={() => setCurrentStep("roleSelection")}>
                <Image source={icons.email} style={styles.authMethodIcon} />
                <Text style={styles.authMethodText}>
                  Use Phone Number or Email
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.socialButton}>
                <Image
                  source={icons.facebook}
                  style={styles.socialButtonIcon}
                />
                <Text style={styles.socialButtonText}>
                  Continue with Facebook
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Image source={icons.google} style={styles.socialButtonIcon} />
                <Text style={styles.socialButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.terms}>
                By signing in, you agree to SandreaLee&apos;s{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Don&apos;t have an account?{" "}
                </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.loginLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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

  // Role Selection Screen
  if (currentStep === "roleSelection") {
    return (
      <View style={styles.container}>
        {/* Background Images */}
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
          <View style={styles.contentContainer}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/SalonLogoSignUp.png")}
                style={styles.salonLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Log into Account</Text>
            <Text style={styles.subtitle}>
              Your Sanctuary of Glow & Confidence
            </Text>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../assets/images/SignUpIllustration.png")}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>

            {/* Select Roles */}
            <Text style={styles.sectionTitle}>Select Account Type</Text>

            <View style={styles.rolesContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "salon_staff" && styles.roleButtonActive,
                ]}
                onPress={() => handleRoleSelection("salon_staff")}>
                <View
                  style={[
                    styles.roleIcon,
                    selectedRole === "salon_staff" && styles.roleIconActive,
                  ]}>
                  <Image source={icons.staff} style={styles.roleIconImage} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === "salon_staff" && styles.roleTextActive,
                    ]}>
                    Salon Staff
                  </Text>
                  <Text style={styles.roleDescription}>
                    Professional service providers
                  </Text>
                </View>
                {selectedRole === "salon_staff" && (
                  <View style={styles.roleCheckmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4A90E2"
                    />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === "customer" && styles.roleButtonActive,
                ]}
                onPress={() => handleRoleSelection("customer")}>
                <View
                  style={[
                    styles.roleIcon,
                    selectedRole === "customer" && styles.roleIconActive,
                  ]}>
                  <Image source={icons.customer} style={styles.roleIconImage} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === "customer" && styles.roleTextActive,
                    ]}>
                    Customer
                  </Text>
                  <Text style={styles.roleDescription}>
                    Beauty and wellness seekers
                  </Text>
                </View>
                {selectedRole === "customer" && (
                  <View style={styles.roleCheckmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4A90E2"
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.roleNote}>
              Choose your account type to get started with your beauty journey
            </Text>

            <TouchableOpacity
              disabled={!selectedRole}
              onPress={handleNextFromRoleSelection}>
              <LinearGradient
                colors={
                  selectedRole
                    ? ["#76C4FF", "#0449D3", "#0348D3"]
                    : ["#444", "#333", "#222"]
                }
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.nextButton}>
                <Text style={styles.nextButtonText}>
                  {selectedRole === "salon_staff"
                    ? "Continue to Staff Portal"
                    : "Continue to Customer Login"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                  style={styles.nextButtonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.loginLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  // Forgot Password Screen
  if (currentStep === "forgotPassword") {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 100, android: 0 })}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              {/* Background Images */}
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
                <View style={styles.contentContainer}>
                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Logo */}
                  <View style={styles.logoContainer}>
                    <Image
                      source={require("../../assets/images/SalonLogoSignUp.png")}
                      style={styles.salonLogo}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Title */}
                  <Text style={styles.title}>
                    {forgotPasswordStep === "request"
                      ? "Reset Password"
                      : "Create New Password"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {forgotPasswordStep === "request"
                      ? "Enter your email or phone number to receive reset instructions"
                      : "Enter the reset token and your new password"}
                  </Text>

                  {/* Form */}
                  <View style={styles.formContainer}>
                    {forgotPasswordStep === "request" ? (
                      <>
                        {/* Email/Phone Input with Floating Label */}
                        <FloatingLabelInput
                          label="Email or Phone Number"
                          value={forgotPasswordEmail}
                          onChangeText={setForgotPasswordEmail}
                          keyboardType="default"
                          autoCapitalize="none"
                          returnKeyType="done"
                          icon="mail-outline"
                        />

                        <TouchableOpacity
                          style={[loading && styles.sendCodeButtonDisabled]}
                          onPress={handleRequestPasswordReset}
                          disabled={loading}>
                          <LinearGradient
                            colors={["#76C4FF", "#0449D3", "#0348D3"]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.sendCodeButton}>
                            {loading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.sendCodeButtonText}>
                                Send Reset Instructions
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {/* Reset Token Input with Floating Label */}
                        <FloatingLabelInput
                          label="Reset Token"
                          value={resetToken}
                          onChangeText={setResetToken}
                          autoCapitalize="none"
                          returnKeyType="next"
                          icon="key-outline"
                        />

                        {/* New Password Input with Floating Label */}
                        <FloatingLabelInput
                          label="New Password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          returnKeyType="next"
                          icon="lock-closed-outline"
                          showPasswordToggle={true}
                          onTogglePassword={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                        />

                        {/* Confirm Password Input with Floating Label */}
                        <FloatingLabelInput
                          label="Confirm Password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          returnKeyType="done"
                          icon="lock-closed-outline"
                          showPasswordToggle={true}
                          onTogglePassword={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        />

                        <TouchableOpacity
                          style={[loading && styles.sendCodeButtonDisabled]}
                          onPress={handleResetPassword}
                          disabled={loading}>
                          <LinearGradient
                            colors={["#76C4FF", "#0449D3", "#0348D3"]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.sendCodeButton}>
                            {loading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.sendCodeButtonText}>
                                Reset Password
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>
                      Remember your password?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCurrentStep("loginForm")}>
                      <Text style={styles.loginLink}>Back to Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

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

  // Login Form Screen
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 100, android: 0 })}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Background Images */}
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
              <View style={styles.contentContainer}>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../../assets/images/SalonLogoSignUp.png")}
                    style={styles.salonLogo}
                    resizeMode="contain"
                  />
                </View>

                {/* Title */}
                <Text style={styles.title}>Log into Account</Text>
                <Text style={styles.subtitle}>
                  Welcome back to your beauty journey
                </Text>

                {/* Enhanced Attempt Feedback */}
                {getAttemptFeedback() && (
                  <View
                    style={[
                      styles.attemptFeedbackContainer,
                      getAttemptFeedback()?.type === "error" &&
                        styles.attemptFeedbackError,
                      getAttemptFeedback()?.type === "warning" &&
                        styles.attemptFeedbackWarning,
                    ]}>
                    <Ionicons
                      name={
                        getAttemptFeedback()?.type === "error"
                          ? "warning"
                          : "information-circle"
                      }
                      size={16}
                      color={
                        getAttemptFeedback()?.type === "error"
                          ? "#FF4444"
                          : "#FFA500"
                      }
                    />
                    <Text style={styles.attemptFeedbackText}>
                      {getAttemptFeedback()?.message}
                    </Text>
                  </View>
                )}

                {/* ✅ UPDATED: Real-time Countdown Display */}
                {delayActive && remainingTime > 0 && (
                  <View style={styles.countdownSection}>
                    <RealTimeCountdown
                      remainingTime={remainingTime}
                      onComplete={handleCountdownComplete}
                    />

                    {/* FIXED Countdown Timer for visual emphasis */}
                    <CountdownTimer
                      seconds={remainingTime}
                      onComplete={handleCountdownComplete}
                    />
                  </View>
                )}

                {/* Form */}
                <View style={styles.formContainer}>
                  {/* Login Disabled Overlay */}
                  {delayActive && (
                    <View style={styles.loginDisabledOverlay}>
                      <Text style={styles.loginDisabledText}>
                        Login disabled during cooldown period
                      </Text>
                    </View>
                  )}

                  {/* Email/Phone Input with Floating Label */}
                  <FloatingLabelInput
                    label="Phone number or email address"
                    value={emailOrPhone}
                    onChangeText={(text) => {
                      setEmailOrPhone(text);
                      setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    icon="mail-outline"
                    editable={!delayActive}
                  />

                  {/* Password Input with Floating Label */}
                  <FloatingLabelInput
                    label="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    icon="lock-closed-outline"
                    showPasswordToggle={true}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    editable={!delayActive}
                  />

                  {/* Error Message */}
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#FF4444" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Forgot Password Suggestion */}
                  {showForgotPasswordSuggestion && (
                    <View style={styles.forgotPasswordSuggestionContainer}>
                      <Ionicons name="key-outline" size={16} color="#4A90E2" />
                      <Text style={styles.forgotPasswordSuggestionText}>
                        Having trouble? Try{" "}
                        <Text
                          style={styles.forgotPasswordSuggestionLink}
                          onPress={handleForgotPassword}>
                          Forgot Password
                        </Text>
                      </Text>
                    </View>
                  )}

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* ✅ UPDATED Login Button with Real-time Countdown */}
                  <TouchableOpacity
                    style={[
                      (loading || delayActive) && styles.continueButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={loading || delayActive}>
                    <LinearGradient
                      colors={
                        loading || delayActive
                          ? ["#444", "#333", "#222"]
                          : ["#76C4FF", "#0449D3", "#0348D3"]
                      }
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.continueButtonGradient}>
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.continueButtonText}>
                          {getLoginButtonText()}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.terms}>
                    By signing in, you agree to SandreaLee&apos;s{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>
                      Don&apos;t have an account?{" "}
                    </Text>
                    <TouchableOpacity onPress={handleSignUp}>
                      <Text style={styles.loginLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
  backgroundImageTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  backgroundImageBottom: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
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
    paddingBottom: 40,
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

  // ✅ NEW: Countdown Section
  countdownSection: {
    marginBottom: 16,
    gap: 12,
  },

  // Enhanced Countdown Timer Styles
  countdownContainer: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 165, 0, 0.3)",
    alignItems: "center",
  },
  countdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  countdownTitle: {
    color: "#FFA500",
    fontSize: 16,
    fontWeight: "700",
  },
  countdownText: {
    color: "#FFA500",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  countdownTime: {
    color: "#FFA500",
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 4,
  },
  countdownSubtext: {
    color: "#FFA500",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },

  // ✅ NEW: Real-time Countdown Styles
  realTimeCountdownContainer: {
    backgroundColor: "rgba(255, 165, 0, 0.15)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.4)",
  },
  realTimeCountdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  realTimeCountdownTitle: {
    color: "#FFA500",
    fontSize: 14,
    fontWeight: "600",
  },
  realTimeCountdownText: {
    color: "#FFA500",
    fontSize: 12,
    opacity: 0.9,
  },

  // Enhanced Attempt Feedback Styles
  attemptFeedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  attemptFeedbackWarning: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.3)",
  },
  attemptFeedbackError: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  attemptFeedbackText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  // Login Disabled Overlay
  loginDisabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    zIndex: 10,
  },
  loginDisabledText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Forgot Password Suggestion Styles
  forgotPasswordSuggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
    marginBottom: 16,
    gap: 8,
  },
  forgotPasswordSuggestionText: {
    color: "#4A90E2",
    fontSize: 13,
    flex: 1,
  },
  forgotPasswordSuggestionLink: {
    color: "#4A90E2",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Floating Input Styles
  floatingInputContainer: {
    marginBottom: 20,
  },
  floatingInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    position: "relative",
  },
  floatingInputFocused: {
    borderColor: "#4A90E2",
  },
  floatingInputError: {
    borderColor: "#FF4444",
  },
  floatingInputDisabled: {
    opacity: 0.6,
    backgroundColor: "#2A2A2A",
  },
  floatingInputIcon: {
    marginRight: 12,
  },
  floatingInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  floatingInputTextDisabled: {
    color: "#888",
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  floatingErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  floatingErrorText: {
    fontSize: 12,
    color: "#FF4444",
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
  welcomeText: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },

  // Back Button
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 8,
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

  // Options Container
  optionsContainer: {
    marginBottom: 40,
  },

  // Buttons
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

  // Role Selection
  rolesContainer: {
    gap: 12,
    marginBottom: 16,
  },
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

  // Form
  formContainer: {
    marginTop: 32,
    position: "relative",
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#FF4444",
    flex: 1,
  },

  // Forgot Password
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPassword: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "500",
  },

  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 40,
  },
  terms: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
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
});
