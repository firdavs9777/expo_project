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
import { useAuth } from "@/contexts/AuthContext";
import { type LikedItem } from "@/utils/likedItemsStorage";

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function WardrobeScreen() {
  const { user } = useAuth();
  const [topItems, setTopItems] = useState<LikedItem[]>([]);
  const [bottomItems, setBottomItems] = useState<LikedItem[]>([]);
  const [shoesItems, setShoesItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTop, setSelectedTop] = useState<LikedItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<LikedItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<LikedItem | null>(null);
  const [sendingTryOn, setSendingTryOn] = useState(false);

  // Helper function to determine category from item type
  const getCategoryFromType = (type: string): "Top" | "Bottom" | "Shoes" => {
    const typeLower = type.toLowerCase();
    if (
      typeLower.includes("shirt") ||
      typeLower.includes("t-shirt") ||
      typeLower.includes("top") ||
      typeLower.includes("polo") ||
      typeLower.includes("outwear")
    ) {
      return "Top";
    } else if (
      typeLower.includes("trouser") ||
      typeLower.includes("jean") ||
      typeLower.includes("short") ||
      typeLower.includes("bottom")
    ) {
      return "Bottom";
    } else if (
      typeLower.includes("shoe") ||
      typeLower.includes("sneaker") ||
      typeLower.includes("boot")
    ) {
      return "Shoes";
    }
    // Default to Top if can't determine
    return "Top";
  };

  const loadLikedItems = async () => {
    if (!user?.access_token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/user/outfits/liked`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map API response to LikedItem format
      // The API might return items with different field names, so we normalize them
      const mappedItems: LikedItem[] = data.map((item: any) => {
        // Get item_id from API response (this is the string ID used in the API)
        const itemId = item.item_id || item.ID?.toString() || item.id?.toString() || "";
        
        // Normalize field names - handle both possible API response formats
        const normalizedItem: LikedItem = {
          ID: item.ID || item.id || parseInt(item.item_id) || 0,
          Description: item.Description || item.description || "",
          Price: item.Price || item.price || "",
          imageUrl: item.imageUrl || item.ImageURL || item.image_url || "",
          ColorHEX: item.ColorHEX || item.colorHEX || item.color_hex || "",
          ProductURL: item.ProductURL || item.productURL || item.product_url || "",
          ColorName: item.ColorName || item.colorName || item.color_name || "",
          DetailDescription: item.DetailDescription || item.detailDescription || item.detail_description || "",
          Type: item.Type || item.type || "",
          PersonalColorType: item.PersonalColorType || item.personalColorType || item.personal_color_type || "",
          popularity: item.popularity || 0,
          category: item.category || getCategoryFromType(item.Type || item.type || ""),
          likedAt: item.created_at || item.likedAt || new Date().toISOString(),
          // Store item_id for API calls
          item_id: itemId,
        } as LikedItem & { item_id: string };
        return normalizedItem;
      });

      // Group items by category
      const tops = mappedItems.filter((item) => item.category === "Top");
      const bottoms = mappedItems.filter((item) => item.category === "Bottom");
      const shoes = mappedItems.filter((item) => item.category === "Shoes");

      setTopItems(tops);
      setBottomItems(bottoms);
      setShoesItems(shoes);
    } catch (err) {
      console.error("Error loading liked items:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load liked items"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikedItems();
  }, [user?.access_token]);

  // Refresh items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLikedItems();
    }, [user?.access_token])
  );

  const handleRemoveItem = async (item: LikedItem) => {
    if (!user?.access_token) {
      console.error("Not authenticated");
      return;
    }

    try {
      // Get item_id from item (stored from API response) or fallback to ID
      const itemId = (item as any).item_id || item.ID?.toString() || item.ID;
      
      console.log("Removing item with item_id:", itemId, "Full item:", item);
      
      // Call API to unlike the item using DELETE method with item_id in URL
      const response = await fetch(
        `${API_BASE_URL}/api/user/outfits/like/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Failed to remove item: ${response.status} - ${errorText}`);
      }

      // Reload items after removal
      await loadLikedItems();
    } catch (error) {
      console.error("Error removing item:", error);
      // Still reload to sync state
      await loadLikedItems();
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
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Error loading items</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadLikedItems}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
