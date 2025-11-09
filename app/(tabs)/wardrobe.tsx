import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function WardrobeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [topItems, setTopItems] = useState<LikedItem[]>([]);
  const [bottomItems, setBottomItems] = useState<LikedItem[]>([]);
  const [shoesItems, setShoesItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTop, setSelectedTop] = useState<LikedItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<LikedItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<LikedItem | null>(null);
  const [sendingTryOn, setSendingTryOn] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

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

  // Request camera/gallery permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant camera roll permissions to upload photos."
      );
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async (): Promise<string | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  // Take photo with camera
  const takePhoto = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant camera permissions to take photos."
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  // Show photo selection options
  const selectPhotoOption = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert("Upload Your Photo", "Choose an option", [
        {
          text: "Take Photo",
          onPress: async () => {
            const uri = await takePhoto();
            resolve(uri);
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const uri = await pickImage();
            resolve(uri);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(null),
        },
      ]);
    });
  };

  // Convert image URL to base64 data URI
  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      // Download the image first
      const imageUri = `${FileSystem.cacheDirectory}outfit_image_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, imageUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }
      
      // Read as base64
      const imageBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'base64' as any,
      });
      
      if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length === 0) {
        throw new Error("Image base64 conversion returned empty or invalid result");
      }
      
      // Determine image format from URL
      const imageFormat = imageUrl.toLowerCase().includes('.png') ? 'png' : 'jpeg';
      return `data:image/${imageFormat};base64,${imageBase64}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Convert user photo to base64
  const convertUserPhotoToBase64 = async (photoUri: string): Promise<string> => {
    try {
      const userImageBase64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64' as any,
      });
      
      if (!userImageBase64 || typeof userImageBase64 !== 'string' || userImageBase64.length === 0) {
        throw new Error("User image base64 conversion returned empty or invalid result");
      }
      
      // Determine image format from URI
      const userImageFormat = photoUri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
      return `data:image/${userImageFormat};base64,${userImageBase64}`;
    } catch (error) {
      console.error("Error converting user photo to base64:", error);
      throw new Error(`Failed to convert user photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!selectedTop || !selectedBottom || !selectedShoes) {
      Alert.alert("Selection Required", "Please select one item from each category.");
      return;
    }

    try {
      setSendingTryOn(true);
      setGenerationProgress(0);

      // First, get user photo
      const userPhotoUri = await selectPhotoOption();
      if (!userPhotoUri) {
        setSendingTryOn(false);
        setGenerationProgress(0);
        return; // User cancelled
      }

      setGenerationProgress(10); // Photo selected

      // Convert all images to base64
      console.log("Converting images to base64...");
      setGenerationProgress(20); // Starting conversion
      
      const [userImage, upperImage, lowerImage, shoesImage] = await Promise.all([
        convertUserPhotoToBase64(userPhotoUri).then((img) => {
          setGenerationProgress(40); // User image converted
          return img;
        }),
        convertImageToBase64(selectedTop.imageUrl).then((img) => {
          setGenerationProgress(50); // Top image converted
          return img;
        }),
        convertImageToBase64(selectedBottom.imageUrl).then((img) => {
          setGenerationProgress(60); // Bottom image converted
          return img;
        }),
        convertImageToBase64(selectedShoes.imageUrl).then((img) => {
          setGenerationProgress(70); // Shoes image converted
          return img;
        }),
      ]);

      setGenerationProgress(80); // All images converted, sending request
      console.log("Sending full outfit try-on request...");
      const response = await fetch(
        `${API_BASE_URL}/api/try-on/generate-full-outfit/on-sequential`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_image: userImage,
            upper_image: upperImage,
            lower_image: lowerImage,
            shoes_image: shoesImage,
          }),
        }
      );

      setGenerationProgress(90); // Request sent, processing

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Failed to generate try-on: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      let resultImage: string;

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        console.log("=== Full Outfit API Response ===");
        console.log("Response keys:", Object.keys(data));
        console.log("Full response:", JSON.stringify(data, null, 2));
        
        // Try multiple possible field names for the result image
        resultImage = data.try_on_full_outfit_on_sequential_image || data.try_on_full_outfit_image || data.try_on_image || data.image || data.result_image || data.result || data.data;
        
        if (!resultImage) {
          console.error("No image field found in response. Available keys:", Object.keys(data));
          throw new Error("API response does not contain image data. Available fields: " + Object.keys(data).join(", "));
        }
        
        // Ensure resultImage is a valid data URI
        if (!resultImage.startsWith("data:")) {
          resultImage = `data:image/png;base64,${resultImage}`;
        }
      } else {
        // Handle image/blob response - read as base64
        const responseText = await response.text();
        if (responseText && responseText.length > 0) {
          // If it's already a data URI, use it directly
          if (responseText.startsWith("data:")) {
            resultImage = responseText;
          } else {
            // Otherwise, assume it's base64 and add the prefix
            resultImage = `data:image/png;base64,${responseText}`;
          }
        } else {
          throw new Error("Empty response from API");
        }
      }

      setGenerationProgress(100); // Outfit ready!
      
      // Small delay to show 100% before navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to result screen
      router.push({
        pathname: "/virtual-try-result",
        params: {
          resultImageUri: resultImage,
          outfitImageUrl: selectedTop.imageUrl,
          outfitName: `${selectedTop.Description} + ${selectedBottom.Description} + ${selectedShoes.Description}`,
          outfitPrice: `${selectedTop.Price} + ${selectedBottom.Price} + ${selectedShoes.Price}`,
          outfitColor: "Full Outfit",
          outfitId: `${selectedTop.ID}-${selectedBottom.ID}-${selectedShoes.ID}`,
        },
      });
    } catch (error) {
      console.error("Error sending virtual try-on:", error);
      setGenerationProgress(0);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to process virtual try-on. Please try again."
      );
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
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const hasAnyItems = topItems.length > 0 || bottomItems.length > 0 || shoesItems.length > 0;
  const canTryOn = selectedTop && selectedBottom && selectedShoes;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
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
              <Text style={styles.rowTitle}>Tops I Liked</Text>
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
              <Text style={styles.rowTitle}>Bottoms I Liked</Text>
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
              <Text style={styles.rowTitle}>Shoes I Liked</Text>
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

          {/* Virtual Try-On Progress Bar */}
          {canTryOn && (
            <View style={styles.tryOnContainer}>
              {sendingTryOn ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${generationProgress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {generationProgress === 100 
                      ? "Outfit almost Ready! 🎉" 
                      : `Generating Outfit... ${generationProgress}%`}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.tryOnButton}
                  onPress={handleVirtualTryOn}
                >
                  <Text style={styles.tryOnButtonText}>Generate Outfit</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
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
    color: "#000000",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  rowContainer: {
    marginBottom: 24,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
  },
  horizontalItemCard: {
    width: 120,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    marginHorizontal: 8,
  },
  selectableArea: {
    flex: 1,
  },
  horizontalItemImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f5f5f5",
  },
  horizontalItemInfo: {
    padding: 8,
  },
  horizontalItemName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  horizontalItemPrice: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "400",
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "500",
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: "#000000",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  selectedBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  tryOnContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
  },
  tryOnButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tryOnButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    width: "100%",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
});
