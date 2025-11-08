import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;

interface OutfitItem {
  id: string;
  name: string;
  price: string;
  image: string;
  brand: string;
  category: "Top" | "Bottom" | "Shoes";
}

const OUTFIT_ITEMS: OutfitItem[] = [
  {
    id: "1",
    name: "Coral Pink Blouse",
    price: "₩52,000",
    image:
      "https://via.placeholder.com/400x600/FF7F7F/FFFFFF?text=Coral+Blouse",
    brand: "Zara",
    category: "Top",
  },
  {
    id: "2",
    name: "Pearl Denim Jacket",
    price: "₩78,000",
    image:
      "https://via.placeholder.com/400x600/87CEEB/FFFFFF?text=Denim+Jacket",
    brand: "H&M",
    category: "Top",
  },
  {
    id: "3",
    name: "Beige Linen Pants",
    price: "₩45,000",
    image: "https://via.placeholder.com/400x600/F5DEB3/000000?text=Linen+Pants",
    brand: "Uniqlo",
    category: "Bottom",
  },
];

export default function OutfitSwipeDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    "Top" | "Bottom" | "Shoes"
  >("Top");

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

  const onSwipeComplete = (direction: "left" | "right") => {
    const item = OUTFIT_ITEMS[currentIndex];

    if (direction === "right") {
      setLikedItems([...likedItems, item.id]);
    }

    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(currentIndex + 1);
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

  const currentItem = OUTFIT_ITEMS[currentIndex];

  if (currentIndex >= OUTFIT_ITEMS.length) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No more items! 🎉</Text>
          <Text style={styles.emptySubtitle}>
            You have reviewed all available items.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setCurrentIndex(0);
              setLikedItems([]);
            }}
          >
            <Text style={styles.resetButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spring Warm</Text>
        <Text style={styles.headerSubtitle}>For You</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedCategory === "Top" && styles.tabActive]}
          onPress={() => setSelectedCategory("Top")}
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
          onPress={() => setSelectedCategory("Bottom")}
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
          onPress={() => setSelectedCategory("Shoes")}
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
              source={{ uri: currentItem.image }}
              style={styles.itemImage}
            />
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{currentItem.name}</Text>
            <Text style={styles.itemPrice}>{currentItem.price}</Text>
            <Text style={styles.itemBrand}>{currentItem.brand}</Text>
          </View>

          {/* Virtual Try-On Badge */}
          <View style={styles.tryOnBadge}>
            <Text style={styles.tryOnText}>👁️ Virtual Try-On</Text>
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

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
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
    fontSize: 18,
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
    fontSize: 14,
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
  bottomNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: "#999",
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
