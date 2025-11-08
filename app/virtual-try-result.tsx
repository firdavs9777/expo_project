// app/virtual-result.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function VirtualResult() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [isSaving, setIsSaving] = useState(false);

  const resultImageUri = params.resultImageUri as string;
  const outfitImageUrl = params.outfitImageUrl as string;
  const outfitName = params.outfitName as string;
  const outfitPrice = params.outfitPrice as string;
  const outfitColor = params.outfitColor as string;
  const outfitId = params.outfitId as string;

  const saveToGallery = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save photos to your gallery."
        );
        return;
      }

      setIsSaving(true);

      // Convert base64 to file
      const filename = `tryon_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Remove data URI prefix if present
      const base64Data = resultImageUri.replace(/^data:image\/\w+;base64,/, "");

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64' as any,
      });

      // Save to gallery
      await MediaLibrary.createAssetAsync(fileUri);

      Alert.alert("Success!", "Image saved to your gallery.");
    } catch (error) {
      console.error("Error saving to gallery:", error);
      Alert.alert(
        "Error",
        `Failed to save image to gallery: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Share image
  //   const shareImage = async () => {
  //     try {
  //       const isAvailable = await Sharing.isAvailableAsync();
  //       if (!isAvailable) {
  //         Alert.alert("Error", "Sharing is not available on this device.");
  //         return;
  //       }

  //       // Convert base64 to file
  //       const filename = `tryon_${Date.now()}.png`;
  //       const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  //       // Remove data URI prefix if present
  //       const base64Data = resultImageUri.replace(/^data:image\/\w+;base64,/, "");

  //       await FileSystem.writeAsStringAsync(fileUri, base64Data, {
  //         encoding: FileSystem.EncodingType.Base64,
  //       });

  //       await Sharing.shareAsync(fileUri);
  //     } catch (error) {
  //       console.error("Error sharing image:", error);
  //       Alert.alert("Error", "Failed to share image.");
  //     }
  //   };

  // Save to favorites/liked items
  const saveToFavorites = async () => {
    if (!user?.access_token) {
      Alert.alert("Error", "Please log in to save favorites.");
      return;
    }

    try {
      const response = await fetch(
        "https://stylist-ai-be.onrender.com/api/user/outfits/like",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({
            item_id: outfitId,
            result_image_url: resultImageUri,
          }),
        }
      );

      if (response.ok) {
        Alert.alert("Saved!", "Added to your favorites.");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save to favorites.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Try-On</Text>
        <TouchableOpacity
          style={styles.shareButton}
          //  onPress={shareImage}
        >
          <Ionicons name="share-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          <Text style={styles.successText}>Virtual Try-On Complete!</Text>
        </View>

        {/* Result Image */}
        <View style={styles.resultSection}>
          <Image
            source={{ uri: resultImageUri }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        </View>

        {/* Outfit Info */}
        <View style={styles.outfitInfo}>
          <View style={styles.outfitHeader}>
            <Image
              source={{ uri: outfitImageUrl }}
              style={styles.outfitThumbnail}
              resizeMode="cover"
            />
            <View style={styles.outfitDetails}>
              <Text style={styles.outfitName} numberOfLines={2}>
                {outfitName}
              </Text>
              {outfitPrice && (
                <Text style={styles.outfitPrice}>{outfitPrice}</Text>
              )}
              {outfitColor && (
                <Text style={styles.outfitColor}>{outfitColor}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={saveToFavorites}
          >
            <Ionicons name="heart" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Save to Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={saveToGallery}
            disabled={isSaving}
          >
            <Ionicons name="download" size={24} color="#FF6B35" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              {isSaving ? "Saving..." : "Save to Gallery"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Try Again Button */}
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => router.back()}
        >
          <Ionicons name="refresh" size={20} color="#999" />
          <Text style={styles.tryAgainButtonText}>Try Another Photo</Text>
        </TouchableOpacity>

        {/* Back to Browse Button */}
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => {
            // Navigate back to outfit swipe deck
            router.push("/(tabs)/profile");
          }}
        >
          <Text style={styles.browseButtonText}>Browse More Outfits</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3a3a3a",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3a3a3a",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  resultSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  resultImage: {
    width: "100%",
    height: 500,
    backgroundColor: "#3a3a3a",
  },
  outfitInfo: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  outfitHeader: {
    flexDirection: "row",
    gap: 12,
  },
  outfitThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#3a3a3a",
  },
  outfitDetails: {
    flex: 1,
    justifyContent: "center",
  },
  outfitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  outfitPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    marginBottom: 4,
  },
  outfitColor: {
    fontSize: 14,
    color: "#999",
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  secondaryButtonText: {
    color: "#FF6B35",
  },
  tryAgainButton: {
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  tryAgainButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  browseButton: {
    backgroundColor: "transparent",
    alignItems: "center",
    padding: 16,
  },
  browseButtonText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
