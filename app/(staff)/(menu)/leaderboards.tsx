// app/(staff)/(menu)/leaderboards.tsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { staffApiClient, LeaderboardEntry } from "../../lib/staffApiClient";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const LeaderboardsScreen = () => {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<
    "overall" | "monthly" | "weekly"
  >("overall");
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  // Calculate tab width based on container
  const tabContainerWidth = width - 32;
  const tabWidth = tabContainerWidth / 3;

  // Enhanced load function with point tracking
  const loadLeaderboard = useCallback(async () => {
    try {
      setError(null);
      console.log("🏆 Loading leaderboard data with point tracking...");

      const response = await staffApiClient.getLeaderboard(leaderboardType, 50);

      if (response.success && response.data) {
        console.log("✅ Leaderboard data loaded successfully");

        let leaderboardEntries: LeaderboardEntry[] = [];

        // Handle different response formats safely
        if (Array.isArray(response.data)) {
          leaderboardEntries = response.data;
        } else if (response.data && typeof response.data === "object") {
          const data = response.data as any;
          if (data.leaderboard && Array.isArray(data.leaderboard)) {
            leaderboardEntries = data.leaderboard;
          } else if (Array.isArray(data)) {
            leaderboardEntries = data;
          } else {
            leaderboardEntries = [];
          }
        } else {
          leaderboardEntries = [];
        }

        setLeaderboardData(leaderboardEntries);

        // Get current user ID and find position
        const currentUser = await staffApiClient.getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          const userEntry = leaderboardEntries.find(
            (entry: LeaderboardEntry) => entry.userId._id === currentUser.id
          );
          setUserPosition(userEntry || null);

          // Log point breakdown for current user
          if (userEntry) {
            console.log("📊 Current User Points Breakdown:", {
              totalPoints: userEntry.totalPoints,
              monthlyPoints: userEntry.monthlyPoints,
              weeklyPoints: userEntry.weeklyPoints,
              servicesCompleted: userEntry.servicesCompleted,
              customerRatings: userEntry.customerRatings,
              learningModules: userEntry.learningModulesCompleted,
              attendanceScore: userEntry.attendanceScore,
              salesPerformance: userEntry.salesPerformance,
              quizPoints: userEntry.quizPoints,
              quizzesCompleted: userEntry.quizzesCompleted,
            });
          }
        } else {
          setCurrentUserId(null);
          setUserPosition(null);
        }
      } else {
        console.error("❌ Invalid response data:", response.data);
        setLeaderboardData([]);
        setError("Failed to load leaderboard data");
      }
    } catch (error) {
      console.error("❌ Error loading leaderboard:", error);
      setLeaderboardData([]);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leaderboardType]);

  const loadData = useCallback(async () => {
    await loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    loadData();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadData, fadeAnim, slideAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleTabChange = (type: "overall" | "monthly" | "weekly") => {
    if (leaderboardType === type) return;

    const targetPosition = type === "overall" ? 0 : type === "monthly" ? 1 : 2;

    Animated.parallel([
      Animated.spring(tabIndicatorPosition, {
        toValue: targetPosition * tabWidth,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLeaderboardType(type);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Fixed useEffect dependency
  useEffect(() => {
    const position =
      leaderboardType === "overall" ? 0 : leaderboardType === "monthly" ? 1 : 2;

    Animated.spring(tabIndicatorPosition, {
      toValue: position * tabWidth,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [leaderboardType, tabWidth, tabIndicatorPosition]);

  const getPoints = (item: LeaderboardEntry): number => {
    switch (leaderboardType) {
      case "monthly":
        return item.monthlyPoints || 0;
      case "weekly":
        return item.weeklyPoints || 0;
      default:
        return item.totalPoints || 0;
    }
  };

  // ==================== POINT BREAKDOWN HELPER ====================

  const getPointBreakdown = (item: LeaderboardEntry) => {
    // Calculate approximate breakdown based on available data
    const breakdown = {
      services: Math.floor((item.servicesCompleted?.total || 0) * 5),
      learning: Math.floor((item.learningModulesCompleted?.total || 0) * 10),
      quizzes: Math.floor((item.quizzesCompleted?.total || 0) * 8),
      attendance: Math.floor((item.attendanceScore || 0) * 2),
      sales: Math.floor(
        ((item.salesPerformance?.totalRevenue || 0) / 1000) * 10
      ),
      ratings: Math.floor((item.customerRatings?.average || 0) * 20),
    };

    return breakdown;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
        },
      ]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.tabContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  width: tabWidth - 8,
                  transform: [{ translateX: tabIndicatorPosition }],
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabChange("overall")}>
              <Text
                style={[
                  styles.tabText,
                  leaderboardType === "overall" && styles.tabTextActive,
                ]}>
                Overall
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabChange("monthly")}>
              <Text
                style={[
                  styles.tabText,
                  leaderboardType === "monthly" && styles.tabTextActive,
                ]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabChange("weekly")}>
              <Text
                style={[
                  styles.tabText,
                  leaderboardType === "weekly" && styles.tabTextActive,
                ]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const isCurrentUser = currentUserId && item.userId._id === currentUserId;
    const breakdown = getPointBreakdown(item);

    const shouldShowSeparator = index === 3;

    if (shouldShowSeparator) {
      return (
        <Animated.View
          style={[
            styles.separatorContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Top Performers</Text>
          <View style={styles.separatorLine} />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [index % 2 === 0 ? -50 : 50, 0],
                }),
              },
            ],
          },
        ]}>
        {/* Rank Number */}
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userMainInfo}>
            {item.userId.profileImage ? (
              <Image
                source={{ uri: item.userId.profileImage }}
                style={styles.profileImage}
                defaultSource={require("../../../assets/images/profile.png")}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>
                  {item.userId.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.userTextInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userId.username}
                {isCurrentUser && " (You)"}
              </Text>
              <Text style={styles.userPosition}>{item.userId.position}</Text>

              {/* Enhanced Point Breakdown for Current User */}
              {isCurrentUser && (
                <View style={styles.pointBreakdown}>
                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, styles.serviceDot]} />
                    <Text style={styles.breakdownText}>
                      Services: +{breakdown.services}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, styles.learningDot]} />
                    <Text style={styles.breakdownText}>
                      Learning: +{breakdown.learning}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, styles.quizDot]} />
                    <Text style={styles.breakdownText}>
                      Quizzes: +{breakdown.quizzes}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, styles.attendanceDot]} />
                    <Text style={styles.breakdownText}>
                      Attendance: +{breakdown.attendance}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <View style={styles.pointsDot} />
          <Text style={styles.pointsText}>
            {getPoints(item).toLocaleString()} pts
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderUserRankCard = () => {
    if (!userPosition) return null;

    const points = getPoints(userPosition);
    const userRank = leaderboardData.findIndex(
      (entry) => entry.userId._id === userPosition.userId._id
    );

    if (userRank === -1) return null;

    const breakdown = getPointBreakdown(userPosition);

    return (
      <Animated.View
        style={[
          styles.userRankCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.userRankHeader}>
          <Text style={styles.userRankTitle}>Your Position</Text>
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={16} color="#FFFFFF" />
            <Text style={styles.rankBadgeText}>Rank #{userRank + 1}</Text>
          </View>
        </View>

        <View style={styles.userRankContent}>
          <View style={styles.userRankInfo}>
            {userPosition.userId.profileImage ? (
              <Image
                source={{ uri: userPosition.userId.profileImage }}
                style={styles.userRankImage}
                defaultSource={require("../../../assets/images/profile.png")}
              />
            ) : (
              <View style={styles.userRankImagePlaceholder}>
                <Text style={styles.userRankInitial}>
                  {userPosition.userId.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.userRankName}>
                {userPosition.userId.username}
              </Text>
              <Text style={styles.userRankPosition}>
                {userPosition.userId.position}
              </Text>
            </View>
          </View>
          <View style={styles.userRankPoints}>
            <View style={styles.pointsDot} />
            <Text style={styles.userRankPointsText}>
              {points.toLocaleString()} pts
            </Text>
          </View>
        </View>

        {/* Enhanced Point Breakdown */}
        <View style={styles.enhancedBreakdown}>
          <Text style={styles.breakdownTitle}>Points Breakdown</Text>
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, styles.serviceIcon]}>
                <Ionicons name="cut" size={16} color="#10B981" />
              </View>
              <Text style={styles.breakdownLabel}>Services</Text>
              <Text style={styles.breakdownValue}>+{breakdown.services}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, styles.learningIcon]}>
                <Ionicons name="school" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.breakdownLabel}>Learning</Text>
              <Text style={styles.breakdownValue}>+{breakdown.learning}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, styles.quizIcon]}>
                <Ionicons name="help-circle" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.breakdownLabel}>Quizzes</Text>
              <Text style={styles.breakdownValue}>+{breakdown.quizzes}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, styles.attendanceIcon]}>
                <Ionicons name="time" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.breakdownLabel}>Attendance</Text>
              <Text style={styles.breakdownValue}>+{breakdown.attendance}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={64} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <LinearGradient
          colors={["#619AE4", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.retryButtonGradient}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color="#666666" />
      <Text style={styles.emptyText}>No leaderboard data available</Text>
      <Text style={styles.emptySubtext}>
        {leaderboardType === "overall"
          ? "Overall rankings will appear here"
          : `${leaderboardType} rankings will appear here`}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadData}>
        <LinearGradient
          colors={["#619AE4", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.retryButtonGradient}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Leaderboards</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#619AE4" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />

      {renderHeader()}

      {error ? (
        renderError()
      ) : (
        <FlatList
          data={leaderboardData}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#619AE4"
              colors={["#619AE4"]}
            />
          }
          ListHeaderComponent={renderUserRankCard()}
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={[
            styles.listContent,
            leaderboardData.length === 0 && styles.emptyListContent,
          ]}
        />
      )}

      {/* Enhanced Time Display */}
      <View style={styles.timeContainer}>
        <Ionicons name="time-outline" size={12} color="#FFFFFF" />
        <Text style={styles.timeText}>{getCurrentTime()}</Text>
      </View>
    </SafeAreaView>
  );
};

