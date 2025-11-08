import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getLikedItemsByCategory,
  removeLikedItem,
  type LikedItem,
} from "@/utils/likedItemsStorage";

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function WardrobeScreen() {
  const [topItems, setTopItems] = useState<LikedItem[]>([]);
  const [bottomItems, setBottomItems] = useState<LikedItem[]>([]);
  const [shoesItems, setShoesItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTop, setSelectedTop] = useState<LikedItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<LikedItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<LikedItem | null>(null);
  const [sendingTryOn, setSendingTryOn] = useState(false);

  const loadLikedItems = async () => {
    try {
      setLoading(true);
      const [tops, bottoms, shoes] = await Promise.all([
        getLikedItemsByCategory("Top"),
        getLikedItemsByCategory("Bottom"),
        getLikedItemsByCategory("Shoes"),
      ]);
      setTopItems(tops);
      setBottomItems(bottoms);
      setShoesItems(shoes);
    } catch (error) {
      console.error("Error loading liked items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikedItems();
  }, []);

  // Refresh items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLikedItems();
    }, [])
  );

  const handleRemoveItem = async (item: LikedItem) => {
    try {
      await removeLikedItem(item.ID, item.category);
      await loadLikedItems(); // Reload items
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleOpenProduct = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error opening URL:", err)
    );
  };

  const handleSelectItem = (item: LikedItem) => {
    if (item.category === "Top") {
      setSelectedTop(selectedTop?.ID === item.ID ? null : item);
    } else if (item.category === "Bottom") {
      setSelectedBottom(selectedBottom?.ID === item.ID ? null : item);
    } else if (item.category === "Shoes") {
      setSelectedShoes(selectedShoes?.ID === item.ID ? null : item);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!selectedTop || !selectedBottom || !selectedShoes) {
      return;
    }

    try {
      setSendingTryOn(true);
      const outfit = {
        top: selectedTop,
        bottom: selectedBottom,
        shoes: selectedShoes,
      };

      const response = await fetch(`${API_BASE_URL}/api/virtual-try-on`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(outfit),
      });

      if (!response.ok) {
        throw new Error(`Failed to send try-on request: ${response.status}`);
      }

      const data = await response.json();
      console.log("Virtual try-on response:", data);
      
      // You can handle the response here (e.g., show success message, navigate to try-on screen)
      alert("Virtual try-on request sent successfully!");
    } catch (error) {
      console.error("Error sending virtual try-on:", error);
      alert("Failed to send virtual try-on request. Please try again.");
    } finally {
      setSendingTryOn(false);
    }
  };

  const renderHorizontalItem = ({ item }: { item: LikedItem }) => {
    const isSelected =
      (item.category === "Top" && selectedTop?.ID === item.ID) ||
      (item.category === "Bottom" && selectedBottom?.ID === item.ID) ||
      (item.category === "Shoes" && selectedShoes?.ID === item.ID);

    return (
      <View
        style={[
          styles.horizontalItemCard,
          isSelected && styles.selectedItemCard,
        ]}
      >
        <TouchableOpacity
          onPress={() => handleSelectItem(item)}
          activeOpacity={0.8}
          style={styles.selectableArea}
        >
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.horizontalItemImage}
          />
          <View style={styles.horizontalItemInfo}>
            <Text style={styles.horizontalItemName} numberOfLines={1}>
              {item.Description}
            </Text>
            <Text style={styles.horizontalItemPrice}>{item.Price}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.horizontalItemActions}>
          <TouchableOpacity
            style={styles.horizontalViewButton}
            onPress={() => handleOpenProduct(item.ProductURL)}
          >
            <Text style={styles.horizontalButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.horizontalRemoveButton}
            onPress={() => handleRemoveItem(item)}
          >
            <Text style={styles.horizontalButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const hasAnyItems = topItems.length > 0 || bottomItems.length > 0 || shoesItems.length > 0;
  const canTryOn = selectedTop && selectedBottom && selectedShoes;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wardrobe</Text>
        <Text style={styles.subtitle}>Select one item from each category</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : !hasAnyItems ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No liked items yet</Text>
          <Text style={styles.emptySubtext}>
            Swipe right on items you like to save them here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tops Row */}
          {topItems.length > 0 && (
            <View style={styles.rowContainer}>
              <Text style={styles.rowTitle}>Tops</Text>
              <FlatList
                data={topItems}
                renderItem={renderHorizontalItem}
                keyExtractor={(item) => `top-${item.ID}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            </View>
          )}

          {/* Bottoms Row */}
          {bottomItems.length > 0 && (
            <View style={styles.rowContainer}>
              <Text style={styles.rowTitle}>Bottoms</Text>
              <FlatList
                data={bottomItems}
                renderItem={renderHorizontalItem}
                keyExtractor={(item) => `bottom-${item.ID}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            </View>
          )}

          {/* Shoes Row */}
          {shoesItems.length > 0 && (
            <View style={styles.rowContainer}>
              <Text style={styles.rowTitle}>Shoes</Text>
              <FlatList
                data={shoesItems}
                renderItem={renderHorizontalItem}
                keyExtractor={(item) => `shoes-${item.ID}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            </View>
          )}

          {/* Virtual Try-On Button */}
          {canTryOn && (
            <View style={styles.tryOnContainer}>
              <TouchableOpacity
                style={styles.tryOnButton}
                onPress={handleVirtualTryOn}
                disabled={sendingTryOn}
              >
                {sendingTryOn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.tryOnButtonText}>Virtual Try-On</Text>
                    <Text style={styles.tryOnButtonSubtext}>
                      Try on your selected outfit
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 3,
  },
  rowContainer: {
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  horizontalListContent: {
    paddingHorizontal: 10,
  },
  horizontalItemCard: {
    width: 110,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 5,
  },
  selectableArea: {
    flex: 1,
  },
  horizontalItemImage: {
    width: "100%",
    height: 110,
    backgroundColor: "#3a3a3a",
  },
  horizontalItemInfo: {
    padding: 6,
  },
  horizontalItemName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 3,
  },
  horizontalItemPrice: {
    fontSize: 11,
    color: "#FF6B35",
    fontWeight: "600",
    marginBottom: 4,
  },
  horizontalItemActions: {
    flexDirection: "row",
    gap: 3,
  },
  horizontalViewButton: {
    flex: 1,
    backgroundColor: "#FF6B35",
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: "center",
  },
  horizontalRemoveButton: {
    flex: 1,
    backgroundColor: "#3a3a3a",
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: "center",
  },
  horizontalButtonText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  selectedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tryOnContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  tryOnButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tryOnButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tryOnButtonSubtext: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
  },
});
