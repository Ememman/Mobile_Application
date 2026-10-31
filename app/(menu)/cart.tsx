// Cart.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "@/constants/images";
import { useFonts } from "expo-font";
import { apiClient, Cart, CartItem, Product } from "@/app/api/apiClient";
import { SvgUri } from "react-native-svg";

const API_BASE_URL = "https://sandrealeesalon.onrender.com";
const { width: screenWidth } = Dimensions.get("window");

interface User {
  id: string;
  username?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  isGuest?: boolean;
}

export default function CartScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../../assets/fonts/TenaliRamakrishna-Regular.ttf"),
    Urbanist: require("../../assets/fonts/Urbanist-VariableFont_wght.ttf"),
  });

  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const line1Translation = useRef(new Animated.Value(0)).current;
  const line3Translation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      await checkAuthStatus();
      await fetchCart();
    };
    loadData();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartResponse = await apiClient.getCart();
      if (cartResponse.success) {
        setCart(cartResponse.data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load cart.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    await checkAuthStatus();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Cart updated successfully!",
    });
  };

  const checkAuthStatus = async () => {
    try {
      const isAuth = await apiClient.isAuthenticated();

      if (!isAuth) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      const profileResponse = await apiClient.getCurrentUser();

      if (profileResponse.success && profileResponse.user) {
        const userData = profileResponse.user;

        if (userData.isGuest) {
          await apiClient.logout();
          setIsLoggedIn(false);
          setUser(null);
        } else {
          setIsLoggedIn(true);
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            profileImage: userData.profileImage,
            role: userData.role,
            isGuest: false,
          });
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error: any) {
      console.error("Error checking auth:", error.message);
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // ✨ IMPROVED: Generate profile image URL with better error handling
  const getProfileImageUrl = async (): Promise<{ uri: string }> => {
    try {
      // Priority 1: Check for custom profile image from AsyncStorage
      const customImage = await AsyncStorage.getItem("customProfileImage");
      if (customImage) {
        console.log("🖼️ Using custom profile image from storage");
        return { uri: customImage };
      }
    } catch (error) {
      console.error("Error reading custom profile image:", error);
    }

    // Priority 2: Use user's profile image from API
    if (isLoggedIn && user && !user.isGuest && user.profileImage) {
      console.log("🖼️ Using profile image from API:", user.profileImage);
      if (user.profileImage.startsWith("http")) {
        return { uri: user.profileImage };
      } else {
        // Ensure the path starts with a slash
        const cleanPath = user.profileImage.startsWith("/")
          ? user.profileImage
          : `/${user.profileImage}`;
        return { uri: `${API_BASE_URL}${cleanPath}` };
      }
    }

    // Priority 3: Generate avatar using DiceBear for logged-in users
    if (isLoggedIn && user && !user.isGuest) {
      const seed = user.username || user.email || user.id || "default";
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        seed,
      )}&backgroundColor=65c9ff,b6e3f4`;
      console.log("🖼️ Generated DiceBear avatar:", avatarUrl);
      return { uri: avatarUrl };
    }

    // Priority 4: Fallback to default profile image
    console.log("🖼️ Using default profile image");
    return images.profile;
  };

  // ✨ IMPROVED: Profile Image Component with better state management
  const ProfileImage = () => {
    const [imageSource, setImageSource] = useState(images.profile);
    const [isSvg, setIsSvg] = useState(false);
    const [imageError, setImageError] = useState(false);

    useFocusEffect(
      React.useCallback(() => {
        let isMounted = true;

        const loadImage = async () => {
          try {
            if (!isMounted) return;

            const source = await getProfileImageUrl();

            if (!isMounted) return;

            setImageSource(source);
            setImageError(false);

            // Check if it's an SVG (DiceBear or SVG file)
            const isSvgSource = source.uri
              ? source.uri.includes("dicebear") || source.uri.includes(".svg")
              : false;
            setIsSvg(isSvgSource);

            console.log("🖼️ Profile image loaded:", {
              uri: source.uri ? `${source.uri.substring(0, 50)}...` : "local",
              isSvg: isSvgSource,
              isLoggedIn,
              hasUser: !!user,
            });
          } catch (error) {
            console.error("❌ Error loading profile image:", error);
            if (isMounted) {
              setImageError(true);
              setImageSource(images.profile);
              setIsSvg(false);
            }
          }
        };

        loadImage();

        return () => {
          isMounted = false;
        };
      }, [user, isLoggedIn]), // ✅ Added proper dependencies
    );

    const handleImageError = () => {
      console.error("❌ Profile image failed to load, using fallback");
      setImageError(true);
      setImageSource(images.profile);
      setIsSvg(false);
    };

    return (
      <TouchableOpacity
        onPress={() => {
          if (isLoggedIn && user && !user.isGuest) {
            router.push("/(tabs)/profile");
          } else {
            router.push("/(auth)");
          }
        }}
        style={styles.profileImageContainer}>
        {isSvg ? (
          <SvgUri
            width={42}
            height={42}
            uri={imageSource.uri || ""}
            style={styles.profileImg}
            onError={handleImageError}
          />
        ) : (
          <Image
            source={imageSource}
            style={styles.profileImg}
            onError={handleImageError}
            defaultSource={images.profile}
          />
        )}

        {/* Debug indicator - remove in production */}
        {__DEV__ && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              backgroundColor: imageError ? "#EF4444" : "#10B981",
              width: 8,
              height: 8,
              borderRadius: 4,
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Enhanced function to get product image source
  const getProductImageSource = (product: Product) => {
    console.log(`🛒 Loading cart image for: ${product.name}`, {
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
          console.log(`🔗 Constructed cart image URL: ${fullUrl}`);
          return { uri: fullUrl };
        }
      }
      return product.image;
    }

    // Priority 2: Use product name to determine which image to use
    const productName = product.name.toLowerCase();

    // Map product names to specific images (same logic as Products.tsx)
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
      `⚠️ No specific image found for cart product: ${product.name}, using default mask`,
    );
    return images.mask;
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

  const handleUpdateQuantity = async (
    cartItemId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    try {
      await apiClient.updateCartItemQuantity(cartItemId, newQuantity);
      await fetchCart();
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

  const handleRemoveItem = async (cartItemId: string) => {
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
              await fetchCart();
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

  const handleClearCart = () => {
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
              await fetchCart();
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

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Toast.show({
        type: "info",
        text1: "Cart Empty",
        text2: "Add items to your cart before checking out.",
      });
      return;
    }

    Alert.alert(
      "Proceed to Checkout?",
      `You have ${
        cart.items.length
      } item(s) in your cart. Total: ₱${cart.totalAmount.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            router.push({
              pathname: "/(menu)/checkout",
              params: {
                cart: JSON.stringify(cart),
              },
            });
          },
        },
      ],
    );
  };

  const getProduct = (item: CartItem): Product | null => {
    if (typeof item.productId === "string") {
      return null;
    }
    return item.productId;
  };

  // Enhanced Cart Item Card with better image handling
  const CartItemCard = ({ item }: { item: CartItem }) => {
    const product = getProduct(item);
    const [imageError, setImageError] = useState(false);
    const [currentSource, setCurrentSource] = useState(
      product ? getProductImageSource(product) : images.mask,
    );

    useEffect(() => {
      if (product) {
        setCurrentSource(getProductImageSource(product));
        setImageError(false);
      }
    }, [product]);

    const handleImageError = () => {
      console.log(`❌ Failed to load cart image for: ${product?.name}`);
      setImageError(true);
      setCurrentSource(images.mask);
    };

    if (!product) return null;

    return (
      <View style={styles.cartItemCard}>
        <View style={styles.cartItemImageContainer}>
          <Image
            source={currentSource}
            style={styles.cartItemImage}
            resizeMode="cover"
            onError={handleImageError}
            defaultSource={images.mask}
          />
          {item.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>x{item.quantity}</Text>
            </View>
          )}
        </View>

        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.cartItemCategory}>
            {product.category || "Hair Care"}
          </Text>
          <Text style={styles.cartItemPrice}>₱{product.price}</Text>
          <Text style={styles.cartItemSubtotal}>
            Subtotal: ₱{(product.price * item.quantity).toFixed(2)}
          </Text>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityBtn,
                item.quantity <= 1 && styles.quantityBtnDisabled,
              ]}
              onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
              disabled={item.quantity <= 1}>
              <Feather name="minus" size={16} color="white" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}>
              <Feather name="plus" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveItem(item._id)}>
          <Feather name="trash-2" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!fontsLoaded) return null;

  if (!isLoggedIn || !user || user.isGuest) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
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
              source={require("../../assets/images/SandreaLeeSalonLogoCapstone.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.salonText}>SALON</Text>
          </View>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={() => {
                if (isLoggedIn && user && !user.isGuest) {
                  // Show notifications for logged-in users
                  console.log("Show notifications");
                } else {
                  router.push("/(auth)");
                }
              }}>
              <Ionicons name="notifications-outline" size={22} color="white" />
            </TouchableOpacity>
            <ProfileImage />
          </View>
        </View>

        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(tabs)/profile");
              }}>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(tabs)/appointments");
              }}>
              <Text style={styles.menuText}>Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(menu)/cart");
              }}>
              <Text style={styles.menuText}>Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(menu)/favorites");
              }}>
              <Text style={styles.menuText}>Favorites</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="shopping-cart" size={80} color="#6B7280" />
            <Ionicons
              name="lock-closed"
              size={24}
              color="#EF4444"
              style={styles.lockIcon}
            />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtext}>
            Please log in to view your cart and manage your items
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/(auth)")}>
            <Text style={styles.loginBtnText}>Log In to Continue</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
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
            source={require("../../assets/images/SandreaLeeSalonLogoCapstone.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.salonText}>SALON</Text>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {
              if (isLoggedIn && user && !user.isGuest) {
                // Show notifications for logged-in users
                console.log("Show notifications");
              } else {
                router.push("/(auth)");
              }
            }}>
            <Ionicons name="notifications-outline" size={22} color="white" />
          </TouchableOpacity>
          <ProfileImage />
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/profile");
            }}>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/appointments");
            }}>
            <Text style={styles.menuText}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/cart");
            }}>
            <Text style={styles.menuText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(menu)/favorites");
            }}>
            <Text style={styles.menuText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.pageHeader}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Shopping Cart</Text>
          {cart && cart.items.length > 0 && (
            <Text style={styles.itemCount}>({cart.items.length} items)</Text>
          )}
        </View>
        {cart && cart.items.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}>
            <Feather name="trash-2" size={18} color="#EF4444" />
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

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
        }
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color="#619AE4"
              style={styles.loader}
            />
            <Text style={styles.loaderText}>Loading your cart...</Text>
          </View>
        ) : cart && cart.items.length > 0 ? (
          <View style={styles.content}>
            <View style={styles.cartItemsContainer}>
              {cart.items.map((item) => (
                <CartItemCard key={item._id} item={item} />
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Items ({cart.items.length})
                </Text>
                <Text style={styles.summaryValue}>
                  ₱{cart.totalAmount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.shippingValue}>Free</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalValue}>
                  ₱{cart.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.promoSection}>
              <TouchableOpacity style={styles.promoButton}>
                <Feather name="tag" size={18} color="#619AE4" />
                <Text style={styles.promoText}>Add Promo Code</Text>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="shopping-cart" size={80} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Browse our products and add items to get started
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/(tabs)/products")}>
              <Feather name="shopping-bag" size={18} color="white" />
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {cart && cart.items.length > 0 && (
        <View style={styles.checkoutFooter}>
          <View style={styles.checkoutTotalContainer}>
            <Text style={styles.checkoutTotalLabel}>Total</Text>
            <Text style={styles.checkoutTotalValue}>
              ₱{cart.totalAmount.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.9}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0A0E17",
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#0A0E17",
  },
  profileImageContainer: {
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#374151",
  },
  profileImg: {
    width: 42,
    height: 42,
    borderRadius: 50,
    backgroundColor: "transparent",
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
    borderWidth: 1,
    borderColor: "#374151",
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#0A0E17",
  },
  pageTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: {
    color: "white",
    fontSize: 28,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  itemCount: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },
  clearText: {
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  scrollContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  cartItemsContainer: {
    gap: 12,
  },
  cartItemCard: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cartItemImageContainer: {
    position: "relative",
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  quantityBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#619AE4",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityBadgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  cartItemName: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    marginBottom: 2,
  },
  cartItemCategory: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 4,
  },
  cartItemPrice: {
    color: "#619AE4",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  cartItemSubtotal: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
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
  quantityBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#1F2937",
  },
  quantityText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  removeBtn: {
    padding: 8,
    alignSelf: "flex-start",
  },
  summaryCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  summaryTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  summaryValue: {
    color: "white",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  shippingValue: {
    color: "#10B981",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 16,
  },
  summaryTotalLabel: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  summaryTotalValue: {
    color: "#619AE4",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  promoSection: {
    marginTop: 8,
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    borderStyle: "dashed",
  },
  promoText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
    flex: 1,
    marginLeft: 12,
  },
  checkoutFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1F2937",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  checkoutTotalLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
  },
  checkoutTotalValue: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  checkoutBtn: {
    backgroundColor: "#619AE4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#619AE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    position: "relative",
    marginBottom: 24,
  },
  lockIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  shopBtn: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#619AE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#619AE4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  loader: {
    marginBottom: 16,
  },
  loaderText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
  },
});
