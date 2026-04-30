"use client";

import { useState, useRef } from "react";
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
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { staffApiClient } from "../../lib/staffApiClient";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants/icons";

type LoginStep = "initial" | "loginForm" | "forgotPassword";

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
    type: "info" | "success" | "error" = "info"
  ) => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return { alert, showAlert, hideAlert };
};

// Floating Label Input Component
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  icon,
  onShowPassword,
  showPassword = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  icon: string;
  onShowPassword?: () => void;
  showPassword?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (text && !isFocused) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    position: "absolute" as const,
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["#888", "#4A90E2"],
    }),
    backgroundColor: "#1F1C1C",
    paddingHorizontal: 10,
    zIndex: 1,
  };

  return (
    <View style={styles.floatingInputContainer}>
      <View
        style={[
          styles.floatingInputWrapper,
          isFocused && styles.floatingInputWrapperFocused,
        ]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={isFocused ? "#4A90E2" : "#888"}
          style={styles.floatingInputIcon}
        />
        <TextInput
          style={styles.floatingInput}
          value={value}
          onChangeText={handleTextChange}
          placeholder={isFocused ? placeholder : ""}
          placeholderTextColor="#888"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor="#4A90E2"
        />
        {secureTextEntry && onShowPassword && (
          <TouchableOpacity onPress={onShowPassword} style={styles.eyeIcon}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={isFocused ? "#4A90E2" : "#888"}
            />
          </TouchableOpacity>
        )}
      </View>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
    </View>
  );
};

