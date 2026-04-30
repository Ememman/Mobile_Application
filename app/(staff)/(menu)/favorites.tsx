// components/Favorites.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  staffApiClient,
  LearningModule,
  FavoriteLearningModule,
} from "../../lib/staffApiClient";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface FavoritesProps {
  staffId: string;
  onModulePress?: (module: LearningModule) => void;
}

const Favorites: React.FC<FavoritesProps> = ({ staffId, onModulePress }) => {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteLearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setError(null);
      const response = await staffApiClient.getFavoriteModules();

      if (response.success) {
        setFavorites(response.data);
      } else {
        setError(response.message || "Failed to fetch favorites");
      }
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError(err.message || "An error occurred while fetching favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (
    favoriteId: string,
    moduleTitle: string
  ) => {
    Alert.alert(
      "Remove Favorite",
      `Are you sure you want to remove "${moduleTitle}" from favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await staffApiClient.removeFavoriteModule(
                favoriteId
              );
              if (response.success) {
                // Remove from local state
                setFavorites((prev) =>
                  prev.filter((fav) => fav._id !== favoriteId)
                );
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Failed to remove favorite"
                );
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove favorite");
            }
          },
        },
      ]
    );
  };

  const handleModulePress = (module: LearningModule) => {
    if (onModulePress) {
      onModulePress(module);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const calculateProgress = (module: LearningModule) => {
    // If module has userProgress, use that
    if (module.userProgress) {
      return Math.round(module.userProgress.progress);
    }

    // Otherwise calculate based on completion rate or other metrics
    if (module.completionRate !== undefined) {
      return module.completionRate;
    }

    // Default to 0 if no progress data available
    return 0;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10B981"; // green
    if (progress >= 50) return "#3B82F6"; // blue
    return "#6B7280"; // gray
  };

  const getProgressText = (progress: number) => {
    if (progress >= 100) return "Completed";
    if (progress > 0) return `${progress}% Done`;
    return "Not Started";
  };

  useEffect(() => {
    fetchFavorites();
  }, [staffId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header matching Booking.tsx */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#619AE4" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header matching Booking.tsx */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <LinearGradient
              colors={["#619AE4", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching Booking.tsx */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="star-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Favorite Modules</Text>
          <Text style={styles.emptySubtitle}>
            Learning modules you mark as favorite will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#619AE4"
              colors={["#619AE4"]}
            />
          }>
          <View style={styles.modulesList}>
            {favorites.map((favorite) => {
              const module = favorite.itemId;
              const progress = calculateProgress(module);
              const progressColor = getProgressColor(progress);
              const progressText = getProgressText(progress);

              return (
                <TouchableOpacity
                  key={favorite._id}
                  style={styles.moduleCard}
                  onPress={() => handleModulePress(module)}
                  activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleTitle} numberOfLines={2}>
                        {module.title}
                      </Text>
                      <Text style={styles.moduleAuthor}>
                        By {module.instructor?.name || "Unknown Author"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() =>
                        handleRemoveFavorite(favorite._id, module.title)
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="heart" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: progressColor,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.progressText, { color: progressColor }]}>
                      {progressText}
                    </Text>
                  </View>

                  <View style={styles.moduleMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.metaText}>
                        {module.estimatedDuration || module.duration || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons
                        name="layers-outline"
                        size={14}
                        color="#9CA3AF"
                      />
                      <Text style={styles.metaText}>
                        {module.difficulty
                          ? module.difficulty.charAt(0).toUpperCase() +
                            module.difficulty.slice(1)
                          : "All Levels"}
                      </Text>
                    </View>

                    {module.rating && (
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.metaText}>
                          {module.rating.average?.toFixed(1) || "N/A"}
                        </Text>
                      </View>
                    )}
                  </View>

                  {module.category && (
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{module.category}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  header: {
    flexDirection: "row",
    top: 30,
    alignItems: "center",
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
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modulesList: {
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 20,
  },
  moduleCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  moduleInfo: {
    flex: 1,
    marginRight: 8,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 20,
    marginBottom: 4,
  },
  moduleAuthor: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  favoriteButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  moduleMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(97, 154, 228, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: "#619AE4",
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9CA3AF",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 50,
    overflow: "hidden",
    marginTop: 16,
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
});

export default Favorites;