// ... (styles remain the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  header: {
    top: 30,
    backgroundColor: "#0A0E17",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    marginBottom: 8,
  },
  tabsWrapper: {
    marginHorizontal: 0,
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
    backgroundColor: "#619AE4",
    borderRadius: 100,
  },
  tab: {
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
  listContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  currentUserItem: {
    backgroundColor: "rgba(97, 154, 228, 0.2)",
    borderColor: "#619AE4",
    borderWidth: 1,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userMainInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#619AE4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userPosition: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#619AE4",
    marginRight: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  separatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
    marginHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userRankCard: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#619AE4",
  },
  userRankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userRankTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  rankBadge: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  userRankContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userRankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userRankImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userRankImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#619AE4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userRankInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  userRankName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userRankPosition: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  userRankPoints: {
    flexDirection: "row",
    alignItems: "center",
  },
  userRankPointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  timeContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0E17",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 50,
    overflow: "hidden",
  },
  retryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // ==================== NEW STYLES FOR POINT BREAKDOWN ====================
  pointBreakdown: {
    marginTop: 8,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serviceDot: {
    backgroundColor: "#10B981",
  },
  learningDot: {
    backgroundColor: "#3B82F6",
  },
  quizDot: {
    backgroundColor: "#8B5CF6",
  },
  attendanceDot: {
    backgroundColor: "#F59E0B",
  },
  breakdownText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: "Urbanist",
  },
  enhancedBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    fontFamily: "Urbanist",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    gap: 6,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceIcon: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  learningIcon: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  quizIcon: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  attendanceIcon: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Urbanist",
    textAlign: "center",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Urbanist",
  },
});

export default LeaderboardsScreen;
