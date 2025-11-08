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
      console.log("Skipping fetch - already fetching");
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
        // This subcategory has no items - don't auto-fetch next one
        // Just show empty state, user can change category manually
        setHasMoreItems(false);
        setOutfitItems([]);
        setAllFetchedItems([]);
        setCurrentSubCategoryIndex(subCategoryIndex);
        setCurrentIndex(0);
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
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop any ongoing animations when starting a new gesture
        position.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        // Log gesture values for debugging
        console.log("Gesture release:", {
          dx: gesture.dx,
          vx: gesture.vx,
          threshold: SWIPE_THRESHOLD,
        });
        
        // Determine swipe direction based on distance and velocity
        // Use distance as primary, velocity as secondary
        const swipeRight = gesture.dx > SWIPE_THRESHOLD || (gesture.dx > 50 && gesture.vx > 0.3);
        const swipeLeft = gesture.dx < -SWIPE_THRESHOLD || (gesture.dx < -50 && gesture.vx < -0.3);
        
        if (swipeRight) {
          // Swipe right (like)
          console.log("Swipe right detected");
          forceSwipe("right");
        } else if (swipeLeft) {
          // Swipe left (dislike)
          console.log("Swipe left detected");
          forceSwipe("left");
        } else {
          // Not enough movement, reset to center
          console.log("Insufficient swipe, resetting");
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        // Reset position if gesture is interrupted
        resetPosition();
      },
    })
  ).current;

  const forceSwipe = (direction: "left" | "right") => {
    const item = outfitItems[currentIndex];
    if (!item) return; // Don't swipe if no item
    
    const x = direction === "right" ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onSwipeComplete(direction);
    });
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

    // Handle like (swipe right)
    if (direction === "right" && item) {
      setLikedItems([...likedItems, item.ID]);

      // Save like to backend using authenticated endpoint (don't await - do in background)
      if (user?.access_token) {
        fetch(
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
        )
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.detail || `Failed to like outfit: ${response.status}`;
              
              // Handle "already liked" case gracefully - don't treat it as an error
              if (errorMessage.includes("already liked") || errorMessage.includes("Already liked")) {
                console.log("Outfit already liked:", item.ID);
                return;
              }
              
              // For other errors, log but don't throw to avoid breaking the UI
              console.warn("Error saving like to backend:", errorMessage);
              return;
            }
            const likedOutfit = await response.json();
            console.log("Outfit liked successfully:", likedOutfit);
          })
          .catch((error) => {
            // Only log unexpected errors, don't break the UI
            console.warn("Error saving like to backend:", error.message || error);
          });
      }
    }

    // Handle dislike (swipe left) - just log for now, no API call needed
    if (direction === "left" && item) {
      console.log("Outfit disliked:", item.ID);
    }

    const nextIndex = currentIndex + 1;
    waitingForItemsRef.current = false;

    // Check if we have more items in the current list
    if (nextIndex < outfitItems.length) {
      // Reset position for the next card BEFORE updating index
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(nextIndex);
      
      // Preload next batch when 3 items remaining (background load, don't block)
      if (
        nextIndex >= outfitItems.length - 3 &&
        hasMoreItems &&
        allFetchedItems.length > outfitItems.length
      ) {
        loadNextBatch();
      }
      return;
    }

    // We've reached the end of current items
    // First, try to load from cached items (already fetched but not shown)
    if (allFetchedItems.length > outfitItems.length) {
      const loaded = loadNextBatch();
      if (loaded) {
        // New batch loaded, reset position and advance to next index
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(nextIndex);
        return;
      }
    }

    // No more cached items, try to fetch next subcategory
    const apiCategories = CATEGORY_MAP[selectedCategory];
    const hasMoreSubcategories = currentSubCategoryIndex + 1 < apiCategories.length;
    
    if (hasMoreSubcategories && hasMoreItems) {
      // Automatically fetch next subcategory
      const nextSubCategoryIndex = currentSubCategoryIndex + 1;
      setCurrentSubCategoryIndex(nextSubCategoryIndex);
      fetchOutfitItems(selectedCategory, nextSubCategoryIndex, false);
      // Reset position and wait for new items
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(0);
      return;
    }

    // No more items available in current subcategory
    // Reset position and show empty state
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
    if (outfitItems[currentIndex]) {
      forceSwipe("right");
    }
  };

  const handleNope = () => {
    if (outfitItems[currentIndex]) {
      forceSwipe("left");
    }
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
          <ActivityIndicator size="large" color="#000000" />
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
            <ActivityIndicator size="large" color="#000000" />
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
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
      <Text style={styles.headerTitle}>{personalColorType}</Text>
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
          key={`card-${currentItem.ID}-${currentIndex}`}
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

          {/* Item Info Overlay */}
          <View style={styles.itemInfoOverlay}>
            <Text style={styles.itemName} numberOfLines={2}>
              {currentItem.Description}
            </Text>
            <View style={styles.itemInfoRow}>
              <Text style={styles.itemBrand}>{currentItem.ColorName || ""}</Text>
              <Text style={styles.itemPrice}>{currentItem.Price}</Text>
            </View>
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
          <Text style={styles.likeIcon}>♡</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            router.push({
              pathname: "/virtual-try",
              params: {
                outfitId: currentItem.ID,
                outfitImageUrl: currentItem.imageUrl,
                outfitName: currentItem.ColorName || "Selected Outfit",
              },
            });
          }}
        >
          <Text style={styles.hangerIcon}>⌗</Text>
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#000000",
  },
  tabText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: width * 0.85,
    height: height * 0.5,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  likeLabel: {
    position: "absolute",
    top: 50,
    right: 40,
    zIndex: 1000,
    borderWidth: 4,
    borderColor: "#000000",
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: "15deg" }],
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  likeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  nopeLabel: {
    position: "absolute",
    top: 50,
    left: 40,
    zIndex: 1000,
    borderWidth: 4,
    borderColor: "#000000",
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: "-15deg" }],
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  nopeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  imageContainer: {
    width: "100%",
    height: "75%",
    backgroundColor: "#f5f5f5",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  itemInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemPrice: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
  },
  itemBrand: {
    fontSize: 14,
    color: "#666666",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 24,
    paddingBottom: 16,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  actionIcon: {
    fontSize: 24,
    color: "#000000",
  },
  likeIcon: {
    fontSize: 28,
    color: "#ffffff",
  },
  hangerIcon: {
    fontSize: 24,
    color: "#000000",
  },
  progressContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  progressText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#000000",
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
    color: "#000000",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
    color: "#000000",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
