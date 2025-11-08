// app/virtual-try.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
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

    try {
      console.log("Converting user photo to base64...");
      const userImageBase64 = await FileSystem.readAsStringAsync(userPhoto, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const userImageDataUri = `data:image/jpeg;base64,${userImageBase64}`;

      console.log("Downloading and converting outfit image to base64...");
      const productImageUri = `${FileSystem.cacheDirectory}product_image.jpg`;
      const { status, uri } = await FileSystem.downloadAsync(
        outfitImageUrl,
        productImageUri
      );
      if (status !== 200) throw new Error("Failed to download product image");

      const productImageBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const productImageDataUri = `data:image/jpeg;base64,${productImageBase64}`;

      console.log("Sending request to try-on API...");
      const response = await fetch(
        "https://stylist-ai-be.onrender.com/api/test/try-on/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_image: userImageDataUri,
            product_image: productImageDataUri,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");

      const processResult = (base64: string) => {
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
        const resultImage = data.image || data.result_image || data.result;
        processResult(resultImage);
      } else {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          processResult(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Virtual try-on error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to process virtual try-on. Please try again."
      );
    } finally {
      setLoading(false);
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
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={selectPhotoOption}
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#95A5A6" />
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
            (!userPhoto || loading) && styles.tryOnButtonDisabled,
          ]}
          onPress={handleVirtualTryOn}
          disabled={!userPhoto || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.tryOnButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#FFF" />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 12,
  },
  outfitCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  outfitImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#3a3a3a",
  },
  outfitDetails: {
    padding: 16,
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
  uploadButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3a3a3a",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  photoContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  userPhoto: {
    width: "100%",
    height: 400,
    backgroundColor: "#3a3a3a",
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  tryOnButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  tryOnButtonDisabled: {
    backgroundColor: "#3a3a3a",
    opacity: 0.5,
  },
  tryOnButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
