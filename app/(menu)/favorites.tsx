// Favorites.tsx
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
  Modal,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "@/constants/images";
import { useFonts } from "expo-font";
import { apiClient, FavoriteItem, Product } from "@/app/api/apiClient";
import { SvgUri } from "react-native-svg";

const API_BASE_URL = "http://10.74.230.139:3000";

interface User {
  id: string;
  username?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  isGuest?: boolean;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailVisible, setProductDetailVisible] = useState(false);

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
      await fetchFavorites();
    };
    loadData();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favoritesResponse = await apiClient.getFavorites();
      if (favoritesResponse.success) {
        setFavorites(favoritesResponse.data);

        // Enhanced debug logging for favorites
        console.log(
          "❤️ FAVORITES DATA:",
          favoritesResponse.data.map((item) => ({
            id: item._id,
            productId: item.productId._id,
            productName: item.productId.name,
            productImage: item.productId.image,
            hasImage: !!item.productId.image,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load favorites.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    await checkAuthStatus();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Favorites updated successfully!",
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
        seed
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
      }, [user, isLoggedIn]) // ✅ Added proper dependencies
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

  // Enhanced function to get correct image source for products (same as Products.tsx)
  const getProductImageSource = (product: Product) => {
    console.log(`🖼️ Loading favorite image for: ${product.name}`, {
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
          console.log(`🔗 Constructed favorite image URL: ${fullUrl}`);
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
      `⚠️ No specific image found for favorite product: ${product.name}, using default mask`
    );
    return images.mask;
  };

  // Enhanced Product Image Component with better error handling (same as Products.tsx)
  const ProductImage = ({ product }: { product: Product }) => {
    const [currentSource, setCurrentSource] = useState(
      getProductImageSource(product)
    );

    // Reset when product changes
    useEffect(() => {
      setCurrentSource(getProductImageSource(product));
    }, [product]);

    const handleImageError = () => {
      console.log(`❌ Failed to load favorite image for: ${product.name}`);

      // Try to find a better fallback based on product name
      const productName = product.name.toLowerCase();

      if (productName.includes("shampoo") && images.shampoo) {
        console.log(
          `🔄 Falling back to shampoo image for favorite: ${product.name}`
        );
        setCurrentSource(images.shampoo);
      } else if (productName.includes("sulfate") && images.sulfate) {
        console.log(
          `🔄 Falling back to sulfate image for favorite: ${product.name}`
        );
        setCurrentSource(images.sulfate);
      } else if (productName.includes("keratin") && images.keratin) {
        console.log(
          `🔄 Falling back to keratin image for favorite: ${product.name}`
        );
        setCurrentSource(images.keratin);
      } else {
        console.log(
          `🔄 Using default mask image for favorite: ${product.name}`
        );
        setCurrentSource(images.mask);
      }
    };

    return (
      <Image
        source={currentSource}
        style={styles.favoriteImage}
        resizeMode="cover"
        onError={handleImageError}
        defaultSource={images.mask}
      />
    );
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

  const handleRemoveFromFavorites = async (favoriteId: string) => {
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
              await fetchFavorites();
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
      ]
    );
  };

  const handleAddToCart = async (product: Product) => {
    if (!isLoggedIn || !user || user.isGuest) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "Please log in to add items to cart.",
      });
      router.push("/(auth)");
      return;
    }

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

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setProductDetailVisible(true);
  };

  const handleAddToFavorites = async (product: Product) => {
    if (!isLoggedIn || !user || user.isGuest) {
      Toast.show({
        type: "error",
        text1: "Authentication Required",
        text2: "Please log in to add items to favorites.",
      });
      router.push("/(auth)");
      return;
    }

    try {
      await apiClient.addToFavorites(product._id);
      Toast.show({
        type: "success",
        text1: "Added to Favorites",
        text2: `${product.name} has been added to your favorites.`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add item to favorites.",
      });
    }
  };

  // ✨ FIXED: Get product rating safely
  const getProductRating = (product: Product): number => {
    if (typeof product.rating === "object" && product.rating !== null) {
      return (product.rating as any).average || 0;
    }
    return (product.rating as number) || 0;
  };

  // ✨ FIXED: Get total raters safely
  const getTotalRaters = (product: Product): number => {
    if (typeof product.rating === "object" && product.rating !== null) {
      return (product.rating as any).totalRaters || 0;
    }
    return 0;
  };

  const FavoriteCard = ({ item }: { item: FavoriteItem }) => {
    const product = item.productId;
    const productRating = getProductRating(product);
    const totalRaters = getTotalRaters(product);

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => handleProductPress(product)}>
        {/* Fixed Image Component using the same logic as Products.tsx */}
        <ProductImage product={product} />

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFromFavorites(item._id)}>
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>

        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteCategory}>
            {product.category || "Hair"}
          </Text>

          <View style={styles.favoriteTitleRow}>
            <Text style={styles.favoriteTitle} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.favoritePrice}>₱{product.price}</Text>
          </View>

          <View style={styles.favoriteActionsRow}>
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => handleAddToCart(product)}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>

            <View style={styles.favoriteRating}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={
                    index < Math.round(productRating) ? "star" : "star-outline"
                  }
                  size={14}
                  color="#FFD700"
                  style={{ marginRight: 4 }}
                />
              ))}
              <Text style={styles.ratingText}>({totalRaters})</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
          <Feather name="heart" size={80} color="#6B7280" />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtext}>
            Please log in to view your favorites
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/(auth)")}>
            <Text style={styles.loginBtnText}>Log In</Text>
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
        <Text style={styles.pageTitle}>My Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.itemCount}>{favorites.length} items</Text>
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
        }>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#619AE4"
            style={styles.loader}
          />
        ) : favorites.length > 0 ? (
          <View style={styles.content}>
            {favorites.map((item) => (
              <FavoriteCard key={item._id} item={item} />
            ))}

            <View style={{ height: 40 }} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="heart" size={80} color="#6B7280" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding products to your favorites
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/(tabs)/products")}>
              <Text style={styles.shopBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal
        visible={productDetailVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setProductDetailVisible(false)}>
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity
              onPress={() => setProductDetailVisible(false)}
              style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Product Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.detailScroll}>
            {selectedProduct && (
              <>
                <View style={styles.detailImageContainer}>
                  <Image
                    source={getProductImageSource(selectedProduct)}
                    style={styles.detailImage}
                    resizeMode="cover"
                    defaultSource={images.mask}
                    onError={() =>
                      console.log(
                        `Failed to load detail image for ${selectedProduct.name}`
                      )
                    }
                  />
                </View>

                <View style={styles.detailContent}>
                  <Text style={styles.detailProductName}>
                    {selectedProduct.name}
                  </Text>

                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPrice}>
                      ₱{selectedProduct.price}
                    </Text>
                    <View style={styles.detailRating}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Ionicons
                          key={index}
                          name={
                            index <
                            Math.round(getProductRating(selectedProduct))
                              ? "star"
                              : "star-outline"
                          }
                          size={16}
                          color="#FFD700"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                      <Text style={styles.detailRatingText}>
                        ({getTotalRaters(selectedProduct)})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Description:</Text>
                    <Text style={styles.detailSectionText}>
                      {selectedProduct.description ||
                        "A revolutionary hair treatment infused with keratin protein and nutrient-rich argan oil to reduce damage, tame frizz, and restore shine. Ideal for brittle, heat-styled, or chemically processed hair, this formula rebuilds strength, enhances elasticity, and provides long-lasting nourishment, leaving your hair gorgeously smooth and manageable."}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>How to Use:</Text>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>
                        Apply a small amount to towel-dried or dry hair,
                        focusing on mid-lengths and ends.
                      </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>
                        Style as usual for smoother, frizz-free results.
                      </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>
                        Use 2-3 times weekly for intensive repair, or as needed.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.detailFavoriteBtn}
                      onPress={() => handleAddToFavorites(selectedProduct)}>
                      <Ionicons name="heart" size={24} color="#0348D3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailCartBtn}
                      onPress={() => handleAddToCart(selectedProduct)}>
                      <Text style={styles.detailCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  menuItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
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
    paddingVertical: 16,
  },
  pageTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  itemCount: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  content: { padding: 12 },
  favoriteCard: {
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  favoriteImage: {
    width: "100%",
    height: 216,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  removeBtn: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteInfo: {
    padding: 12,
    backgroundColor: "#123A8A",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  favoriteCategory: {
    color: "#FFB7D3",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginBottom: 6,
    fontWeight: "700",
  },
  favoriteTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoriteTitle: {
    color: "white",
    fontFamily: "Urbanist",
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  favoritePrice: {
    color: "#E6F4FF",
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  favoriteActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  addToCartBtn: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addToCartText: { color: "white", fontWeight: "700" },
  favoriteRating: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { color: "#DDE6FF", fontSize: 12, fontFamily: "Urbanist" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    textAlign: "center",
    marginBottom: 32,
  },
  shopBtn: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
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
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  loader: { marginTop: 50 },
  // Product Detail Modal Styles
  detailContainer: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  detailHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailScroll: {
    flex: 1,
  },
  detailImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#FFE5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  detailImage: {
    width: "100%",
    height: "100%",
  },
  detailContent: {
    padding: 20,
  },
  detailProductName: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  detailPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  detailPrice: {
    color: "#619AE4",
    fontSize: 28,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailRatingText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    marginLeft: 4,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 12,
  },
  detailSectionText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 8,
  },
  bullet: {
    color: "#619AE4",
    fontSize: 16,
    marginRight: 8,
    fontWeight: "700",
  },
  bulletText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 22,
    flex: 1,
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  detailFavoriteBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#76C4FF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  detailCartBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "#619AE4",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  detailCartText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
});
