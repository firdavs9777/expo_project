// app/virtual-try.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VirtualTryOn() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  const outfitImageUrl = params.outfitImageUrl as string;
  const outfitName = params.outfitName as string;
  const outfitPrice = params.outfitPrice as string;
  const outfitColor = params.outfitColor as string;
  const outfitId = params.outfitId as string;

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
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      setTryOnResult(null);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUserPhoto(result.assets[0].uri);
      setTryOnResult(null);
    }
  };

  // Show photo selection options
  const selectPhotoOption = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: takePhoto,
      },
      {
        text: "Choose from Gallery",
        onPress: pickImage,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Submit for virtual try-on
  const handleVirtualTryOn = async () => {
    if (!userPhoto) {
      Alert.alert("Photo Required", "Please upload your photo first.");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress: 0-20% - Preparing images
      setProgress(10);
      console.log("Converting user photo to base64...");
      console.log("User photo URI:", userPhoto);
      
      // Convert user image to base64 using FileSystem
      let userImageDataUri: string;
      try {
      const userImageBase64 = await FileSystem.readAsStringAsync(userPhoto, {
          encoding: 'base64' as any,
        });
        
        if (!userImageBase64 || typeof userImageBase64 !== 'string' || userImageBase64.length === 0) {
          throw new Error("User image base64 conversion returned empty or invalid result");
        }
        
        // Determine image format from URI
        const userImageFormat = userPhoto.toLowerCase().includes('.png') ? 'png' : 'jpeg';
        userImageDataUri = `data:image/${userImageFormat};base64,${userImageBase64}`;

        console.log("User image base64 length:", userImageBase64.length);
        console.log("User image data URI length:", userImageDataUri.length);
        console.log("User image data URI starts with:", userImageDataUri.substring(0, 30));
      } catch (error) {
        console.error("Error converting user image:", error);
        throw new Error(`Failed to convert user image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      if (!userImageDataUri || !userImageDataUri.startsWith('data:image/')) {
        throw new Error(`Invalid user image data URI format: ${userImageDataUri ? userImageDataUri.substring(0, 50) : 'null'}`);
      }

      // Progress: 20-40% - Processing product image
      setProgress(30);
      console.log("Converting outfit image to base64...");
      console.log("Outfit image URL:", outfitImageUrl);
      
      // Download and convert product image to base64
      let productImageDataUri: string;
      try {
        // Download the image first
        const productImageUri = `${FileSystem.cacheDirectory}product_image_${Date.now()}.jpg`;
        const downloadResult = await FileSystem.downloadAsync(
        outfitImageUrl,
        productImageUri
      );
        
        if (downloadResult.status !== 200) {
          throw new Error(`Failed to download product image: HTTP ${downloadResult.status}`);
        }
        
        // Read as base64
        const productImageBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: 'base64' as any,
        });
        
        if (!productImageBase64 || typeof productImageBase64 !== 'string' || productImageBase64.length === 0) {
          throw new Error("Product image base64 conversion returned empty or invalid result");
        }
        
        // Determine image format from URL
        const productImageFormat = outfitImageUrl.toLowerCase().includes('.png') ? 'png' : 'jpeg';
        productImageDataUri = `data:image/${productImageFormat};base64,${productImageBase64}`;
        
        console.log("Product image base64 length:", productImageBase64.length);
        console.log("Product image data URI length:", productImageDataUri.length);
        console.log("Product image data URI starts with:", productImageDataUri.substring(0, 30));
      } catch (error) {
        console.error("Error converting product image:", error);
        throw new Error(`Failed to convert product image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      if (!productImageDataUri || !productImageDataUri.startsWith('data:image/')) {
        throw new Error(`Invalid product image data URI format: ${productImageDataUri ? productImageDataUri.substring(0, 50) : 'null'}`);
      }

      // Progress: 40-50% - Preparing request
      setProgress(45);
      console.log("Sending request to try-on API...");
      
      // Validate both images are ready
      if (!userImageDataUri || userImageDataUri === 'null' || !userImageDataUri.startsWith('data:image/')) {
        throw new Error(`Invalid user_image: ${userImageDataUri ? 'format incorrect' : 'is null/undefined'}`);
      }
      
      if (!productImageDataUri || productImageDataUri === 'null' || !productImageDataUri.startsWith('data:image/')) {
        throw new Error(`Invalid product_image: ${productImageDataUri ? 'format incorrect' : 'is null/undefined'}`);
      }
      
      const requestBody = {
        user_image: userImageDataUri,
        product_image: productImageDataUri,
      };
      
      console.log("Request body validation passed");
      console.log("User image present:", !!requestBody.user_image);
      console.log("Product image present:", !!requestBody.product_image);
      console.log("User image type:", typeof requestBody.user_image);
      console.log("Product image type:", typeof requestBody.product_image);
      
      const requestBodyString = JSON.stringify(requestBody);
      console.log("Request body string length:", requestBodyString.length);
      console.log("Request body preview:", requestBodyString.substring(0, 200));
      
      // Verify JSON stringification worked
      const parsed = JSON.parse(requestBodyString);
      if (!parsed.user_image || !parsed.product_image) {
        throw new Error("JSON stringification failed - fields are missing");
      }
      console.log("JSON stringification verified");
      
      // Progress: 50-90% - Sending request and processing
      setProgress(60);
      
      // Simulate progress during API processing
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) {
            return Math.min(prev + 2, 90);
          }
          return prev;
        });
      }, 200);
      
      const response = await fetch(
        "https://stylist-ai-be.onrender.com/api/try-on/generate",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: requestBodyString,
        }
      );

      if (!response.ok) {
        if (progressInterval) clearInterval(progressInterval);
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Progress: 90-100% - Processing response
      setProgress(95);
      if (progressInterval) clearInterval(progressInterval);
      const contentType = response.headers.get("content-type");

      const processResult = (base64: string | null | undefined) => {
        if (!base64 || typeof base64 !== 'string') {
          throw new Error("Invalid result image data received from API");
        }
        
        const base64WithPrefix = base64.startsWith("data:")
          ? base64
          : `data:image/png;base64,${base64}`;

        // Navigate to result screen
        router.push({
          pathname: "/virtual-try-result",
          params: {
            resultImageUri: base64WithPrefix,
            outfitImageUrl,
            outfitName,
            outfitPrice: outfitPrice || "",
            outfitColor: outfitColor || "",
            outfitId,
          },
        });
      };

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        
        // Log full API response
        console.log("=== API Response ===");
        console.log("Response status:", response.status);
        console.log("Content-Type:", contentType);
        console.log("Response keys:", Object.keys(data));
        console.log("Full response:", JSON.stringify(data, null, 2));
        console.log("Response preview (first 500 chars):", JSON.stringify(data).substring(0, 500));
        
        // Try multiple possible field names for the result image
        const resultImage = data.try_on_image || data.image || data.result_image || data.result || data.data;
        
        console.log("Checking for image field...");
        console.log("try_on_image:", data.try_on_image ? `Found (length: ${data.try_on_image.length})` : "Not found");
        console.log("image:", data.image ? `Found (length: ${data.image.length})` : "Not found");
        console.log("result_image:", data.result_image ? `Found (length: ${data.result_image.length})` : "Not found");
        console.log("result:", data.result ? `Found (length: ${data.result.length})` : "Not found");
        console.log("data:", data.data ? `Found (length: ${data.data.length})` : "Not found");
        
        if (!resultImage) {
          console.error("No image field found in response. Available keys:", Object.keys(data));
          console.error("Response structure:", data);
          throw new Error("API response does not contain image data. Available fields: " + Object.keys(data).join(", "));
        }
        
        console.log("Result image found, type:", typeof resultImage);
        console.log("Result image length:", typeof resultImage === 'string' ? resultImage.length : 'N/A');
        console.log("Result image preview (first 100 chars):", typeof resultImage === 'string' ? resultImage.substring(0, 100) : 'N/A');
        setProgress(100);
        processResult(resultImage);
      } else {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (!result || typeof result !== 'string') {
            throw new Error("Failed to convert blob to data URL");
          }
          setProgress(100);
          processResult(result);
        };
        reader.onerror = () => {
          throw new Error("Error reading blob data");
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Virtual try-on error:", error);
      setProgress(0);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to process virtual try-on. Please try again."
      );
    } finally {
      setLoading(false);
      setProgress(0);
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
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Virtual Try-On</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Outfit Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Outfit</Text>
          <View style={styles.outfitCard}>
            <Image
              source={{ uri: outfitImageUrl }}
              style={styles.outfitImage}
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

        {/* User Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Photo</Text>
          {userPhoto ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: userPhoto }}
                style={styles.userPhoto}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={selectPhotoOption}
              >
                <Ionicons name="camera" size={20} color="#000000" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={selectPhotoOption}
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#666666" />
              <Text style={styles.uploadButtonText}>Upload Your Photo</Text>
              <Text style={styles.uploadButtonSubtext}>
                Take a photo or choose from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Try On Button */}
        <TouchableOpacity
          style={[
            styles.tryOnButton,
            loading ? styles.tryOnButtonLoading : (!userPhoto && styles.tryOnButtonDisabled),
          ]}
          onPress={handleVirtualTryOn}
          disabled={!userPhoto || loading}
        >
          {loading ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.processingText}>
                {progress < 100 ? `Processing... ${progress}%` : "Complete!"}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.tryOnButtonText}>Try On Now</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  outfitCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outfitImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  outfitDetails: {
    padding: 16,
  },
  outfitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  outfitPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  outfitColor: {
    fontSize: 14,
    color: "#666666",
  },
  uploadButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  photoContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  userPhoto: {
    width: "100%",
    height: 400,
    backgroundColor: "#f5f5f5",
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  changePhotoText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  tryOnButton: {
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  tryOnButtonLoading: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  tryOnButtonDisabled: {
    backgroundColor: "#e0e0e0",
    opacity: 0.5,
  },
  tryOnButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  processingText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
});
