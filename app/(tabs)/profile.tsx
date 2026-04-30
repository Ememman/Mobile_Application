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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants/images";
import {
  apiClient,
  User,
  Cart,
  CartItem,
  FavoriteItem,
  Product,
  Order,
} from "@/app/api/apiClient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SvgUri } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Floating Label Input Component with Icon
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  icon?: string;
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
    orders: "My Orders",
    bookings: "Bookings",
    cart: "Cart",
    favorites: "Favorites",
    paymentHistory: "Payment History",
    terms: "Terms & Condition Policy",
    help: "Help & Support",
    logout: "LOG OUT",
    login: "LOG IN",
    guest: "Guest User",
    guestEmail: "Sign up to save your data",
    accountRequired: "Account Required",
    accountRequiredDesc:
      "To be able to access profile tabs you need to create an account or login your existing account first",
    signUp: "Sign Up",
    username: "Username",
    email: "Email",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    changePassword: "Change Password",
    updateProfile: "Update Profile",
    myBookings: "My Bookings",
    myCart: "My Cart",
    myFavorites: "My Favorites",
    myOrders: "My Orders",
    bookingDesc:
      "Your booking history and upcoming appointments will appear here.",
    bookNewService: "Book New Service",
    cartDesc: "Your selected services and products will appear here.",
    favoritesDesc: "Your favorite services and stylists will appear here.",
    ordersDesc: "Your order history and current orders will appear here.",
    paymentDesc:
      "Your payment history and transaction details will appear here.",
    recentTransactions: "Recent Transactions",
    contactUs: "Contact Us",
    phone: "Phone",
    businessHours: "Business Hours",
    salonLocation: "Salon Location",
    faqs: "FAQs",
    sendMessage: "Send Message",
    changePhoto: "Change Photo",
    allTransactions: "All",
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    filterBy: "Filter by Status",
    noTransactions: "No Transactions",
    noTransactionsDesc: "You don't have any transactions yet.",
    loadingTransactions: "Loading transactions...",
    rateOrder: "Rate Order",
    rateProduct: "Rate Product",
    submitRating: "Submit Rating",
    addComments: "Add your comments (optional)",
  },
  tl: {
    language: "Wika",
    profileInfo: "Impormasyon ng Profile",
    orders: "Aking Mga Order",
    bookings: "Mga Booking",
    cart: "Kart",
    favorites: "Mga Paborito",
    paymentHistory: "Kasaysayan ng Pagbabayad",
    terms: "Mga Tuntunin at Kondisyon",
    help: "Tulong at Suporta",
    logout: "MAG-LOGOUT",
    login: "MAG-LOGIN",
    guest: "Bisitang Gumagamit",
    guestEmail: "Mag-sign up upang ma-save ang iyong data",
    accountRequired: "Kailangan ng Account",
    accountRequiredDesc:
      "Upang ma-access ang mga tab ng profile kailangan mong lumikha ng account o mag-login sa iyong kasalukuyang account",
    signUp: "Mag-Sign Up",
    username: "Username",
    email: "Email",
    currentPassword: "Kasalukuyang Password",
    newPassword: "Bagong Password",
    confirmPassword: "Kumpirmahin ang Bagong Password",
    changePassword: "Baguhin ang Password",
    updateProfile: "I-update ang Profile",
    myBookings: "Aking Mga Booking",
    myCart: "Aking Kart",
    myFavorites: "Aking Mga Paborito",
    myOrders: "Aking Mga Order",
    bookingDesc:
      "Ang iyong kasaysayan ng booking at paparating na appointment ay lalabas dito.",
    bookNewService: "Mag-book ng Bagong Serbisyo",
    cartDesc: "Ang iyong mga piniling serbisyo at produkto ay lalabas dito.",
    favoritesDesc:
      "Ang iyong mga paboritong serbisyo at stylist ay lalabas dito.",
    ordersDesc:
      "Ang iyong kasaysayan ng order at kasalukuyang mga order ay lalabas dito.",
    paymentDesc:
      "Ang iyong kasaysayan ng pagbabayad at detalye ng transaksyon ay lalabas dito.",
    recentTransactions: "Kamakailang Mga Transaksyon",
    contactUs: "Makipag-ugnayan sa Amin",
    phone: "Telepono",
    businessHours: "Oras ng Negosyo",
    salonLocation: "Lokasyon ng Salon",
    faqs: "Mga Madalas Itanong",
    sendMessage: "Magpadala ng Mensahe",
    changePhoto: "Baguhin ang Larawan",
    allTransactions: "Lahat",
    completed: "Nakumpleto",
    pending: "Nakabinbin",
    failed: "Nabigo",
    cancelled: "Nakansela",
    filterBy: "I-filter ayon sa Status",
    noTransactions: "Walang Transaksyon",
    noTransactionsDesc: "Wala kang transaksyon pa.",
    loadingTransactions: "Naglo-load ng mga transaksyon...",
    rateOrder: "I-rate ang Order",
    rateProduct: "I-rate ang Produkto",
    submitRating: "Ipasa ang Rating",
    addComments: "Magdagdag ng iyong mga komento (opsyonal)",
  },
  ceb: {
    language: "Pinulongan",
    profileInfo: "Impormasyon sa Profile",
    orders: "Akong Mga Order",
    bookings: "Mga Booking",
    cart: "Karton",
    favorites: "Mga Paborito",
    paymentHistory: "Kasaysayan sa Pagbayad",
    terms: "Mga Termino ug Kondisyon",
    help: "Tabang ug Suporta",
    logout: "PAG-LOGOUT",
    login: "PAG-LOGIN",
    guest: "Bisita nga Gumagamit",
    guestEmail: "Mag-sign up aron ma-save ang imong data",
    accountRequired: "Kinahanglan ang Account",
    accountRequiredDesc:
      "Aron ma-access ang mga tab sa profile kinahanglan nimong maghimo ug account o mag-login sa imong existing account",
    signUp: "Mag-Sign Up",
    username: "Username",
    email: "Email",
    currentPassword: "Kasamtangang Password",
    newPassword: "Bag-ong Password",
    confirmPassword: "Kumpirmahin ang Bag-ong Password",
    changePassword: "Usbon ang Password",
    updateProfile: "I-update ang Profile",
    myBookings: "Akong Mga Booking",
    myCart: "Akong Karton",
    myFavorites: "Akong Mga Paborito",
    myOrders: "Akong Mga Order",
    bookingDesc:
      "Ang imong kasaysayan sa booking ug umaabot nga appointment mopakita dinhi.",
    bookNewService: "Mag-book og Bag-ong Serbisyo",
    cartDesc: "Ang imong gipili nga mga serbisyo ug produkto mopakita dinhi.",
    favoritesDesc:
      "Ang imong mga paborito nga serbisyo ug stylist mopakita dinhi.",
    ordersDesc:
      "Ang imong kasaysayan sa order ug kasamtangang mga order mopakita dinhi.",
    paymentDesc:
      "Ang imong kasaysayan sa pagbayad ug detalye sa transaksyon mopakita dinhi.",
    recentTransactions: "Bag-ohay nga Mga Transaksyon",
    contactUs: "Kontaka Kami",
    phone: "Telepono",
    businessHours: "Oras sa Negosyo",
    salonLocation: "Lokasyon sa Salon",
    faqs: "Mga Kanunay Pangutana",
    sendMessage: "Pagpadala og Mensahe",
    changePhoto: "Usba ang Litrato",
    allTransactions: "Tanan",
    completed: "Nahuman",
    pending: "Naghulat",
    failed: "Napakyas",
    cancelled: "Gikanselar",
    filterBy: "I-filter pinaagi sa Status",
    noTransactions: "Walay Transaksyon",
    noTransactionsDesc: "Wala kay transaksyon pa.",
    loadingTransactions: "Nag-load sa mga transaksyon...",
    rateOrder: "I-rate ang Order",
    rateProduct: "I-rate ang Produkto",
    submitRating: "Ipasa ang Rating",
    addComments: "Pagdugang sa imong mga komento (opsyonal)",
  },
  zh: {
    language: "语言",
    profileInfo: "个人信息",
    orders: "我的订单",
    bookings: "预订",
    cart: "购物车",
    favorites: "收藏夹",
    paymentHistory: "支付历史",
    terms: "条款与条件",
    help: "帮助与支持",
    logout: "登出",
    login: "登录",
    guest: "访客用户",
    guestEmail: "注册以保存您的数据",
    accountRequired: "需要账户",
    accountRequiredDesc: "要访问个人资料标签，您需要创建账户或登录现有账户",
    signUp: "注册",
    username: "用户名",
    email: "电子邮件",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    changePassword: "更改密码",
    updateProfile: "更新资料",
    myBookings: "我的预订",
    myCart: "我的购物车",
    myFavorites: "我的收藏",
    myOrders: "我的订单",
    bookingDesc: "您的预订历史和即将到来的预约将显示在这里。",
    bookNewService: "预订新服务",
    cartDesc: "您选择的服务和产品将显示在这里。",
    favoritesDesc: "您喜欢的服务和造型师将显示在这里。",
    ordersDesc: "您的订单历史和当前订单将显示在这里。",
    paymentDesc: "您的支付历史和交易详情将显示在这里。",
    recentTransactions: "最近交易",
    contactUs: "联系我们",
    phone: "电话",
    businessHours: "营业时间",
    salonLocation: "沙龙位置",
    faqs: "常见问题",
    sendMessage: "发送消息",
    changePhoto: "更换照片",
    allTransactions: "全部",
    completed: "已完成",
    pending: "待处理",
    failed: "失败",
    cancelled: "已取消",
    filterBy: "按状态筛选",
    noTransactions: "没有交易",
    noTransactionsDesc: "您还没有任何交易。",
    loadingTransactions: "加载交易中...",
    rateOrder: "评价订单",
    rateProduct: "评价产品",
    submitRating: "提交评价",
    addComments: "添加您的评论（可选）",
  },
  es: {
    language: "Idioma",
    profileInfo: "Información del Perfil",
    orders: "Mis Pedidos",
    bookings: "Reservas",
    cart: "Carrito",
    favorites: "Favoritos",
    paymentHistory: "Historial de Pagos",
    terms: "Términos y Condiciones",
    help: "Ayuda y Soporte",
    logout: "CERRAR SESIÓN",
    login: "INICIAR SESIÓN",
    guest: "Usuario Invitado",
    guestEmail: "Regístrate para guardar tus datos",
    accountRequired: "Cuenta Requerida",
    accountRequiredDesc:
      "Para acceder a las pestañas de perfil, necesitas crear una cuenta o iniciar sesión en tu cuenta existente",
    signUp: "Registrarse",
    username: "Nombre de usuario",
    email: "Correo electrónico",
    currentPassword: "Contraseña Actual",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Nueva Contraseña",
    changePassword: "Cambiar Contraseña",
    updateProfile: "Actualizar Perfil",
    myBookings: "Mis Reservas",
    myCart: "Mi Carrito",
    myFavorites: "Mis Favoritos",
    myOrders: "Mis Pedidos",
    bookingDesc: "Tu historial de reservas y citas próximas aparecerán aquí.",
    bookNewService: "Reservar Nuevo Servicio",
    cartDesc: "Tus servicios y productos seleccionados aparecerán aquí.",
    favoritesDesc: "Tus servicios y estilistas favoritos aparecerán aquí.",
    ordersDesc: "Tu historial de pedidos y pedidos actuales aparecerán aquí.",
    paymentDesc:
      "Tu historial de pagos y detalles de transacciones aparecerán aquí.",
    recentTransactions: "Transacciones Recientes",
    contactUs: "Contáctanos",
    phone: "Teléfono",
    businessHours: "Horario de Atención",
    salonLocation: "Ubicación del Salón",
    faqs: "Preguntas Frecuentes",
    sendMessage: "Enviar Mensaje",
    changePhoto: "Cambiar Foto",
    allTransactions: "Todos",
    completed: "Completado",
    pending: "Pendiente",
    failed: "Fallido",
    cancelled: "Cancelado",
    filterBy: "Filtrar por Estado",
    noTransactions: "Sin Transacciones",
    noTransactionsDesc: "No tienes ninguna transacción aún.",
    loadingTransactions: "Cargando transacciones...",
    rateOrder: "Calificar Pedido",
    rateProduct: "Calificar Producto",
    submitRating: "Enviar Calificación",
    addComments: "Agrega tus comentarios (opcional)",
  },
};

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Modal states
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [profileInfoModalVisible, setProfileInfoModalVisible] = useState(false);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [bookingsModalVisible, setBookingsModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [paymentHistoryModalVisible, setPaymentHistoryModalVisible] =
    useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Order states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderTab, setSelectedOrderTab] = useState<
    "completed" | "pending" | "cancelled"
  >("completed");
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] =
    useState<Order | null>(null);
  const [selectedProductForRating, setSelectedProductForRating] =
    useState<Product | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  // Payment filter state
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Profile information states
  const [profileInfo, setProfileInfo] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // New states for cart, favorites, and bookings
  const [cart, setCart] = useState<Cart | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Available languages
  const languages = [
    { code: "en", name: "English" },
    { code: "tl", name: "Tagalog" },
    { code: "ceb", name: "Bisaya" },
    { code: "zh", name: "Chinese" },
    { code: "es", name: "Spanish" },
  ];

  // Real payment transactions from API
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Get current translations
  const t = translations[selectedLanguage as keyof typeof translations];

  // Filter transactions
  const filteredTransactions =
    paymentFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === paymentFilter);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      if (isLoggedIn) {
        loadPaymentHistory();
        loadCart();
        loadFavorites();
        loadBookings();
        loadOrders();
      }
    }, [isLoggedIn]),
  );

  useEffect(() => {
    loadUser();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to change your profile picture.",
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);

        // Save to AsyncStorage for cross-tab sync
        await AsyncStorage.setItem("customProfileImage", imageUri);

        // Also upload to backend if you have that functionality
        try {
          await apiClient.updateProfilePicture(imageUri);
          Alert.alert("Success", "Profile picture updated!");
        } catch (error) {
          console.log("Backend update failed, but image saved locally");
          Alert.alert("Success", "Profile picture updated locally!");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      const isAuth = await apiClient.isAuthenticated();

      if (!isAuth) {
        console.log("No authentication token found");
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await apiClient.getCurrentUser();

        if (profileResponse.success && profileResponse.user) {
          const userData = profileResponse.user;

          if (userData.isGuest) {
            console.log("Logged in user is guest - clearing session");
            await apiClient.logout();
            setIsLoggedIn(false);
            setUser(null);
          } else {
            console.log("User is logged in:", userData.username);
            setIsLoggedIn(true);
            setUser(userData);
            setProfileInfo((prev) => ({
              ...prev,
              username: userData.username || "",
              email: userData.email || "",
            }));
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error loading user:", error.message);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load orders data
  const loadOrders = async () => {
    if (!isLoggedIn) return;

    try {
      setLoadingOrders(true);
      const ordersResponse = await apiClient.getUserOrders();
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load cart data
  const loadCart = async () => {
    if (!isLoggedIn) return;

    try {
      setLoadingCart(true);
      const cartResponse = await apiClient.getCart();
      if (cartResponse.success) {
        setCart(cartResponse.data);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoadingCart(false);
    }
  };

  // Load favorites data
  const loadFavorites = async () => {
    if (!isLoggedIn) return;

    try {
      setLoadingFavorites(true);
      const favoritesResponse = await apiClient.getFavorites();
      if (favoritesResponse.success) {
        setFavorites(favoritesResponse.data);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Load bookings data
  const loadBookings = async () => {
    if (!isLoggedIn) return;

    try {
      setLoadingBookings(true);
      const bookingsResponse = await apiClient.getUserBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoadingTransactions(true);
      console.log("📋 Loading payment history...");

      const allTransactions: any[] = [];

      // ==================== FETCH BOOKINGS ====================
      try {
        const bookingsResponse = await apiClient.getUserBookings();
        console.log(
          "📥 Bookings response:",
          JSON.stringify(bookingsResponse, null, 2),
        );

        if (
          bookingsResponse &&
          bookingsResponse.success &&
          bookingsResponse.data
        ) {
          const bookingTransactions = bookingsResponse.data
            .filter((booking: any) => booking.paymentId) // Only need to have a payment
            .map((booking: any) => {
              // Enhanced service name extraction
              let serviceName = "Service";
              if (booking.serviceId) {
                if (typeof booking.serviceId === "object") {
                  serviceName = booking.serviceId.name || booking.serviceId;
                } else {
                  serviceName = booking.serviceId;
                }
              } else if (booking.service) {
                if (typeof booking.service === "object") {
                  serviceName = booking.service.name || booking.service;
                } else {
                  serviceName = booking.service;
                }
              }

              // Extract amount
              let amount = 0;
              if (booking.totalAmount) {
                amount = booking.totalAmount;
              } else if (booking.paymentId?.amount) {
                amount = booking.paymentId.amount;
              } else if (booking.serviceId?.priceRange) {
                const priceMatch = String(booking.serviceId.priceRange).match(
                  /\d+/,
                );
                amount = priceMatch ? parseInt(priceMatch[0]) : 0;
              }

              // Extract status - More comprehensive mapping
              let status = "pending";
              if (booking.paymentId?.status) {
                const paymentStatus = booking.paymentId.status.toLowerCase();
                if (
                  paymentStatus === "approved" ||
                  paymentStatus === "completed"
                ) {
                  status = "completed";
                } else if (
                  paymentStatus === "denied" ||
                  paymentStatus === "rejected"
                ) {
                  status = "failed";
                } else if (
                  paymentStatus === "processing" ||
                  paymentStatus === "pending"
                ) {
                  status = "pending";
                }
              } else if (booking.status) {
                if (booking.status === "completed") {
                  status = "completed";
                } else if (booking.status === "cancelled") {
                  status = "failed";
                }
              }

              // Extract date
              const dateString =
                booking.completedAt || booking.cancelledAt || booking.createdAt;
              const date = new Date(dateString);

              return {
                id: booking._id,
                type: "booking",
                service: serviceName,
                date: date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                timestamp: date.getTime(),
                amount: `₱${amount.toFixed(2)}`,
                status: status,
                paymentMethod:
                  booking.paymentId?.paymentMethod ||
                  booking.paymentMethod ||
                  "Cash",
                referenceNumber:
                  booking.paymentId?.referenceNumber ||
                  booking.referenceNumber ||
                  "N/A",
              };
            });

          allTransactions.push(...bookingTransactions);
          console.log("✅ Booking transactions:", bookingTransactions.length);
        }
      } catch (error) {
        console.error("⚠️ Error loading bookings:", error);
      }

      // ==================== FETCH ORDERS ====================
      try {
        const ordersResponse = await apiClient.getOrders();
        console.log(
          "📦 Orders response:",
          JSON.stringify(ordersResponse, null, 2),
        );

        if (ordersResponse && ordersResponse.success && ordersResponse.data) {
          const orderTransactions = ordersResponse.data.map((order: any) => {
            // Extract product names
            let productNames = "Product Order";
            if (order.items && order.items.length > 0) {
              const firstItem = order.items[0];
              const productName =
                typeof firstItem.product === "object" && firstItem.product?.name
                  ? firstItem.product.name
                  : "Product";

              if (order.items.length > 1) {
                productNames = `${productName} (+${
                  order.items.length - 1
                } more)`;
              } else {
                productNames = productName;
              }
            }

            // Extract amount
            const amount = order.totalAmount || 0;

            // Extract status - More comprehensive mapping
            let status = "pending";

            // Check payment status first (more reliable)
            if (order.payment?.status) {
              const paymentStatus = order.payment.status.toLowerCase();
              if (
                paymentStatus === "approved" ||
                paymentStatus === "completed"
              ) {
                status = "completed";
              } else if (
                paymentStatus === "denied" ||
                paymentStatus === "rejected"
              ) {
                status = "failed";
              } else if (
                paymentStatus === "processing" ||
                paymentStatus === "pending"
              ) {
                status = "pending";
              }
            } else if (order.paymentStatus) {
              if (order.paymentStatus === "paid") {
                status = "completed";
              } else if (order.paymentStatus === "failed") {
                status = "failed";
              } else {
                status = "pending";
              }
            } else if (order.status) {
              // Fallback to order status
              if (order.status === "delivered") {
                status = "completed";
              } else if (order.status === "cancelled") {
                status = "failed";
              } else {
                status = "pending";
              }
            }

            // Extract date
            const dateString = order.updatedAt || order.createdAt;
            const date = new Date(dateString);

            return {
              id: order._id,
              type: "order",
              service: productNames,
              orderNumber: order.orderNumber,
              date: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              timestamp: date.getTime(),
              amount: `₱${amount.toFixed(2)}`,
              status: status,
              paymentMethod: order.payment?.paymentMethod || "N/A",
              referenceNumber:
                order.payment?.referenceNumber || order.orderNumber || "N/A",
            };
          });

          allTransactions.push(...orderTransactions);
          console.log("✅ Order transactions:", orderTransactions.length);
        }
      } catch (error) {
        console.error("⚠️ Error loading orders:", error);
      }

      // ==================== SORT BY DATE (NEWEST FIRST) ====================
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      console.log("✅ Total transactions:", allTransactions.length);
      console.log("📋 All transactions:", allTransactions);
      setTransactions(allTransactions);
    } catch (error: any) {
      console.error("❌ Error loading payment history:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load payment history.",
      });
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle cart item operations
  const handleUpdateCartQuantity = async (
    cartItemId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    try {
      await apiClient.updateCartItemQuantity(cartItemId, newQuantity);
      await loadCart();
      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Cart quantity updated.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update quantity.",
      });
    }
  };

  const handleRemoveCartItem = async (cartItemId: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.removeFromCart(cartItemId);
              await loadCart();
              Toast.show({
                type: "success",
                text1: "Removed",
                text2: "Item removed from cart.",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to remove item.",
              });
            }
          },
        },
      ],
    );
  };

  const handleClearCart = async () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.clearCart();
              await loadCart();
              Toast.show({
                type: "success",
                text1: "Cleared",
                text2: "Cart cleared successfully.",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to clear cart.",
              });
            }
          },
        },
      ],
    );
  };

  // Handle favorites operations
  const handleRemoveFavorite = async (favoriteId: string) => {
    Alert.alert(
      "Remove Favorite",
      "Are you sure you want to remove this item from your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.removeFromFavorites(favoriteId);
              await loadFavorites();
              Toast.show({
                type: "success",
                text1: "Removed",
                text2: "Item removed from favorites.",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to remove item.",
              });
            }
          },
        },
      ],
    );
  };

  const handleAddToCartFromFavorites = async (product: Product) => {
    try {
      await apiClient.addToCart(product._id, 1);
      Toast.show({
        type: "success",
        text1: "Added to Cart",
        text2: `${product.name} has been added to your cart.`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add item to cart.",
      });
    }
  };

  // Handle rating operations - FIXED VERSION
  const handleRateOrder = (order: Order) => {
    setSelectedOrderForRating(order);
    setSelectedProductForRating(null);
    setRatingValue(0);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  const handleRateProduct = (order: Order, product: Product) => {
    setSelectedOrderForRating(order);
    setSelectedProductForRating(product);
    setRatingValue(0);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  // FIXED: Submit rating function - removed auto-logout issue
  const submitRating = async () => {
    if (!selectedOrderForRating) return;

    try {
      if (selectedProductForRating) {
        // Rate specific product using the correct method
        await apiClient.rateOrderProduct(
          selectedOrderForRating._id,
          selectedProductForRating._id,
          ratingValue,
          ratingComment,
        );
      } else {
        // Rate entire order using the correct method
        await apiClient.rateOrder(
          selectedOrderForRating._id,
          ratingValue,
          ratingComment,
        );
      }

      Toast.show({
        type: "success",
        text1: "Rating Submitted",
        text2: "Thank you for your feedback!",
      });

      setRatingModalVisible(false);
      loadOrders(); // Refresh orders to update rating status
    } catch (error: any) {
      console.error("❌ Error submitting rating:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit rating",
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logout, "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.logout();
            setUser(null);
            setIsLoggedIn(false);
            Alert.alert("Success", "Logged out successfully");
            router.replace("/(auth)");
          } catch (error: any) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const handleSignUp = () => {
    router.push("/(auth)/SignUp");
  };

  const handleLogin = () => {
    router.push("/(auth)");
  };

  const handleLanguageSelect = (code: string, name: string) => {
    setSelectedLanguage(code);
    Alert.alert("Language Changed", `App language set to ${name}`);
    setLanguageModalVisible(false);
  };

  const handleProfileUpdate = async () => {
    if (!profileInfo.newPassword && !profileInfo.confirmPassword) {
      try {
        const updateData: any = {};
        if (profileInfo.username) updateData.username = profileInfo.username;
        if (profileInfo.email) updateData.email = profileInfo.email;

        if (Object.keys(updateData).length > 0) {
          const response = await apiClient.updateProfile(updateData);
          if (response.success) {
            Alert.alert("Success", "Profile updated successfully");
            setProfileInfoModalVisible(false);
            loadUser();
          } else {
            Alert.alert(
              "Error",
              response.message || "Failed to update profile",
            );
          }
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to update profile");
      }
    } else if (profileInfo.newPassword === profileInfo.confirmPassword) {
      try {
        const response = await apiClient.changePassword({
          currentPassword: profileInfo.currentPassword,
          newPassword: profileInfo.newPassword,
        });
        if (response.success) {
          Alert.alert("Success", "Password updated successfully");
          setProfileInfoModalVisible(false);
          setProfileInfo((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        } else {
          Alert.alert("Error", response.message || "Failed to update password");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to update password");
      }
    } else {
      Alert.alert("Error", "New passwords do not match");
    }
  };

  // Get product from cart item
  const getProductFromCartItem = (item: CartItem): Product | null => {
    if (typeof item.productId === "string") {
      return null;
    }
    return item.productId;
  };

  // Get product from favorite item
  const getProductFromFavoriteItem = (item: FavoriteItem): Product => {
    return item.productId;
  };

  // Get product image source
  const getProductImageSource = (product: Product) => {
    if (product.image) {
      if (typeof product.image === "string") {
        if (product.image.startsWith("http")) {
          return { uri: product.image };
        } else {
          return { uri: `http://10.74.230.139:3000${product.image}` };
        }
      }
      return product.image;
    }
    return images.mask;
  };

  const getProfileImageUrl = async () => {
    // PRIORITY 1: Check selected image state (for preview during image selection)
    if (isLoggedIn && user && !user.isGuest) {
      if (selectedImage) {
        return { uri: selectedImage };
      }

      // PRIORITY 2: Check user profile image from backend
      if (user.profileImage) {
        if (user.profileImage.startsWith("http")) {
          return { uri: user.profileImage };
        }
        return { uri: `http://10.74.230.139:3000${user.profileImage}` };
      }

      // PRIORITY 3: Check AsyncStorage for custom image as fallback
      try {
        const customImage = await AsyncStorage.getItem("customProfileImage");
        if (customImage) {
          return { uri: customImage };
        }
      } catch (error) {
        console.error("Error reading custom profile image:", error);
      }

      // PRIORITY 4: Dicebear avatar as fallback
      return {
        uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          user.id || "user"
        }`,
      };
    }

    // PRIORITY 5: Default image for guests
    return images.profile;
  };

  const ProfileAvatar = () => {
    const [imageSource, setImageSource] = useState(images.profile);
    const [isSvg, setIsSvg] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        const source = await getProfileImageUrl();
        setImageSource(source);
        setIsSvg(
          source.uri &&
            (source.uri.includes("dicebear") || source.uri.includes(".svg")),
        );
      };
      loadImage();
    }, [selectedImage, user, isLoggedIn]);

    return (
      <View style={styles.avatarContainer}>
        {isSvg ? (
          <SvgUri
            width={70}
            height={70}
            uri={imageSource.uri}
            style={styles.avatar}
          />
        ) : (
          <Image source={imageSource} style={styles.avatar} />
        )}
      </View>
    );
  };

  const ProfileAvatarWithUpload = () => {
    const [imageSource, setImageSource] = useState(images.profile);
    const [isSvg, setIsSvg] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        const source = await getProfileImageUrl();
        setImageSource(source);
        setIsSvg(
          source.uri &&
            (source.uri.includes("dicebear") || source.uri.includes(".svg")),
        );
      };
      loadImage();
    }, [selectedImage, user, isLoggedIn]);

    return (
      <View style={styles.profilePictureSection}>
        <View style={styles.profilePictureContainer}>
          {isSvg ? (
            <SvgUri
              width={100}
              height={100}
              uri={imageSource.uri}
              style={styles.profilePicture}
            />
          ) : (
            <Image source={imageSource} style={styles.profilePicture} />
          )}
          <TouchableOpacity
            style={styles.cameraIconContainer}
            onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.changePhotoText}>{t.changePhoto}</Text>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "pending":
        return "#FFA726";
      case "failed":
        return "#EF5350";
      default:
        return "#888";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t.completed;
      case "pending":
        return t.pending;
      case "failed":
        return t.failed;
      default:
        return status;
    }
  };

  // Enhanced Cart Item Component with Better Spacing
  const CartItemCard = ({ item }: { item: CartItem }) => {
    const product = getProductFromCartItem(item);
    if (!product) return null;

    return (
      <View style={styles.cartItemCard}>
        <Image
          source={getProductImageSource(product)}
          style={styles.cartItemImage}
          resizeMode="cover"
        />

        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.cartItemPrice}>₱{product.price}</Text>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() =>
                handleUpdateCartQuantity(item._id, item.quantity - 1)
              }>
              <Ionicons name="remove" size={16} color="white" />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>

            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() =>
                handleUpdateCartQuantity(item._id, item.quantity + 1)
              }>
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveCartItem(item._id)}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // Favorite Item Component
  const FavoriteItemCard = ({ item }: { item: FavoriteItem }) => {
    const product = getProductFromFavoriteItem(item);

    return (
      <View style={styles.favoriteItemCard}>
        <Image
          source={getProductImageSource(product)}
          style={styles.favoriteItemImage}
          resizeMode="cover"
        />

        <TouchableOpacity
          style={styles.removeFavoriteBtn}
          onPress={() => handleRemoveFavorite(item._id)}>
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>

        <View style={styles.favoriteItemInfo}>
          <Text style={styles.favoriteItemName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.favoriteItemPrice}>₱{product.price}</Text>

          <View style={styles.favoriteItemActions}>
            <TouchableOpacity
              style={styles.addToCartFromFavoritesBtn}
              onPress={() => handleAddToCartFromFavorites(product)}>
              <Text style={styles.addToCartFromFavoritesText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Enhanced Booking Item Component with Better Service Name Extraction
  const BookingItemCard = ({ booking }: { booking: any }) => {
    const getServiceName = () => {
      // Enhanced service name extraction
      if (booking.serviceId) {
        if (typeof booking.serviceId === "object") {
          return booking.serviceId.name || "Service";
        }
        return booking.serviceId;
      }
      if (booking.service) {
        if (typeof booking.service === "object") {
          return booking.service.name || "Service";
        }
        return booking.service;
      }
      return "Service";
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "completed":
          return "#4CAF50";
        case "cancelled":
          return "#EF5350";
        case "confirmed":
          return "#2196F3";
        case "pending":
          return "#FFA726";
        default:
          return "#FFA726";
      }
    };

    const getStatusText = (status: string) => {
      if (!status) return "Pending";
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
      <View style={styles.bookingItemCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingServiceName}>{getServiceName()}</Text>
          <View
            style={[
              styles.bookingStatusBadge,
              { backgroundColor: getStatusColor(booking.status) },
            ]}>
            <Text style={styles.bookingStatusText}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
            <Text style={styles.bookingDetailText}>
              {booking.preferredDate
                ? new Date(booking.preferredDate).toLocaleDateString()
                : "Date not set"}
            </Text>
          </View>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.bookingDetailText}>
              {booking.preferredTime || "Time not set"}
            </Text>
          </View>
          {booking.selectedStylistId && (
            <View style={styles.bookingDetailRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
              <Text style={styles.bookingDetailText}>
                {typeof booking.selectedStylistId === "object"
                  ? booking.selectedStylistId.username
                  : "Stylist"}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Orders Modal Content Component
  const OrdersModalContent = () => {
    const filteredOrders = orders.filter((order) => {
      switch (selectedOrderTab) {
        case "completed":
          return order.status === "delivered";
        case "pending":
          return ["pending", "confirmed", "processing", "shipped"].includes(
            order.status,
          );
        case "cancelled":
          return ["cancelled", "refunded"].includes(order.status);
        default:
          return true;
      }
    });

    const getOrderStatusColor = (status: string) => {
      switch (status) {
        case "delivered":
          return "#4CAF50";
        case "shipped":
          return "#2196F3";
        case "processing":
          return "#FF9800";
        case "pending":
          return "#FFC107";
        case "cancelled":
        case "refunded":
          return "#F44336";
        default:
          return "#9E9E9E";
      }
    };

    const getOrderStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        pending: "Pending",
        confirmed: "Confirmed",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        refunded: "Refunded",
      };
      return statusMap[status] || status;
    };

    const OrderItemCard = ({ order }: { order: Order }) => (
      <View style={styles.orderItemCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View
            style={[
              styles.orderStatus,
              { backgroundColor: getOrderStatusColor(order.status) },
            ]}>
            <Text style={styles.orderStatusText}>
              {getOrderStatusText(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {order.items.map((item, index) => {
            const product =
              typeof item.product === "string" ? null : item.product;
            return (
              <View key={index} style={styles.orderProduct}>
                <Image
                  source={
                    product ? getProductImageSource(product) : images.mask
                  }
                  style={styles.orderProductImage}
                />
                <View style={styles.orderProductInfo}>
                  <Text style={styles.orderProductName}>
                    {product ? product.name : "Product"}
                  </Text>
                  <Text style={styles.orderProductDetails}>
                    Qty: {item.quantity} • ₱{item.price}
                  </Text>
                </View>
                {order.status === "delivered" && product && !item.isRated && (
                  <TouchableOpacity
                    style={styles.rateProductButton}
                    onPress={() => handleRateProduct(order, product)}>
                    <Ionicons name="star-outline" size={16} color="#FFD700" />
                    <Text style={styles.rateProductText}>Rate</Text>
                  </TouchableOpacity>
                )}
                {item.isRated && (
                  <View style={styles.ratedBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratedText}>Rated</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>Total: ₱{order.totalAmount}</Text>

          {order.status === "delivered" && !order.isRated && (
            <TouchableOpacity
              style={styles.rateOrderButton}
              onPress={() => handleRateOrder(order)}>
              <Text style={styles.rateOrderText}>Rate Order</Text>
            </TouchableOpacity>
          )}

          {order.isRated && (
            <View style={styles.ratedOrderBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratedOrderText}>Order Rated</Text>
            </View>
          )}
        </View>
      </View>
    );

    return (
      <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.8 }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.myOrders}</Text>
          <TouchableOpacity onPress={() => setOrdersModalVisible(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Order Tabs */}
        <View style={styles.orderTabs}>
          <TouchableOpacity
            style={[
              styles.orderTab,
              selectedOrderTab === "completed" && styles.orderTabActive,
            ]}
            onPress={() => setSelectedOrderTab("completed")}>
            <Text
              style={[
                styles.orderTabText,
                selectedOrderTab === "completed" && styles.orderTabTextActive,
              ]}>
              {t.completed}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orderTab,
              selectedOrderTab === "pending" && styles.orderTabActive,
            ]}
            onPress={() => setSelectedOrderTab("pending")}>
            <Text
              style={[
                styles.orderTabText,
                selectedOrderTab === "pending" && styles.orderTabTextActive,
              ]}>
              {t.pending}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orderTab,
              selectedOrderTab === "cancelled" && styles.orderTabActive,
            ]}
            onPress={() => setSelectedOrderTab("cancelled")}>
            <Text
              style={[
                styles.orderTabText,
                selectedOrderTab === "cancelled" && styles.orderTabTextActive,
              ]}>
              {t.cancelled}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent}>
          {loadingOrders ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E63946" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : filteredOrders.length > 0 ? (
            <View style={styles.ordersList}>
              {filteredOrders.map((order) => (
                <OrderItemCard key={order._id} order={order} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="bag-outline" size={80} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Orders</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedOrderTab === "completed"
                  ? "You don't have any completed orders yet."
                  : selectedOrderTab === "pending"
                    ? "You don't have any pending orders."
                    : "You don't have any cancelled orders."}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setOrdersModalVisible(false);
                  router.push("/(tabs)/products");
                }}>
                <Text style={styles.primaryButtonText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Rating Modal */}
        <Modal
          visible={ratingModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setRatingModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.6 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedProductForRating ? t.rateProduct : t.rateOrder}
                </Text>
                <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingTitle}>
                    How would you rate your experience?
                  </Text>

                  {/* Star Rating */}
                  <View style={styles.starRatingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRatingValue(star)}>
                        <Ionicons
                          name={star <= ratingValue ? "star" : "star-outline"}
                          size={40}
                          color="#FFD700"
                          style={styles.star}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Comment Input */}
                  <TextInput
                    style={styles.ratingCommentInput}
                    placeholder={t.addComments}
                    placeholderTextColor="#6B7280"
                    value={ratingComment}
                    onChangeText={setRatingComment}
                    multiline
                    numberOfLines={4}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitRatingButton,
                      ratingValue === 0 && styles.submitRatingButtonDisabled,
                    ]}
                    onPress={submitRating}
                    disabled={ratingValue === 0}>
                    <Text style={styles.submitRatingButtonText}>
                      {t.submitRating}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      title: t.language,
      icon: "globe-outline",
      onPress: () => setLanguageModalVisible(true),
    },
    {
      title: t.profileInfo,
      icon: "person-outline",
      onPress: () => setProfileInfoModalVisible(true),
    },
    {
      title: t.orders,
      icon: "bag-outline",
      onPress: () => setOrdersModalVisible(true),
    },
    {
      title: t.bookings,
      icon: "calendar-outline",
      onPress: () => setBookingsModalVisible(true),
    },
    {
      title: t.cart,
      icon: "cart-outline",
      onPress: () => setCartModalVisible(true),
    },
    {
      title: t.favorites,
      icon: "heart-outline",
      onPress: () => setFavoritesModalVisible(true),
    },
    {
      title: t.paymentHistory,
      icon: "card-outline",
      onPress: () => {
        setPaymentHistoryModalVisible(true);
        if (isLoggedIn) {
          loadPaymentHistory();
        }
      },
    },
    {
      title: t.terms,
      icon: "document-text-outline",
      onPress: () => setTermsModalVisible(true),
    },
    {
      title: t.help,
      icon: "help-circle-outline",
      onPress: () => setHelpModalVisible(true),
    },
  ];

  // Enhanced Bookings Modal Content
  const BookingsModalContent = () => (
    <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.8 }]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{t.myBookings}</Text>
        <TouchableOpacity onPress={() => setBookingsModalVisible(false)}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {loadingBookings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E63946" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length > 0 ? (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => (
              <BookingItemCard key={booking._id} booking={booking} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={80} color="#6B7280" />
            <Text style={styles.emptyStateText}>No Bookings</Text>
            <Text style={styles.emptyStateSubtext}>{t.bookingDesc}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setBookingsModalVisible(false);
                router.push("/booking");
              }}>
              <Text style={styles.primaryButtonText}>{t.bookNewService}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Enhanced Cart Modal Content with Better Spacing
  const CartModalContent = () => (
    <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.85 }]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{t.myCart}</Text>
        <View style={styles.cartHeaderActions}>
          {cart && cart.items.length > 0 && (
            <TouchableOpacity
              style={styles.clearCartButton}
              onPress={handleClearCart}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.clearCartText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCartModalVisible(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cartScrollContent}>
        {loadingCart ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E63946" />
            <Text style={styles.loadingText}>Loading cart...</Text>
          </View>
        ) : cart && cart.items.length > 0 ? (
          <View style={styles.cartContent}>
            <View style={styles.cartItemsList}>
              {cart.items.map((item) => (
                <CartItemCard key={item._id} item={item} />
              ))}
            </View>

            {/* Enhanced Cart Summary with Better Spacing */}
            <View style={styles.cartSummary}>
              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryLabel}>
                  Items ({cart.items.length})
                </Text>
                <Text style={styles.cartSummaryValue}>₱{cart.totalAmount}</Text>
              </View>

              <View style={styles.cartSummaryDivider} />

              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryLabel}>Service Fee</Text>
                <Text style={styles.cartSummaryValue}>₱0.00</Text>
              </View>

              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryLabel}>Tax</Text>
                <Text style={styles.cartSummaryValue}>₱0.00</Text>
              </View>

              <View style={styles.cartSummaryDivider} />

              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartTotalLabel}>Total Amount</Text>
                <Text style={styles.cartTotalValue}>₱{cart.totalAmount}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => {
                setCartModalVisible(false);
                router.push("/(menu)/checkout");
              }}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="cart-outline" size={80} color="#6B7280" />
            <Text style={styles.emptyStateText}>Cart Empty</Text>
            <Text style={styles.emptyStateSubtext}>{t.cartDesc}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setCartModalVisible(false);
                router.push("/(tabs)/products");
              }}>
              <Text style={styles.primaryButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Updated Favorites Modal Content
  const FavoritesModalContent = () => (
    <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.8 }]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{t.myFavorites}</Text>
        <TouchableOpacity onPress={() => setFavoritesModalVisible(false)}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {loadingFavorites ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E63946" />
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : favorites.length > 0 ? (
          <View style={styles.favoritesGrid}>
            {favorites.map((item) => (
              <FavoriteItemCard key={item._id} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="heart-outline" size={80} color="#6B7280" />
            <Text style={styles.emptyStateText}>No Favorites</Text>
            <Text style={styles.emptyStateSubtext}>{t.favoritesDesc}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setFavoritesModalVisible(false);
                router.push("/(tabs)/products");
              }}>
              <Text style={styles.primaryButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ProfileAvatar />
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {isLoggedIn && user ? user.username : t.guest}
            </Text>
            <Text style={styles.email}>
              {isLoggedIn && user ? user.email : t.guestEmail}
            </Text>
            {!isLoggedIn && (
              <View style={styles.guestBadge}>
                <Ionicons name="person-outline" size={12} color="#FAAE16" />
                <Text style={styles.guestBadgeText}>Guest</Text>
              </View>
            )}
          </View>
        </View>

        {!isLoggedIn && (
          <View style={styles.signUpPrompt}>
            <Ionicons name="lock-closed-outline" size={24} color="#FAAE16" />
            <View style={styles.signUpTextContainer}>
              <Text style={styles.signUpTitle}>{t.accountRequired}</Text>
              <Text style={styles.signUpDescription}>
                {t.accountRequiredDesc}
              </Text>
            </View>
            <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
              <Text style={styles.signUpBtnText}>{t.signUp}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              disabled={!isLoggedIn && index !== 0}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={!isLoggedIn && index !== 0 ? "#555" : "#fff"}
              />
              <Text
                style={[
                  styles.menuText,
                  !isLoggedIn && index !== 0 && styles.menuTextDisabled,
                ]}>
                {item.title}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={!isLoggedIn && index !== 0 ? "#555" : "#888"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {!isLoggedIn ? (
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>{t.login}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.6 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.language}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === language.code &&
                      styles.languageItemActive,
                  ]}
                  onPress={() =>
                    handleLanguageSelect(language.code, language.name)
                  }>
                  <Text style={styles.languageText}>{language.name}</Text>
                  {selectedLanguage === language.code && (
                    <Ionicons name="checkmark" size={20} color="#E63946" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Information Modal */}
      <Modal
        visible={profileInfoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.85 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.profileInfo}</Text>
              <TouchableOpacity
                onPress={() => setProfileInfoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              <ProfileAvatarWithUpload />

              <View style={styles.formSection}>
                <FloatingLabelInput
                  label={t.username}
                  value={profileInfo.username}
                  onChangeText={(text) =>
                    setProfileInfo((prev) => ({ ...prev, username: text }))
                  }
                  icon="person-outline"
                />

                <FloatingLabelInput
                  label={t.email}
                  value={profileInfo.email}
                  onChangeText={(text) =>
                    setProfileInfo((prev) => ({ ...prev, email: text }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>{t.changePassword}</Text>

              <View style={styles.formSection}>
                <FloatingLabelInput
                  label={t.currentPassword}
                  value={profileInfo.currentPassword}
                  onChangeText={(text) =>
                    setProfileInfo((prev) => ({
                      ...prev,
                      currentPassword: text,
                    }))
                  }
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <FloatingLabelInput
                  label={t.newPassword}
                  value={profileInfo.newPassword}
                  onChangeText={(text) =>
                    setProfileInfo((prev) => ({ ...prev, newPassword: text }))
                  }
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <FloatingLabelInput
                  label={t.confirmPassword}
                  value={profileInfo.confirmPassword}
                  onChangeText={(text) =>
                    setProfileInfo((prev) => ({
                      ...prev,
                      confirmPassword: text,
                    }))
                  }
                  secureTextEntry
                  icon="lock-closed-outline"
                />
              </View>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleProfileUpdate}>
                <Text style={styles.updateButtonText}>{t.updateProfile}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Orders Modal */}
      <Modal
        visible={ordersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrdersModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <OrdersModalContent />
        </View>
      </Modal>

      {/* Bookings Modal */}
      <Modal
        visible={bookingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BookingsModalContent />
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal
        visible={cartModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCartModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <CartModalContent />
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={favoritesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFavoritesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <FavoritesModalContent />
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={paymentHistoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentHistoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.75 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.paymentHistory}</Text>
              <TouchableOpacity
                onPress={() => setPaymentHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>{t.filterBy}:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScrollView}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    paymentFilter === "all" && styles.filterButtonActive,
                  ]}
                  onPress={() => setPaymentFilter("all")}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      paymentFilter === "all" && styles.filterButtonTextActive,
                    ]}>
                    {t.allTransactions}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    paymentFilter === "completed" && styles.filterButtonActive,
                  ]}
                  onPress={() => setPaymentFilter("completed")}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      paymentFilter === "completed" &&
                        styles.filterButtonTextActive,
                    ]}>
                    {t.completed}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    paymentFilter === "pending" && styles.filterButtonActive,
                  ]}
                  onPress={() => setPaymentFilter("pending")}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      paymentFilter === "pending" &&
                        styles.filterButtonTextActive,
                    ]}>
                    {t.pending}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    paymentFilter === "failed" && styles.filterButtonActive,
                  ]}
                  onPress={() => setPaymentFilter("failed")}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      paymentFilter === "failed" &&
                        styles.filterButtonTextActive,
                    ]}>
                    {t.failed}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              {loadingTransactions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#E63946" />
                  <Text style={styles.loadingText}>
                    {t.loadingTransactions}
                  </Text>
                </View>
              ) : filteredTransactions.length > 0 ? (
                <View style={styles.paymentSummary}>
                  {filteredTransactions.map((transaction) => (
                    <View
                      key={transaction.id}
                      style={styles.enhancedTransactionCard}>
                      <View style={styles.transactionHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: getStatusColor(
                                transaction.status,
                              ),
                            },
                          ]}>
                          <Text style={styles.statusText}>
                            {getStatusText(transaction.status)}
                          </Text>
                        </View>
                        <Text style={styles.transactionDate}>
                          {transaction.date}
                        </Text>
                      </View>
                      <View style={styles.transactionBody}>
                        <View style={styles.serviceIconContainer}>
                          <Ionicons
                            name={
                              transaction.type === "order"
                                ? "cart-outline"
                                : "cut-outline"
                            }
                            size={24}
                            color="#E63946"
                          />
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={styles.serviceName}>
                            {transaction.service}
                          </Text>
                          <Text style={styles.transactionId}>
                            {transaction.type === "order"
                              ? "Order"
                              : "Transaction"}{" "}
                            #{transaction.id.slice(-8).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.transactionAmount}>
                          {transaction.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="receipt-outline" size={80} color="#6B7280" />
                  <Text style={styles.emptyStateText}>{t.noTransactions}</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {paymentFilter === "all"
                      ? t.noTransactionsDesc
                      : `You don't have any ${paymentFilter} transactions yet.`}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.terms}</Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent}>
              <Text style={styles.termsSectionTitle}>Data Privacy Policy</Text>
              <Text style={styles.termsText}>
                All personal and appointment data is handled according to our
                Privacy Policy. We do not share your information without
                consent.
              </Text>

              <Text style={styles.termsSectionTitle}>User Registration</Text>
              <Text style={styles.termsText}>
                Clients must create an account to book appointments. You are
                responsible for maintaining the accuracy of your personal
                information and securing your account credentials.
              </Text>

              <Text style={styles.termsSectionTitle}>Late Arrivals</Text>
              <Text style={styles.termsText}>
                Arriving 15 minutes or more after your appointment time may
                result in cancellation or delay accommodation to the service.
              </Text>

              <Text style={styles.termsSectionTitle}>Health and Safety</Text>
              <Text style={styles.termsText}>
                Clients are expected to inform staff of any medical conditions,
                allergies, or sensitivities. The salon is not liable for adverse
                reactions not disclosed beforehand.
              </Text>

              <Text style={styles.termsSectionTitle}>Prohibited Behavior</Text>
              <Text style={styles.termsText}>
                We reserve the right to refuse service to anyone who is abusive,
                intoxicated, or violates salon policies.
              </Text>

              <Text style={styles.termsSectionTitle}>Refund Policy</Text>
              <Text style={styles.termsText}>
                You agree to adhere to the no refund policy.
              </Text>

              <Text style={styles.termsSectionTitle}>System Availability</Text>
              <Text style={styles.termsText}>
                We aim to keep the system online and functional but cannot
                guarantee uninterrupted access due to maintenance or technical
                issues.
              </Text>

              <Text style={styles.termsSectionTitle}>
                Modifications to Terms
              </Text>
              <Text style={styles.termsText}>
                These Terms and Conditions may be updated at any time. Continued
                use of the platform implies acceptance of the current version.
              </Text>

              <Text style={styles.termsSectionTitle}>
                Payment and Order Approval Terms
              </Text>
              <Text style={styles.termsText}>
                By submitting a booking or placing an order, you agree that your
                payment will initially be marked as pending until the admin
                verifies the proof of payment you provide. If the proof is
                correct, the payment will be approved; if incorrect, the payment
                will be denied, and the order or booking will not be processed.
              </Text>

              <Text style={styles.termsSectionTitle}>
                Unsuitable Conditions
              </Text>
              <Text style={styles.termsText}>
                Services may be declined if a clients hair, skin, or nails are
                in unsuitable condition for treatment. Conditions such as
                excessive damage, infections, allergies, or active skin
                conditions may prevent certain treatments for safety. Clients
                should inform the salon of any concerns before booking services.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.7 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.help}</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollContent}>
              <View style={styles.helpSection}>
                <Ionicons name="call-outline" size={24} color="#E63946" />
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpTitle}>{t.contactUs}</Text>
                  <Text style={styles.helpDescription}>
                    {t.phone}: +63 912 345 6789{"\n"}
                    {t.email}: support@sandrealee.com
                  </Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <Ionicons name="time-outline" size={24} color="#E63946" />
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpTitle}>{t.businessHours}</Text>
                  <Text style={styles.helpDescription}>
                    Monday - Friday: 9:30 AM - 8:30 PM{"\n"}
                    Saturday - Sunday: 9:30 AM - 8:30 PM
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

              <View style={styles.helpSection}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#E63946"
                />
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpTitle}>{t.faqs}</Text>
                  <Text style={styles.helpDescription}>
                    • How to book an appointment?{"\n"}• What are your payment
                    methods?{"\n"}• Can I cancel or reschedule?{"\n"}• What
                    safety measures do you have?
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.contactButton}>
                <Text style={styles.contactButtonText}>{t.sendMessage}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 20,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    top: 30,
    borderRadius: 35,
    overflow: "hidden",
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#222",
  },
  userInfo: {
    top: 30,
    flex: 1,
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 4,
  },
  guestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  guestBadgeText: {
    color: "#FAAE16",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  signUpPrompt: {
    top: 30,
    backgroundColor: "#1A1A1F",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  signUpTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  signUpTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  signUpDescription: {
    color: "#aaa",
    fontSize: 13,
  },
  signUpBtn: {
    backgroundColor: "#E63946",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signUpBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  menu: {
    marginTop: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#222",
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    color: "#fff",
    fontSize: 16,
  },
  menuTextDisabled: {
    color: "#555",
  },
  loginBtn: {
    marginBottom: 130,
    backgroundColor: "#E63946",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutBtn: {
    marginBottom: 100,
    borderWidth: 1,
    borderColor: "#E63946",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  logoutText: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1F",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  languageItemActive: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
  },
  languageText: {
    color: "#fff",
    fontSize: 16,
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2A2A2A",
    borderWidth: 3,
    borderColor: "#E63946",
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  floatingInputWrapperFocused: {
    borderColor: "#619AE4",
  },
  inputIconContainer: {
    position: "absolute",
    left: 16,
    zIndex: 2,
  },
  floatingInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
  },
  floatingInputWithIcon: {
    paddingLeft: 48,
  },
  formSection: {
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: "#E63946",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  comingSoonText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  primaryButton: {
    backgroundColor: "#E63946",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    minWidth: 200,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10,
  },
  filterScrollView: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: "#E63946",
  },
  filterButtonText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  paymentSummary: {
    flex: 1,
  },
  enhancedTransactionCard: {
    backgroundColor: "#0B0B0F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  transactionBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  serviceName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionId: {
    color: "#888",
    fontSize: 12,
  },
  transactionDate: {
    color: "#888",
    fontSize: 12,
  },
  transactionAmount: {
    color: "#E63946",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  termsSectionTitle: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  termsText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  helpTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  helpDescription: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: "#E63946",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Enhanced Cart Header Actions
  cartHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clearCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  clearCartText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },

  // Enhanced Cart Scroll Content
  cartScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Enhanced Cart Styles
  cartContent: {
    flex: 1,
  },
  cartItemsList: {
    gap: 12,
    marginBottom: 20,
  },
  cartItemCard: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cartItemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 20,
  },
  cartItemPrice: {
    color: "#619AE4",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: "center",
  },
  quantityText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  removeBtn: {
    padding: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },

  // Enhanced Cart Summary
  cartSummary: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cartSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cartSummaryLabel: {
    color: "#9CA3AF",
    fontSize: 15,
  },
  cartSummaryValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  cartSummaryDivider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 12,
  },
  cartTotalLabel: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  cartTotalValue: {
    color: "#619AE4",
    fontSize: 20,
    fontWeight: "700",
  },

  // Enhanced Checkout Button
  checkoutButton: {
    backgroundColor: "#619AE4",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#619AE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  // Favorites Styles
  favoritesGrid: {
    gap: 12,
  },
  favoriteItemCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    overflow: "hidden",
  },
  favoriteItemImage: {
    width: "100%",
    height: 150,
  },
  removeFavoriteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    padding: 6,
  },
  favoriteItemInfo: {
    padding: 12,
  },
  favoriteItemName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  favoriteItemPrice: {
    color: "#619AE4",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  favoriteItemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addToCartFromFavoritesBtn: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addToCartFromFavoritesText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Enhanced Bookings Styles
  bookingsList: {
    gap: 12,
  },
  bookingItemCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bookingServiceName: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  bookingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookingStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  bookingDetails: {
    gap: 12,
  },
  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bookingDetailText: {
    color: "#9CA3AF",
    fontSize: 15,
  },

  // Order Styles
  orderTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  orderTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  orderTabActive: {
    borderBottomColor: "#E63946",
  },
  orderTabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  orderTabTextActive: {
    color: "#E63946",
  },
  ordersList: {
    padding: 16,
    gap: 12,
  },
  orderItemCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderNumber: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  orderDate: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  orderItems: {
    gap: 8,
    marginBottom: 12,
  },
  orderProduct: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#0B0B0F",
    borderRadius: 8,
  },
  orderProductImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  orderProductInfo: {
    flex: 1,
  },
  orderProductName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  orderProductDetails: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  rateProductButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  rateProductText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  ratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratedText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "600",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  orderTotal: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  rateOrderButton: {
    backgroundColor: "#E63946",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rateOrderText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  ratedOrderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  ratedOrderText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },

  // Rating Modal Styles
  ratingContainer: {
    padding: 20,
    alignItems: "center",
  },
  ratingTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  starRatingContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingCommentInput: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 24,
    width: "100%",
  },
  submitRatingButton: {
    backgroundColor: "#E63946",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  submitRatingButtonDisabled: {
    backgroundColor: "#6B7280",
  },
  submitRatingButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ProfileScreen;