export default function StaffLogin() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<LoginStep>("initial");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await staffApiClient.login({
        emailOrPhone,
        password,
        role: "salon_staff",
      });

      if (response.success) {
        showAlert("Success", "Welcome back to your workspace!", "success");
        // Navigate to staff home after a brief delay
        setTimeout(() => {
          router.replace("/(staff)/(staff-tabs)/home");
        }, 1500);
      } else {
        setError(response.message || "Login failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[v0] Staff login error:", err);
      const errorMessage =
        err.message || "Invalid staff credentials. Please try again.";
      setError(errorMessage);

      // Show alert for specific error cases
      if (
        err.message?.includes("Too many failed attempts") ||
        err.message?.includes("wait")
      ) {
        showAlert("Account Temporarily Locked", errorMessage, "error");
      } else if (err.message?.includes("Authentication failed")) {
        showAlert(
          "Login Failed",
          "Please check your credentials and try again.",
          "error"
        );
      } else {
        showAlert("Login Failed", errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
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
      showAlert(
        "Error",
        "Please enter your staff email or phone number",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await staffApiClient.forgotPassword(forgotPasswordEmail);

      if (response.success) {
        const isEmail = forgotPasswordEmail.includes("@");
        const channelInfo = isEmail
          ? `📧 Password reset code sent to your staff email: ${forgotPasswordEmail}`
          : `📱 Password reset code sent to your registered phone`;

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
      const response = await staffApiClient.resetPassword(
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

  const handleBack = () => {
    if (currentStep === "forgotPassword") {
      setCurrentStep("loginForm");
    } else if (currentStep === "loginForm") {
      setCurrentStep("initial");
    } else if (currentStep === "initial") {
      // Go back to role selection in main app
      router.back();
    }
  };

  const handleSwitchToCustomer = () => {
    router.replace("/(auth)");
  };

  // Initial screen with staff welcome
  if (currentStep === "initial") {
    return (
      <View style={styles.container}>
        {/* Background Images */}
        <Image
          source={require("../../../assets/images/Main_BG_Top.png")}
          style={styles.backgroundImageTop}
          resizeMode="cover"
        />
        <Image
          source={require("../../../assets/images/Main_BG_Bottom.png")}
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
                source={require("../../../assets/images/SalonLogoSignUp.png")}
                style={styles.salonLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Employee Portal</Text>
            <Text style={styles.subtitle}>SandreaLee Salon Staff System</Text>

            {/* Welcome Message */}
            <Text style={styles.welcomeText}>
              Welcome to your professional workspace{"\n"}
              Access your schedule, track attendance, and enhance your skills
            </Text>

            {/* Staff Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../../assets/images/SignUpIllustration.png")}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>

            {/* Login Button */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.staffLoginButton}
                onPress={() => setCurrentStep("loginForm")}>
                <Image source={icons.staff} style={styles.authMethodIcon} />
                <Text style={styles.staffLoginButtonText}>Employee Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Your account is provided by salon administration.{"\n"}
              Contact manager if you need account assistance.
            </Text>

            {/* Switch to Customer */}
            <TouchableOpacity
              style={styles.switchRoleButton}
              onPress={handleSwitchToCustomer}>
              <Text style={styles.switchRoleText}>
                Are you a customer? Switch to customer login
              </Text>
            </TouchableOpacity>
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
                source={require("../../../assets/images/Main_BG_Top.png")}
                style={styles.backgroundImageTop}
                resizeMode="cover"
              />
              <Image
                source={require("../../../assets/images/Main_BG_Bottom.png")}
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
                      source={require("../../../assets/images/SalonLogoSignUp.png")}
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
                      ? "Enter your staff email or phone number to receive reset instructions"
                      : "Enter the reset token and your new password"}
                  </Text>

                  {/* Form */}
                  <View style={styles.formContainer}>
                    {forgotPasswordStep === "request" ? (
                      <>
                        <FloatingLabelInput
                          label="Email or Phone Number"
                          value={forgotPasswordEmail}
                          onChangeText={setForgotPasswordEmail}
                          placeholder="Enter your email or phone number"
                          keyboardType="default"
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
                        <FloatingLabelInput
                          label="Reset Token"
                          value={resetToken}
                          onChangeText={setResetToken}
                          placeholder="Enter the reset token"
                          keyboardType="default"
                          icon="key-outline"
                        />

                        <FloatingLabelInput
                          label="New Password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="Enter new password"
                          secureTextEntry={true}
                          icon="lock-closed-outline"
                          onShowPassword={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                          showPassword={showNewPassword}
                        />

                        <FloatingLabelInput
                          label="Confirm Password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Confirm new password"
                          secureTextEntry={true}
                          icon="lock-closed-outline"
                          onShowPassword={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          showPassword={showConfirmPassword}
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
              source={require("../../../assets/images/Main_BG_Top.png")}
              style={styles.backgroundImageTop}
              resizeMode="cover"
            />
            <Image
              source={require("../../../assets/images/Main_BG_Bottom.png")}
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
                    source={require("../../../assets/images/SalonLogoSignUp.png")}
                    style={styles.salonLogo}
                    resizeMode="contain"
                  />
                </View>

                {/* Title */}
                <Text style={styles.title}>Employee Login</Text>
                <Text style={styles.subtitle}>
                  Access your staff workspace and tools
                </Text>

                {/* Form */}
                <View style={styles.formContainer}>
                  {/* Email/Phone Input */}
                  <FloatingLabelInput
                    label="Phone number or email address"
                    value={emailOrPhone}
                    onChangeText={(text) => {
                      setEmailOrPhone(text);
                      setError("");
                    }}
                    placeholder="mendozajames@gmail.com"
                    keyboardType="email-address"
                    icon="mail-outline"
                  />

                  {/* Password Input */}
                  <FloatingLabelInput
                    label="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    placeholder="••••••••"
                    secureTextEntry={true}
                    icon="lock-closed-outline"
                    onShowPassword={() => setShowPassword(!showPassword)}
                    showPassword={showPassword}
                  />

                  {/* Error Message */}
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#FF4444" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[loading && styles.continueButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}>
                    <LinearGradient
                      colors={["#76C4FF", "#0449D3", "#0348D3"]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.continueButtonGradient}>
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.continueButtonText}>
                          Sign In to Workspace
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Account Info */}
                <Text style={styles.accountInfoText}>
                  💼 Your staff account is managed by salon administration.
                  {"\n"}
                  Contact your manager for account-related inquiries.
                </Text>

                {/* Switch Role */}
                <TouchableOpacity
                  style={styles.switchRoleButton}
                  onPress={handleSwitchToCustomer}>
                  <Text style={styles.switchRoleText}>
                    Switch to customer login
                  </Text>
                </TouchableOpacity>
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

  // Logo and Branding
  logoContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  salonLogo: {
    top: -50,
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
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  accountInfoText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
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
  staffLoginButton: {
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
  staffLoginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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

  // Form
  formContainer: {
    marginTop: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: "#1A1A1F",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    padding: 0,
    backgroundColor: "transparent",
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
        paddingVertical: 0,
      },
    }),
  },
  eyeIcon: {
    padding: 4,
  },

  // Floating Input Styles
  floatingInputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  floatingInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 16 : 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
    minHeight: 56,
  },
  floatingInputWrapperFocused: {
    borderColor: "#4A90E2",
    backgroundColor: "#1A1A1F",
  },
  floatingInputIcon: {
    marginRight: 12,
  },
  floatingInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    padding: 0,
    backgroundColor: "transparent",
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
        paddingVertical: 0,
      },
    }),
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

  // Switch Role Button
  switchRoleButton: {
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 12,
    padding: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  switchRoleText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 40,
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
