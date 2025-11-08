import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;
const ITEMS_PER_PAGE = 10;

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

interface OutfitItem {
  ID: number;
  Description: string;
  Price: string;
  imageUrl: string;
  ColorHEX: string;
  ProductURL: string;
  ColorName: string;
  DetailDescription: string;
  Type: string;
  PersonalColorType: string;
  popularity: number;
}

// Map UI categories to API categories (one at a time)
const CATEGORY_MAP = {
  Top: ["t-shirts", "shirt", "polos", "outwear"],
  Bottom: ["trousers", "jeans", "shorts"],
  Shoes: ["shoes", "sneakers", "boots"],
};

export default function OutfitSwipeDeck() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Get color type from params or use default
  const personalColorType =
    (params.personalColorType as string) || "Deep Autumn";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    "Top" | "Bottom" | "Shoes"
  >("Top");
  const [currentSubCategoryIndex, setCurrentSubCategoryIndex] = useState(0);
  const [allFetchedItems, setAllFetchedItems] = useState<OutfitItem[]>([]);
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  // Prevent concurrent requests
  const isFetchingRef = useRef(false);
  const waitingForItemsRef = useRef(false);
  const retryCountRef = useRef(0);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Fetch items from backend - fetch all items for subcategory, paginate client-side
  const fetchOutfitItems = async (
    category: "Top" | "Bottom" | "Shoes",
    subCategoryIndex: number = 0,
    retry: boolean = false
  ) => {
    // Prevent concurrent requests
    if (isFetchingRef.current && !retry) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const apiCategories = CATEGORY_MAP[category];
      const apiCategory = apiCategories[subCategoryIndex];

      if (!apiCategory) {
        // No more subcategories for this category
        setHasMoreItems(false);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Fetch all items for this subcategory (API doesn't support pagination)
      // URL encode both personalColorType and apiCategory to handle spaces
      const url = `${API_BASE_URL}/api/outfit/season/${encodeURIComponent(
        personalColorType
      )}/category/${encodeURIComponent(apiCategory)}`;

      console.log("Fetching from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Retry logic for 502 errors (Bad Gateway - often transient)
        if (response.status === 502 && retryCountRef.current < 2) {
          retryCountRef.current += 1;
          console.log(`Retrying fetch (attempt ${retryCountRef.current})...`);
          isFetchingRef.current = false;
          // Wait 1 second before retry
          setTimeout(() => {
            fetchOutfitItems(category, subCategoryIndex, true);
          }, 1000);
          return;
        }
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      let data = await response.json();

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error("API returned non-array data:", data);
        throw new Error("Invalid response format from API");
      }

      // Normalize property names (handle both ImageURL and imageUrl)
      data = data.map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl || item.ImageURL || item.imageURL || "",
      }));

      console.log(
        `Fetched ${data.length} items for ${category} (${apiCategory})`
      );

      if (data.length === 0) {
        // This subcategory has no items, try next one
        const nextSubCategoryIndex = subCategoryIndex + 1;
        if (nextSubCategoryIndex < apiCategories.length) {
          setCurrentSubCategoryIndex(nextSubCategoryIndex);
          isFetchingRef.current = false;
          fetchOutfitItems(category, nextSubCategoryIndex, false);
          return;
        } else {
          // No more subcategories
          setHasMoreItems(false);
          setOutfitItems([]);
          setAllFetchedItems([]);
        }
      } else {
        // Store all fetched items and show first batch
        setAllFetchedItems(data);
        const firstBatch = data.slice(0, ITEMS_PER_PAGE);
        setOutfitItems(firstBatch);
        setCurrentIndex(0);
        setCurrentSubCategoryIndex(subCategoryIndex);
        setHasMoreItems(data.length > ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error("Error fetching outfit items:", err);
      setError("Failed to load items. Please try again.");
      setOutfitItems([]);
      setAllFetchedItems([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fetch items when component mounts or category changes
  useEffect(() => {
    // Reset all state when category changes
    setCurrentSubCategoryIndex(0);
    setCurrentIndex(0);
    setHasMoreItems(true);
    setOutfitItems([]);
    setAllFetchedItems([]);
    waitingForItemsRef.current = false;
    retryCountRef.current = 0;
    // Fetch all items for first subcategory
    fetchOutfitItems(selectedCategory, 0, false);
  }, [selectedCategory]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: "left" | "right") => {
    const x = direction === "right" ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  // Load next batch from allFetchedItems when needed
  const loadNextBatch = () => {
    const currentBatchStart = outfitItems.length;
    const nextBatch = allFetchedItems.slice(
      currentBatchStart,
      currentBatchStart + ITEMS_PER_PAGE
    );

    if (nextBatch.length > 0) {
      setOutfitItems((prev) => [...prev, ...nextBatch]);
      const remainingItems =
        allFetchedItems.length - (currentBatchStart + nextBatch.length);
      setHasMoreItems(remainingItems > 0);
      return true;
    }
    return false;
  };

  const onSwipeComplete = async (direction: "left" | "right") => {
    const item = outfitItems[currentIndex];

    if (direction === "right" && item) {
      setLikedItems([...likedItems, item.ID]);

      // Save like to backend using authenticated endpoint
      if (user?.access_token) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/user/outfits/like`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${user.access_token}`,
              },
              body: JSON.stringify({
                item_id: item.ID.toString(),
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.detail || `Failed to like outfit: ${response.status}`
            );
          }

          const likedOutfit = await response.json();
          console.log("Outfit liked successfully:", likedOutfit);
        } catch (error) {
          console.error("Error saving like to backend:", error);
          // Don't throw - allow the like to still work locally
        }
      }
    }

    const nextIndex = currentIndex + 1;

    // Preload next batch when 3 items remaining
    if (
      nextIndex >= outfitItems.length - 3 &&
      hasMoreItems &&
      allFetchedItems.length > outfitItems.length
    ) {
      loadNextBatch();
    }

    // Check if we've reached the end of current items
    if (nextIndex >= outfitItems.length) {
      // Try to load next batch from cached items
      if (allFetchedItems.length > outfitItems.length) {
        const loaded = loadNextBatch();
        if (loaded) {
          // New batch loaded, advance to next index
          position.setValue({ x: 0, y: 0 });
          setCurrentIndex(nextIndex);
          return;
        }
      }

      // No more items in current subcategory, try next one
      if (hasMoreItems) {
        const apiCategories = CATEGORY_MAP[selectedCategory];
        const nextSubCategoryIndex = currentSubCategoryIndex + 1;
        if (nextSubCategoryIndex < apiCategories.length) {
          // Load next subcategory
          setCurrentSubCategoryIndex(nextSubCategoryIndex);
          fetchOutfitItems(selectedCategory, nextSubCategoryIndex, false);
          position.setValue({ x: 0, y: 0 });
          return;
        }
      }

      // No more items available
      waitingForItemsRef.current = false;
      position.setValue({ x: 0, y: 0 });
      return;
    }

    waitingForItemsRef.current = false;
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(nextIndex);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleLike = () => {
    forceSwipe("right");
  };

  const handleNope = () => {
    forceSwipe("left");
  };

  const handleCategoryChange = (category: "Top" | "Bottom" | "Shoes") => {
    if (category === selectedCategory) return; // Prevent unnecessary resets
    setSelectedCategory(category);
    // State reset is handled in useEffect
  };

  // Loading state
  if (loading && outfitItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>
            Loading {selectedCategory} items...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              retryCountRef.current = 0;
              fetchOutfitItems(
                selectedCategory,
                currentSubCategoryIndex,
                false
              );
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = outfitItems[currentIndex];

  // No more items - only show if we've exhausted all items and subcategories
  const apiCategories = CATEGORY_MAP[selectedCategory];
  const hasMoreSubcategories =
    currentSubCategoryIndex + 1 < apiCategories.length;
  const hasMoreCachedItems = allFetchedItems.length > outfitItems.length;

  // Guard: Don't render if currentItem is undefined
  if (!currentItem) {
    // If loading, show loading state
    if (loading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // Check if we should show empty state or wait for more items
    if (!hasMoreCachedItems && !hasMoreSubcategories && !hasMoreItems) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No more items! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              You have reviewed all {selectedCategory} items.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setCurrentIndex(0);
                setLikedItems([]);
                setCurrentSubCategoryIndex(0);
                setAllFetchedItems([]);
                setOutfitItems([]);
                setHasMoreItems(true);
                fetchOutfitItems(selectedCategory, 0, false);
              }}
            >
              <Text style={styles.resetButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // If more items might be available, show loading
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{personalColorType}</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedCategory === "Top" && styles.tabActive]}
          onPress={() => handleCategoryChange("Top")}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategory === "Top" && styles.tabTextActive,
            ]}
          >
            Top
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedCategory === "Bottom" && styles.tabActive,
          ]}
          onPress={() => handleCategoryChange("Bottom")}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategory === "Bottom" && styles.tabTextActive,
            ]}
          >
            Bottom
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedCategory === "Shoes" && styles.tabActive]}
          onPress={() => handleCategoryChange("Shoes")}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategory === "Shoes" && styles.tabTextActive,
            ]}
          >
            Shoes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Like/Nope Labels */}
          <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>

          {/* Item Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentItem.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {currentItem.Description}
            </Text>
            <Text style={styles.itemPrice}>{currentItem.Price}</Text>
            <Text style={styles.itemBrand}>{currentItem.ColorName}</Text>
          </View>

        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleNope}>
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
        >
          <Text style={styles.likeIcon}>❤️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            router.push({
              pathname: "/virtual-try",
              params: {
                outfitId: currentItem.ID,
                outfitImageUrl: currentItem.imageUrl, // Pass the outfit image URL
                outfitName: currentItem.ColorName || "Selected Outfit",
              },
            });
          }}
        >
          <Text style={styles.actionIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {outfitItems.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 30,
    paddingBottom: 15,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 30,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FF6B35",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: width * 0.85,
    height: height * 0.55,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  likeLabel: {
    position: "absolute",
    top: 50,
    right: 40,
    zIndex: 1000,
    borderWidth: 4,
    borderColor: "#4CAF50",
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: "15deg" }],
  },
  likeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  nopeLabel: {
    position: "absolute",
    top: 50,
    left: 40,
    zIndex: 1000,
    borderWidth: 4,
    borderColor: "#FF5252",
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: "-15deg" }],
  },
  nopeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF5252",
  },
  imageContainer: {
    width: "100%",
    height: "70%",
    backgroundColor: "#3a3a3a",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    padding: 20,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 13,
    color: "#999",
  },
  tryOnBadge: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tryOnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 20,
    paddingBottom: 10,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3a3a3a",
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  actionIcon: {
    fontSize: 24,
  },
  likeIcon: {
    fontSize: 32,
  },
  progressContainer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  progressText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
