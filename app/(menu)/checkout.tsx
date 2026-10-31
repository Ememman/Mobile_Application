// app/(menu)/checkout.tsx
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { images } from "@/constants/images";
import { apiClient, Cart, CartItem, Product } from "@/app/api/apiClient";
import QRCode from "react-native-qrcode-svg";

type CheckoutScreenType =
  | "delivery"
  | "summary"
  | "payment"
  | "receipt"
  | "receiptInfo"
  | "status";

const API_BASE_URL = "https://sandrealeesalon.onrender.com";

// Metro Manila locations data
const METRO_MANILA_LOCATIONS = {
  Manila: [
    "Binondo",
    "Ermita",
    "Intramuros",
    "Malate",
    "Paco",
    "Pandacan",
    "Port Area",
    "Quiapo",
    "Sampaloc",
    "San Andres",
    "San Miguel",
    "San Nicolas",
    "Santa Ana",
    "Santa Cruz",
    "Santa Mesa",
    "Tondo",
  ],
  "Quezon City": [
    "Alicia",
    "Amihan",
    "Apolonio Samson",
    "Baesa",
    "Bagbag",
    "Bagong Lipunan ng Crame",
    "Bagong Pag-asa",
    "Bagong Silangan",
    "Bagumbayan",
    "Bagumbuhay",
    "Bahay Toro",
    "Balingasa",
    "Balong-bato",
    "Batasan Hills",
    "Bayani Road",
    "Blue Ridge A",
    "Blue Ridge B",
    "Bungad",
    "Camp Aguinaldo",
    "Capri",
    "Central",
    "Claro",
    "Commonwealth",
    "Culiat",
    "Damar",
    "Damayan",
    "Damayan Lagi",
    "Del Monte",
    "Dioquino Zobel",
    "Don Manuel",
    "Doña Aurora",
    "Doña Imelda",
    "Doña Josefa",
    "Duyan-duyan",
    "E. Rodriguez",
    "East Kamias",
    "Escopa I",
    "Escopa II",
    "Escopa III",
    "Escopa IV",
    "Fairview",
    "Greater Lagro",
    "Gulod",
    "Holy Spirit",
    "Horseshoe",
    "Immaculate Concepcion",
    "Kaligayahan",
    "Kalusugan",
    "Kamuning",
    "Katipunan",
    "Kaunlaran",
    "Kristong Hari",
    "Krus na Ligas",
    "Laging Handa",
    "Libis",
    "Lourdes",
    "Loyola Heights",
    "Maharlika",
    "Malaya",
    "Manga",
    "Manresa",
    "Mariana",
    "Mariblo",
    "Marilag",
    "Masagana",
    "Matalahib",
    "Matandang Balara",
    "Milagrosa",
    "N.S. Amoranto",
    "Nayon Kaunlaran",
    "New Era",
    "North Fairview",
    "Novaliches Proper",
    "Obrero",
    "Old Capitol Site",
    "Paang Bundok",
    "Pag-ibig sa Nayon",
    "Paligsahan",
    "Paltok",
    "Pansol",
    "Paraiso",
    "Pasong Putik",
    "Pasong Tamo",
    "Payatas",
    "Phil-Am",
    "Pinyahan",
    "Project 6",
    "Quirino 2-A",
    "Quirino 2-B",
    "Quirino 2-C",
    "Quirino 3-A",
    "Ramon Magsaysay",
    "Roxas",
    "Sacred Heart",
    "Sagrada Familia",
    "Salvacion",
    "San Agustin",
    "San Antonio",
    "San Bartolome",
    "San Isidro Galas",
    "San Isidro Labrador",
    "San Jose",
    "San Martin de Porres",
    "San Roque",
    "San Vicente",
    "Sangandaan",
    "Santa Cruz",
    "Santa Lucia",
    "Santa Monica",
    "Santa Teresita",
    "Santo Cristo",
    "Santo Domingo",
    "Santo Niño",
    "Santol",
    "Sauyo",
    "Sienna",
    "Sikatuna Village",
    "Silangan",
    "Socorro",
    "South Triangle",
    "St. Ignatius",
    "St. Peter",
    "Tagumpay",
    "Talayan",
    "Talipapa",
    "Tandang Sora",
    "Tatalon",
    "Teachers Village East",
    "Teachers Village West",
    "Ugong Norte",
    "Unang Sigaw",
    "University Hills",
    "Valencia",
    "Vasra",
    "Veterans Village",
    "Villa Maria Clara",
    "West Kamias",
    "West Triangle",
    "White Plains",
  ],
  Makati: [
    "Bangkal",
    "Bel-air",
    "Cembo",
    "Comembo",
    "Dasmariñas",
    "East Rembo",
    "Forbes Park",
    "Guadalupe Nuevo",
    "Guadalupe Viejo",
    "Kasilawan",
    "La Paz",
    "Magallanes",
    "Olympia",
    "Palanan",
    "Pembo",
    "Pio del Pilar",
    "Pitogo",
    "Poblacion",
    "Post Proper Northside",
    "Post Proper Southside",
    "Rizal",
    "San Antonio",
    "San Isidro",
    "San Lorenzo",
    "Santa Cruz",
    "Singkamas",
    "South Cembo",
    "Tejeros",
    "Urdaneta",
    "Valenzuela",
    "West Rembo",
  ],
  Taguig: [
    "Bagumbayan",
    "Bambang",
    "Calzada",
    "Central Bicutan",
    "Central Signal",
    "Fort Bonifacio",
    "Hagonoy",
    "Ibayo-Tipas",
    "Katuparan",
    "Ligid-Tipas",
    "Lower Bicutan",
    "Maharlika Village",
    "Napindan",
    "New Lower Bicutan",
    "North Daang Hari",
    "North Signal",
    "Palingon",
    "Pinagsama",
    "San Miguel",
    "Santa Ana",
    "South Daang Hari",
    "South Signal",
    "Tanyag",
    "Upper Bicutan",
    "Ususan",
    "Wawa",
    "Western Bicutan",
  ],
  Pasig: [
    "Bagong Ilog",
    "Bagong Katipunan",
    "Bambang",
    "Buting",
    "Caniogan",
    "Dela Paz",
    "Kalawaan",
    "Kapasigan",
    "Kapitolyo",
    "Malinao",
    "Manggahan",
    "Maybunga",
    "Oranbo",
    "Palatiw",
    "Pinagbuhatan",
    "Pineda",
    "Rosario",
    "Sagad",
    "San Antonio",
    "San Joaquin",
    "San Jose",
    "San Miguel",
    "San Nicolas",
    "Santa Cruz",
    "Santa Lucia",
    "Santa Rosa",
    "Santo Tomas",
    "Santolan",
    "Sumilang",
    "Ugong",
  ],
  Mandaluyong: [
    "Addition Hills",
    "Bagong Silang",
    "Barangka Drive",
    "Barangka Ibaba",
    "Barangka Ilaya",
    "Barangka Itaas",
    "Buayang Bato",
    "Burol",
    "Daang Bakal",
    "Hagdang Bato Itaas",
    "Hagdang Bato Libis",
    "Harapin Ang Bukas",
    "Highway Hills",
    "Hulo",
    "Mabini-J. Rizal",
    "Malamig",
    "Mauway",
    "Namayan",
    "New Zañiga",
    "Old Zañiga",
    "Pag-asa",
    "Plainview",
    "Pleasant Hills",
    "Poblacion",
    "San Jose",
    "Vergara",
    "Wack-wack Greenhills",
  ],
  Pasay: [
    "Baclaran",
    "Baltao",
    "Malibay",
    "Manuel L. Quezon",
    "Maricaban",
    "Merville",
    "Moonwalk",
    "Palanan",
    "Pildera",
    "San Isidro",
    "San Jose",
    "San Rafael",
    "San Roque",
    "Santa Clara",
    "Villamor",
  ],
  Parañaque: [
    "Baclaran",
    "BF Homes",
    "Don Bosco",
    "Don Galo",
    "La Huerta",
    "Marcelo Green",
    "Merville",
    "Moonwalk",
    "San Antonio",
    "San Dionisio",
    "San Isidro",
    "Santo Niño",
    "Sun Valley",
    "Tambo",
    "Vitalez",
  ],
  "Las Piñas": [
    "Almanza Uno",
    "Almanza Dos",
    "CAA-BF International",
    "Daniel Fajardo",
    "Elias Aldana",
    "Ilaya",
    "Manuyo Uno",
    "Manuyo Dos",
    "Pamplona Uno",
    "Pamplona Dos",
    "Pamplona Tres",
    "Pilar",
    "Pulang Lupa Uno",
    "Pulang Lupa Dos",
    "Talon Uno",
    "Talon Dos",
    "Talon Tres",
    "Talon Kuatro",
    "Talon Singko",
    "Zapote",
  ],
  Muntinlupa: [
    "Alabang",
    "Ayala Alabang",
    "Bayanan",
    "Buli",
    "Cupang",
    "Poblacion",
    "Putatan",
    "Sucat",
    "Tunasan",
  ],
  Marikina: [
    "Barangka",
    "Concepcion Uno",
    "Concepcion Dos",
    "Fortune",
    "Industrial Valley",
    "Jésus de la Peña",
    "Malanday",
    "Marikina Heights",
    "Nangka",
    "Parang",
    "San Roque",
    "Santa Elena",
    "Santo Niño",
    "Tañong",
    "Tumana",
  ],
  Caloocan: [
    "Bagong Silang",
    "Barangay 1-164",
    "Barangay 165-177",
    "Barangay 178-188",
  ],
  Malabon: [
    "Acacia",
    "Baritan",
    "Bayan-bayanan",
    "Catmon",
    "Concepcion",
    "Dampalit",
    "Flores",
    "Hulong Duhat",
    "Ibaba",
    "Longos",
    "Maysilo",
    "Muzon",
    "Niugan",
    "Panghulo",
    "Potrero",
    "San Agustin",
    "Santolan",
    "Tañong",
    "Tinajeros",
    "Tonsuya",
  ],
  Navotas: [
    "Bagumbayan North",
    "Bagumbayan South",
    "Bangkulasi",
    "Daanghari",
    "Navotas East",
    "Navotas West",
    "North Bay Boulevard North",
    "North Bay Boulevard South",
    "San Jose",
    "San Rafael Village",
    "Sipac-Almacen",
    "Tangos",
    "Tanza",
  ],
  Valenzuela: [
    "Arkong Bato",
    "Bagbaguin",
    "Bignay",
    "Bisig",
    "Canumay East",
    "Canumay West",
    "Coloong",
    "Dalandanan",
    "Isla",
    "Karuhatan",
    "Lawang Bato",
    "Lingunan",
    "Mabolo",
    "Malinta",
    "Mapulang Lupa",
    "Marulas",
    "Maysan",
    "Palasan",
    "Parada",
    "Pariancillo Villa",
    "Paso de Blas",
    "Polo",
    "Punturin",
    "Rincon",
    "Santo Cristo",
    "Tagalag",
    "Viente Reales",
    "Wawang Pulo",
  ],
  "San Juan": [
    "Balong-bato",
    "Batisan",
    "Corazon de Jesús",
    "Ermitaño",
    "Greenhills",
    "Isabelita",
    "Kabayanan",
    "Little Baguio",
    "Maytunas",
    "Onse",
    "Pasadeña",
    "Pedro Cruz",
    "Prolación",
    "Rivera",
    "Salapan",
    "San Perfecto",
    "Santa Lucia",
    "Tibagan",
  ],
};

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse cart data from params
  const cartData: Cart = JSON.parse(params.cart as string);

  const [currentScreen, setCurrentScreen] =
    useState<CheckoutScreenType>("delivery");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [contactNumber, setContactNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Location selection states
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    try {
      setValidatingPromo(true);
      const res = await apiClient.validatePromo(
        promoCodeInput.trim(),
        cartData?.totalAmount || 0,
        "products"
      );
      if (res && res.success && res.data) {
        setAppliedPromo(res.data);
        Toast.show({
          type: "success",
          text1: "Promo Applied!",
          text2: `You saved ₱${res.data.discountAmount.toFixed(2)}!`,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Invalid Promo",
          text2: res?.message || "Promo code could not be applied.",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Promo Error",
        text2: err.message || "Failed to validate promo code.",
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    Toast.show({
      type: "info",
      text1: "Promo Removed",
    });
  };
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);

  // Add user and profile image states
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<any>(null);

  const contactRef = useRef<TextInput>(null);
  const referenceNumberRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);

  const screens: CheckoutScreenType[] = [
    "delivery",
    "summary",
    "payment",
    "receipt",
    "receiptInfo",
    "status",
  ];

  // Get available barangays based on selected city
  const availableBarangays = selectedCity
    ? METRO_MANILA_LOCATIONS[
        selectedCity as keyof typeof METRO_MANILA_LOCATIONS
      ] || []
    : [];

  // Build the complete delivery address as string
  const buildDeliveryAddress = (): string | undefined => {
    if (deliveryType === "pickup") {
      return undefined;
    }

    if (!selectedCity || !selectedBarangay || !streetAddress.trim()) {
      return undefined;
    }

    return `${streetAddress.trim()}, ${selectedBarangay}, ${selectedCity}, Metro Manila, Philippines`;
  };

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to upload payment proof.",
      );
    }
  };

  const loadUserProfile = useCallback(async () => {
    try {
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        setUser(userResponse.user);
        // Load profile image
        const profileImageUrl = await getProfileImageUrl(userResponse.user);
        setProfileImage(profileImageUrl);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, []);

  useEffect(() => {
    requestImagePermissions();
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    if (currentScreen === "summary") {
      setShowConfirmModal(true);
    }
  }, [currentScreen]);

  // Payment status polling
  const checkPaymentStatus = useCallback(async () => {
    if (!currentPaymentId) {
      console.log("⚠️ [POLL] No payment ID, skipping check");
      return;
    }

    try {
      console.log("🔄 [POLL] Checking payment status for:", currentPaymentId);

      const statusResponse = await apiClient.getPaymentStatus(currentPaymentId);

      if (statusResponse && statusResponse.success && statusResponse.data) {
        const status = statusResponse.data.status;

        console.log("📊 [POLL] Payment status from server:", status);

        if (status === "approved" || status === "completed") {
          console.log("✅ [POLL] Status is APPROVED/COMPLETED");
          setPaymentStatus("approved");
          setPaymentStatusMessage(
            statusResponse.data.processingNotes ||
              "Your order is confirmed! Thank you for your purchase.",
          );
        } else if (status === "denied") {
          console.log("❌ [POLL] Status is DENIED");
          setPaymentStatus("denied");
          setPaymentStatusMessage(
            statusResponse.data.processingNotes ||
              "Your payment was declined. Please check your payment details and try again.",
          );
        } else if (status === "processing") {
          console.log("⏳ [POLL] Status still PROCESSING");
          if (paymentStatus !== "processing") {
            setPaymentStatus("processing");
          }
        }
      }
    } catch (error: any) {
      console.error("❌ [POLL] Error checking payment status:", error.message);
    }
  }, [currentPaymentId, paymentStatus]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (
      currentScreen === "status" &&
      currentPaymentId &&
      paymentStatus === "processing"
    ) {
      console.log("✅ [POLLING SETUP] Starting polling every 3 seconds");
      checkPaymentStatus();
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
    }

    return () => {
      if (interval) {
        console.log("🛑 [POLLING CLEANUP] Stopping polling");
        clearInterval(interval);
      }
    };
  }, [currentScreen, currentPaymentId, paymentStatus, checkPaymentStatus]);

  const getProfileImageUrl = async (userData: any) => {
    if (userData.profileImage) {
      if (userData.profileImage.startsWith("http")) {
        return { uri: userData.profileImage };
      }
      return {
        uri: `https://sandrealeesalon.onrender.com${userData.profileImage}`,
      };
    }

    // Fallback to dicebear avatar or default image
    const seed = userData.username || userData.id || "default";
    return {
      uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        seed,
      )}`,
    };
  };

  // FIXED: Improved product image handling function
  const getProductImageSource = (product: Product) => {
    console.log(`🖼️ Loading product image for: ${product.name}`, {
      image: product.image,
      type: typeof product.image,
    });

    // Priority 1: Use the image from API if available
    if (product.image) {
      if (typeof product.image === "string") {
        if (product.image.startsWith("http")) {
          return { uri: product.image };
        } else {
          const cleanPath = product.image.startsWith("/")
            ? product.image
            : `/${product.image}`;
          const fullUrl = `${API_BASE_URL}${cleanPath}`;
          console.log(`🔗 Constructed product image URL: ${fullUrl}`);
          return { uri: fullUrl };
        }
      }
      return product.image;
    }

    // Priority 2: Use product name to determine which image to use
    const productName = product.name.toLowerCase();

    // Map product names to specific images
    if (
      productName.includes("sulfate") ||
      productName.includes("conditioner")
    ) {
      return images.sulfate || images.mask;
    } else if (productName.includes("shampoo")) {
      return images.shampoo || images.mask;
    } else if (productName.includes("keratin")) {
      return images.keratin || images.mask;
    } else if (
      productName.includes("mask") ||
      productName.includes("treatment")
    ) {
      return images.mask;
    }

    // Priority 3: Use category-based fallback
    const category = product.category?.toLowerCase() || "";
    if (category.includes("hair") || category.includes("care")) {
      return images.shampoo || images.mask;
    } else if (category.includes("treatment")) {
      return images.keratin || images.mask;
    }

    // Ultimate fallback
    console.warn(
      `⚠️ No specific image found for product: ${product.name}, using default mask`,
    );
    return images.mask;
  };

  const handleBack = () => {
    const idx = screens.indexOf(currentScreen);
    if (idx === 0) {
      router.back();
    } else {
      setCurrentScreen(screens[idx - 1]);
    }
  };

  const handleContinueFromDelivery = () => {
    if (deliveryType === "delivery") {
      if (!streetAddress.trim() || !selectedBarangay || !selectedCity) {
        Toast.show({
          type: "error",
          text1: "Address Required",
          text2:
            "Please complete your delivery address (street, barangay, and city).",
        });
        return;
      }
    }

    if (!contactNumber) {
      Toast.show({
        type: "error",
        text1: "Contact Required",
        text2: "Please enter your contact number.",
      });
      return;
    }

    setCurrentScreen("summary");
  };

  const handleProceedToPayment = async () => {
    try {
      setLoading(true);

      // Prepare order items
      const orderItems = cartData.items.map((item) => {
        return {
          productId:
            typeof item.productId === "string"
              ? item.productId
              : item.productId._id,
          quantity: item.quantity,
        };
      });

      // Create order - FIXED: Send address as an object, not a string
      const orderData: any = {
        items: orderItems,
        deliveryType,
        contactNumber,
        specialInstructions: specialInstructions || "",
        customerNotes: "",
        promoCode: appliedPromo?.code || undefined,
      };

      // Add delivery address as an object if delivery type is selected
      if (deliveryType === "delivery") {
        if (!streetAddress.trim() || !selectedBarangay || !selectedCity) {
          Toast.show({
            type: "error",
            text1: "Address Required",
            text2:
              "Please complete your delivery address (street, barangay, and city).",
          });
          return;
        }

        // Send address as an object with proper structure
        orderData.deliveryInfo = {
          address: {
            street: streetAddress.trim(),
            barangay: selectedBarangay,
            city: selectedCity,
            region: "Metro Manila",
            country: "Philippines",
            fullAddress: buildDeliveryAddress(), // Include the full string as well if needed
          },
        };
      }

      console.log("📤 Creating order:", orderData);

      const orderResponse = await apiClient.createOrder(orderData);

      if (orderResponse && orderResponse.success) {
        setCurrentOrderId(orderResponse.data._id);
        setCurrentScreen("payment");
        Toast.show({
          type: "success",
          text1: "Order Created",
          text2: "Your order has been placed!",
        });
      } else {
        throw new Error(orderResponse?.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("❌ Error creating order:", error.message);
      Alert.alert(
        "Order Failed",
        error.message ||
          "There was a problem creating your order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!currentOrderId || !paymentMethod) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Order or payment method is missing.",
      });
      return;
    }

    try {
      setLoading(true);

      const paymentResponse = await apiClient.createPayment({
        orderId: currentOrderId,
        paymentMethod: paymentMethod,
      });

      if (paymentResponse && paymentResponse.success && paymentResponse.data) {
        const paymentId = paymentResponse.data._id;

        if (paymentId) {
          console.log("✅ Setting payment ID:", paymentId);
          setCurrentPaymentId(paymentId);
          setPaymentStatus("processing");
          setCurrentScreen("receipt");
        } else {
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
      console.error("Error picking image:", error.message);
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

  // Auto-generate receipt data when screen loads
  const generateReceiptData = () => {
    // Only generate if data is empty to prevent infinite loops
    if (!receiptData.referenceNumber) {
      // Generate reference number (random 10-digit number)
      const referenceNumber = Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString();

      // Get current user name or use default
      const userName = user?.username || "Customer";

      // Calculate total amount (numeric only, no currency symbol)
      const shippingFee = deliveryType === "delivery" ? 100 : 0;
      const totalAmount = Math.max(
        0,
        cartData.totalAmount + shippingFee - (appliedPromo?.discountAmount || 0)
      );

      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split("T")[0];

      setReceiptData({
        referenceNumber,
        name: userName,
        amountPaid: totalAmount.toString(), // Send as plain number string, no currency symbol
        dateOfTransaction: currentDate,
      });

      Toast.show({
        type: "success",
        text1: "Receipt Info Generated",
        text2: "All fields have been auto-filled for you!",
      });
    }
  };

  // FIXED: Improved edit functions with proper TypeScript types
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
              setReceiptData((prev) => ({
                ...prev,
                referenceNumber: newRef.trim(),
              }));
              Toast.show({
                type: "success",
                text1: "Updated",
                text2: "Reference number has been updated.",
              });
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
              setReceiptData((prev) => ({ ...prev, name: newName.trim() }));
              Toast.show({
                type: "success",
                text1: "Updated",
                text2: "Name has been updated.",
              });
            }
          },
        },
      ],
      "plain-text",
      receiptData.name,
    );
  };

  const handleEditAmount = () => {
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
              Toast.show({
                type: "success",
                text1: "Updated",
                text2: "Amount has been updated.",
              });
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
      receiptData.amountPaid.replace(/[^0-9]/g, ""),
    );
  };

  // Format amount for display (add currency symbol)
  const formatAmountForDisplay = (amount: string) => {
    const numericAmount = amount.replace(/[^0-9]/g, "");
    return numericAmount ? `₱${numericAmount}.00` : "₱0.00";
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

      const formData = new FormData();

      const imageFile = {
        uri:
          Platform.OS === "ios"
            ? proofImage.uri.replace("file://", "")
            : proofImage.uri,
        type: proofImage.mimeType || proofImage.type || "image/jpeg",
        name: proofImage.fileName || "payment-proof.jpg",
      };

      formData.append("proofImage", imageFile as any);
      formData.append("referenceNumber", receiptData.referenceNumber);
      formData.append("name", receiptData.name);
      formData.append("amountPaid", receiptData.amountPaid); // This is now numeric only
      formData.append("dateOfTransaction", receiptData.dateOfTransaction);

      console.log("📋 FormData contents:", {
        proofImage: imageFile,
        referenceNumber: receiptData.referenceNumber,
        name: receiptData.name,
        amountPaid: receiptData.amountPaid, // Should be numeric only
        dateOfTransaction: receiptData.dateOfTransaction,
      });

      const uploadResponse = await apiClient.uploadProofOfPayment(
        currentPaymentId,
        formData,
      );

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

      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.message || "Failed to upload payment proof.",
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

  const handleBackToHome = async () => {
    // Clear cart after successful order
    try {
      await apiClient.clearCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
    router.push("/(tabs)");
  };

  const getProduct = (item: CartItem): Product | null => {
    if (typeof item.productId === "string") {
      return null;
    }
    return item.productId;
  };

  // FIXED: Product Image Component with better error handling
  const ProductImageComponent = ({ product }: { product: Product }) => {
    const [currentSource, setCurrentSource] = useState(
      getProductImageSource(product),
    );

    useEffect(() => {
      setCurrentSource(getProductImageSource(product));
    }, [product]);

    const handleImageError = () => {
      console.log(`❌ Failed to load image for: ${product.name}`);

      // Try to find a better fallback based on product name
      const productName = product.name.toLowerCase();

      if (productName.includes("shampoo") && images.shampoo) {
        setCurrentSource(images.shampoo);
      } else if (productName.includes("sulfate") && images.sulfate) {
        setCurrentSource(images.sulfate);
      } else if (productName.includes("keratin") && images.keratin) {
        setCurrentSource(images.keratin);
      } else {
        setCurrentSource(images.mask);
      }
    };

    return (
      <Image
        source={currentSource}
        style={styles.summaryItemImage}
        resizeMode="cover"
        onError={handleImageError}
        defaultSource={images.mask}
      />
    );
  };

  // DELIVERY INFO SCREEN - UPDATED WITH LOCATION SELECTION
  const DeliveryInfoScreen = () => (
    <View style={styles.checkoutScreenContainer}>
      <View style={styles.checkoutHeader}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.checkoutHeaderTitle}>Delivery Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.checkoutScrollView}>
          <View style={styles.deliveryContainer}>
            <Text style={styles.sectionTitle}>Delivery Type</Text>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === "pickup" && styles.deliveryOptionActive,
              ]}
              onPress={() => setDeliveryType("pickup")}>
              <View style={styles.deliveryOptionLeft}>
                <Ionicons name="storefront-outline" size={24} color="#619AE4" />
                <View>
                  <Text style={styles.deliveryOptionTitle}>
                    Pickup at Salon
                  </Text>
                  <Text style={styles.deliveryOptionSubtext}>
                    Free - Available during business hours
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioButton,
                  deliveryType === "pickup" && styles.radioButtonActive,
                ]}>
                {deliveryType === "pickup" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === "delivery" && styles.deliveryOptionActive,
              ]}
              onPress={() => setDeliveryType("delivery")}>
              <View style={styles.deliveryOptionLeft}>
                <Ionicons name="bicycle-outline" size={24} color="#619AE4" />
                <View>
                  <Text style={styles.deliveryOptionTitle}>Home Delivery</Text>
                  <Text style={styles.deliveryOptionSubtext}>
                    ₱100 delivery fee
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioButton,
                  deliveryType === "delivery" && styles.radioButtonActive,
                ]}>
                {deliveryType === "delivery" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            {deliveryType === "delivery" && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Delivery Address *</Text>

                {/* Street Address */}
                <Text style={styles.formSubLabel}>Street Address</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="House/Building No., Street Name"
                  placeholderTextColor="#6B7280"
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  multiline
                  numberOfLines={2}
                  returnKeyType="next"
                />

                {/* City Selection */}
                <Text style={styles.formSubLabel}>City *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCityModal(true)}>
                  <Text
                    style={
                      selectedCity
                        ? styles.dropdownButtonText
                        : styles.dropdownButtonPlaceholder
                    }>
                    {selectedCity || "Select City"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Barangay Selection */}
                <Text style={styles.formSubLabel}>Barangay *</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    !selectedCity && styles.dropdownButtonDisabled,
                  ]}
                  onPress={() => selectedCity && setShowBarangayModal(true)}
                  disabled={!selectedCity}>
                  <Text
                    style={
                      selectedBarangay
                        ? styles.dropdownButtonText
                        : styles.dropdownButtonPlaceholder
                    }>
                    {selectedBarangay ||
                      (selectedCity ? "Select Barangay" : "Select city first")}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={selectedCity ? "#6B7280" : "#374151"}
                  />
                </TouchableOpacity>

                {/* Display selected address */}
                {(selectedCity || selectedBarangay || streetAddress) && (
                  <View style={styles.addressPreview}>
                    <Text style={styles.addressPreviewLabel}>
                      Your delivery address:
                    </Text>
                    <Text style={styles.addressPreviewText}>
                      {[streetAddress, selectedBarangay, selectedCity]
                        .filter(Boolean)
                        .join(", ")}
                      {selectedCity && ", Metro Manila, Philippines"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Contact Number *</Text>
              <TextInput
                ref={contactRef}
                style={styles.formInput}
                placeholder="+63 XXX XXX XXXX"
                placeholderTextColor="#6B7280"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Special Instructions</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Any special requests? (Optional)"
                placeholderTextColor="#6B7280"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
                returnKeyType="done"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Selection Modal */}
      <Modal visible={showCityModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {Object.keys(METRO_MANILA_LOCATIONS).map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.modalItem,
                    selectedCity === city && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setSelectedBarangay(""); // Reset barangay when city changes
                    setShowCityModal(false);
                  }}>
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedCity === city && styles.modalItemTextSelected,
                    ]}>
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Ionicons name="checkmark" size={20} color="#619AE4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barangay Selection Modal */}
      <Modal
        visible={showBarangayModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Barangay - {selectedCity}
              </Text>
              <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {availableBarangays.map((barangay) => (
                <TouchableOpacity
                  key={barangay}
                  style={[
                    styles.modalItem,
                    selectedBarangay === barangay && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedBarangay(barangay);
                    setShowBarangayModal(false);
                  }}>
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedBarangay === barangay &&
                        styles.modalItemTextSelected,
                    ]}>
                    {barangay}
                  </Text>
                  {selectedBarangay === barangay && (
                    <Ionicons name="checkmark" size={20} color="#619AE4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={handleContinueFromDelivery}>
        <LinearGradient
          colors={["#76C4FF", "#0449D3", "#0348D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue to Summary</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ORDER SUMMARY SCREEN - UPDATED TO SHOW FORMATTED ADDRESS
  const OrderSummaryScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const discountAmount = appliedPromo?.discountAmount || 0;
    const total = Math.max(0, cartData.totalAmount + shippingFee - discountAmount);

    return (
      <View style={styles.checkoutScreenContainer}>
        <View style={styles.checkoutHeader}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.checkoutHeaderTitle}>Order Summary</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.checkoutScrollView}>
          <View style={styles.summaryContainer}>
            {/* Customer Profile Section */}
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.customerInfo}>
                {profileImage && (
                  <Image
                    source={profileImage}
                    style={styles.customerProfileImage}
                    defaultSource={images.profile}
                  />
                )}
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>
                    {user?.username || "Customer"}
                  </Text>
                  <Text style={styles.customerContact}>{contactNumber}</Text>
                  <Text style={styles.deliveryType}>
                    {deliveryType === "pickup"
                      ? "Pickup at Salon"
                      : "Home Delivery"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Order Items Section */}
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Order Items</Text>
              {cartData.items.map((item) => {
                const product = getProduct(item);
                if (!product) return null;

                return (
                  <View key={item._id} style={styles.summaryItem}>
                    <ProductImageComponent product={product} />
                    <View style={styles.summaryItemInfo}>
                      <Text style={styles.summaryItemName}>{product.name}</Text>
                      <Text style={styles.summaryItemQuantity}>
                        Qty: {item.quantity}
                      </Text>
                      <Text style={styles.summaryItemPrice}>
                        ₱{(product.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Delivery Details Section - UPDATED */}
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Delivery Details</Text>
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>Type</Text>
                <Text style={styles.summaryDetailValue}>
                  {deliveryType === "pickup"
                    ? "Pickup at Salon"
                    : "Home Delivery"}
                </Text>
              </View>
              {deliveryType === "delivery" && (
                <>
                  <View style={styles.summaryDetailRow}>
                    <Text style={styles.summaryDetailLabel}>Street</Text>
                    <Text style={styles.summaryDetailValue}>
                      {streetAddress}
                    </Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Text style={styles.summaryDetailLabel}>Barangay</Text>
                    <Text style={styles.summaryDetailValue}>
                      {selectedBarangay}
                    </Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Text style={styles.summaryDetailLabel}>City</Text>
                    <Text style={styles.summaryDetailValue}>
                      {selectedCity}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.summaryDetailRow}>
                <Text style={styles.summaryDetailLabel}>Contact</Text>
                <Text style={styles.summaryDetailValue}>{contactNumber}</Text>
              </View>
              {specialInstructions && (
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>
                    Special Instructions
                  </Text>
                  <Text style={styles.summaryDetailValue}>
                    {specialInstructions}
                  </Text>
                </View>
              )}
            </View>

            {/* Promo Code Section */}
            <View style={[styles.pricingCard, styles.cardShadow, { marginBottom: 12 }]}>
              <Text style={styles.pricingTitle}>Promo Code</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: "#2A2A2E",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: "#FFFFFF",
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: appliedPromo ? "#10B981" : "#3D87E9",
                  }}
                  placeholder="ENTER PROMO CODE"
                  placeholderTextColor="#6B7280"
                  value={promoCodeInput}
                  onChangeText={(text) => setPromoCodeInput(text.toUpperCase())}
                  editable={!appliedPromo && !validatingPromo}
                  autoCapitalize="characters"
                />
                {appliedPromo ? (
                  <TouchableOpacity
                    onPress={handleRemovePromo}
                    style={{
                      backgroundColor: "#EF4444",
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                    }}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleApplyPromo}
                    disabled={validatingPromo || !promoCodeInput.trim()}
                    style={{
                      backgroundColor: "#3D87E9",
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      opacity: !promoCodeInput.trim() || validatingPromo ? 0.6 : 1,
                    }}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>
                      {validatingPromo ? "..." : "Apply"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {appliedPromo && (
                <Text style={{ color: "#10B981", fontSize: 12, marginTop: 6 }}>
                  ✓ Code {appliedPromo.code} applied! Saved ₱{appliedPromo.discountAmount.toFixed(2)}
                </Text>
              )}
            </View>

            {/* Pricing Section */}
            <View style={[styles.pricingCard, styles.cardShadow]}>
              <Text style={styles.pricingTitle}>Price Details</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  Subtotal ({cartData.items.length} items)
                </Text>
                <Text style={styles.pricingValue}>
                  ₱{cartData.totalAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Shipping Fee</Text>
                <Text style={styles.pricingValue}>
                  ₱{shippingFee.toFixed(2)}
                </Text>
              </View>
              {appliedPromo && (
                <View style={styles.pricingRow}>
                  <Text style={[styles.pricingLabel, { color: "#10B981" }]}>
                    Promo ({appliedPromo.code})
                  </Text>
                  <Text style={[styles.pricingValue, { color: "#10B981" }]}>
                    -₱{appliedPromo.discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.pricingTotalLabel}>Total Amount</Text>
                <Text style={styles.pricingTotalValue}>
                  ₱{total.toFixed(2)}
                </Text>
              </View>
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
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Confirm your order and proceed to payment?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonNo}
                  onPress={handleBack}>
                  <Text style={styles.modalButtonTextNo}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                  <LinearGradient
                    colors={["#619AE4", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.modalButtonYes}>
                    <Text style={styles.modalButtonTextYes}>Yes, Proceed</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TouchableOpacity onPress={handleProceedToPayment}>
          <LinearGradient
            colors={["#619AE4", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.continueButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Proceed to Payment</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // PAYMENT METHOD SCREEN
  const PaymentMethodScreen = () => (
    <View style={styles.checkoutScreenContainer}>
      <View style={styles.checkoutHeader}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.checkoutHeaderTitle}>Payment Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.checkoutScrollView}>
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
        </View>
      </ScrollView>

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
  );

  // RECEIPT SCREEN - UPLOAD IMAGE
  const ReceiptScreen = () => (
    <View style={styles.checkoutScreenContainer}>
      <View style={styles.checkoutHeader}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.checkoutHeaderTitle}>Payment Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.checkoutScrollView}>
        <View style={styles.receiptContainer}>
          <View style={[styles.qrCodeContainer, styles.cardShadow]}>
            <View style={styles.qrCodePlaceholder}>
              <QRCode
                value={`payment:${currentPaymentId || "pending"}`}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrCodeText}>
                Scan this QR code to complete your payment
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}>
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
            <Text style={styles.uploadButtonText}>
              {proofImage
                ? "Change Payment Screenshot"
                : "Upload Payment Screenshot"}
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
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity onPress={handleContinueToPersonalInfo}>
        <LinearGradient
          colors={["#76C4FF", "#0449D3", "#0348D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // RECEIPT INFO SCREEN - AUTO-GENERATED DATA
  const ReceiptInfoScreen = () => {
    // Auto-generate receipt data when screen loads
    useEffect(() => {
      generateReceiptData();
    }, []); // Empty dependency array to run only once

    return (
      <View style={styles.checkoutScreenContainer}>
        <View style={styles.checkoutHeader}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.checkoutHeaderTitle}>Payment Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
          <ScrollView
            style={styles.checkoutScrollView}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={styles.receiptContainer}>
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

        <TouchableOpacity onPress={handleSubmitProof} disabled={uploadingProof}>
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
    );
  };

  // PAYMENT STATUS SCREEN
  const PaymentStatusScreen = () => {
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
      <View style={styles.checkoutScreenContainer}>
        <View style={styles.checkoutHeader}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.checkoutHeaderTitle}>Order Status</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.checkoutScrollView}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusCard, styles.cardShadow]}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusBadge, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Customer</Text>
                <View style={styles.customerStatusRow}>
                  {profileImage && (
                    <Image
                      source={profileImage}
                      style={styles.statusProfileImage}
                      defaultSource={images.profile}
                    />
                  )}
                  <Text style={styles.statusValue}>
                    {user?.username || "Customer"}
                  </Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Order ID</Text>
                <Text style={styles.statusValue}>
                  {currentOrderId?.substring(0, 8) || "N/A"}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Contact</Text>
                <Text style={styles.statusValue}>{contactNumber}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Delivery Type</Text>
                <Text style={styles.statusValue}>
                  {deliveryType === "pickup" ? "Pickup" : "Delivery"}
                </Text>
              </View>
            </View>

            {paymentStatus === "processing" && (
              <View style={[styles.processingCard, styles.cardShadow]}>
                <ActivityIndicator size="large" color="#619AE4" />
                <Text style={styles.processingTitle}>
                  Processing Your Payment...
                </Text>
                <Text style={styles.processingSubtext}>
                  Please wait while we verify your transaction.
                </Text>
              </View>
            )}

            {paymentStatus === "denied" && (
              <View style={[styles.messageCard, styles.cardShadow]}>
                <Ionicons name="close-circle" size={60} color="#EF4444" />
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
                <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
                <Text style={styles.successMessage}>
                  {paymentStatusMessage}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={handleBackToHome}>
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
    switch (currentScreen) {
      case "delivery":
        return <DeliveryInfoScreen />;
      case "summary":
        return <OrderSummaryScreen />;
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
    <SafeAreaView edges={["top"]} style={styles.checkoutScreenContainer}>
      {renderCurrentScreen()}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkoutScreenContainer: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  checkoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  checkoutHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  checkoutScrollView: {
    flex: 1,
  },
  deliveryContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  deliveryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deliveryOptionActive: {
    borderWidth: 2,
    borderColor: "#619AE4",
  },
  deliveryOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  deliveryOptionTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  deliveryOptionSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginTop: 2,
  },
  formSection: {
    marginTop: 20,
  },
  formLabel: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 8,
  },
  formSubLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: "#1F2937",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  dropdownButtonDisabled: {
    opacity: 0.6,
  },
  dropdownButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  dropdownButtonPlaceholder: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  addressPreview: {
    backgroundColor: "#0A0E17",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 12,
  },
  addressPreviewLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  addressPreviewText: {
    color: "white",
    fontSize: 13,
    fontFamily: "Urbanist",
    lineHeight: 18,
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
  summaryContainer: {
    padding: 20,
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

  // Customer Section Styles
  customerSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#1F2937",
    borderRadius: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 4,
  },
  customerContact: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  deliveryType: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },

  // Summary Item Styles
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  summaryItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryItemName: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryItemQuantity: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  summaryItemPrice: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },

  // Summary Detail Styles
  summaryDetailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  summaryDetailLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    marginBottom: 4,
    fontWeight: "600",
  },
  summaryDetailValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },

  pricingCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
  },
  pricingTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
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
    marginVertical: 12,
  },
  pricingTotalLabel: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  pricingTotalValue: {
    color: "#22C55E",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  paymentMethodContainer: {
    padding: 20,
    gap: 12,
  },
  paymentMethodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
  },
  paymentMethodActive: {
    borderWidth: 2,
    borderColor: "#619AE4",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIconImage: {
    width: 24,
    height: 24,
  },
  paymentMethodText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  receiptContainer: {
    padding: 20,
  },
  qrCodeContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    alignItems: "center",
  },
  qrCodeText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  selectedImageContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 12,
  },
  receiptForm: {
    gap: 12,
  },
  formSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
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
  statusContainer: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
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

  // Customer Status Row Styles
  customerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  processingCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  processingTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    textAlign: "center",
  },
  messageCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  errorMessage: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  successMessage: {
    color: "#22C55E",
    fontSize: 14,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  actionButtons: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  changeMethodButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#619AE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  changeMethodText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  backHomeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backHomeText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  continueButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalClose: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonNo: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextNo: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalButtonYes: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonTextYes: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  modalContainer: {
    backgroundColor: "#1F2937",
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalScrollView: {
    padding: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: "#0A0E17",
  },
  modalItemText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    flex: 1,
  },
  modalItemTextSelected: {
    color: "#619AE4",
    fontWeight: "600",
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
