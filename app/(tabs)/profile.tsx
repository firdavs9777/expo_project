import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [colorAnalysis, setColorAnalysis] = useState<any>(null);

  // Fetch user profile and color analysis on mount
  useEffect(() => {
    if (isLoggedIn && user?.access_token) {
      fetchUserProfile();
      fetchColorAnalysis();
    }
  }, [isLoggedIn, user]);

  // Refetch profile when screen comes into focus (e.g., after saving analysis)
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && user?.access_token) {
        fetchUserProfile();
        fetchColorAnalysis();
      }
    }, [isLoggedIn, user])
  );

  // Fetch color analysis data from backend
  const fetchColorAnalysis = async () => {
    try {
      console.log("Fetching color analysis...");

      const response = await fetch(
        `${API_BASE_URL}/api/user/color/results?limit=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Color analysis fetched successfully:", data);
        
        // Get the most recent result (first item in the array)
        if (Array.isArray(data) && data.length > 0) {
          setColorAnalysis(data[0]);
          console.log("Using most recent color analysis:", data[0]);
        } else {
          console.log("No color analysis results found");
          setColorAnalysis(null);
        }
      } else if (response.status === 404) {
        // No color analysis saved yet
        console.log("No color analysis found");
        setColorAnalysis(null);
      } else {
        console.log("Failed to fetch color analysis, status:", response.status);
        setColorAnalysis(null);
      }
    } catch (error) {
      console.error("Error fetching color analysis:", error);
      setColorAnalysis(null);
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");

      const response = await fetch(
        `${API_BASE_URL}/api/user/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Profile fetched successfully");
        console.log("Profile keys:", Object.keys(data));

        setUserProfile(data);

        if (data.body) {
          console.log("Face image found in profile");
          console.log("Face image type:", typeof data.face_image);
          console.log("Face image length:", data.face_image.length);
          console.log(
            "Face image starts with:",
            data.face_image.substring(0, 30)
          );

          // If face_image already has data URI prefix, use as-is
          // Otherwise, add the prefix
          const imageUri = data.face_image.startsWith("data:")
            ? data.face_image
            : `data:image/jpeg;base64,${data.face_image}`;

          setProfileImage(imageUri);
          console.log("Profile image set successfully");
        } else {
          console.log("No face image in profile");
        }
      } else {
        console.log("Failed to fetch profile, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Handle menu item press - redirect to login if not logged in
  const handleMenuPress = (action: () => void) => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please log in to access this feature", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log In",
          onPress: () => router.push("/login"),
        },
      ]);
      return;
    }
    // User is logged in, execute the action
    action();
  };

  // Request image picker permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library permissions to upload a profile picture."
      );
      return false;
    }
    return true;
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "Please log in to upload a profile picture",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log In",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }

    Alert.alert("Upload Profile Picture", "Choose an option", [
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

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera permissions to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Upload profile image to backend
  const uploadProfileImage = async (imageUri: string) => {
    setUploadingImage(true);

    try {
      console.log("Converting profile image to base64...");
      console.log("Image URI:", imageUri);

      // Convert image to base64 using FileSystem
      let faceImageDataUri: string;
      try {
        const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64" as any,
        });

        if (
          !imageBase64 ||
          typeof imageBase64 !== "string" ||
          imageBase64.length === 0
        ) {
          throw new Error(
            "Image base64 conversion returned empty or invalid result"
          );
        }

        // Determine image format from URI
        const imageFormat = imageUri.toLowerCase().includes(".png")
          ? "png"
          : "jpeg";
        faceImageDataUri = `data:image/${imageFormat};base64,${imageBase64}`;

        console.log("Image base64 length:", imageBase64.length);
        console.log("Image data URI length:", faceImageDataUri.length);
        console.log(
          "Image data URI starts with:",
          faceImageDataUri.substring(0, 30)
        );
      } catch (error) {
        console.error("Error converting image:", error);
        throw new Error(
          `Failed to convert image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      if (!faceImageDataUri || !faceImageDataUri.startsWith("data:image/")) {
        throw new Error(
          `Invalid image data URI format: ${
            faceImageDataUri ? faceImageDataUri.substring(0, 50) : "null"
          }`
        );
      }

      console.log("Sending profile update request to API...");

      // Create profile update payload with existing data
      const profileData = {
        height: userProfile?.height || null,
        weight: userProfile?.weight || null,
        chest_size: userProfile?.chest_size || null,
        waist_size: userProfile?.waist_size || null,
        hip_size: userProfile?.hip_size || null,
        shoe_size: userProfile?.shoe_size || null,
        clothing_size: userProfile?.clothing_size || null,
        age: userProfile?.age || null,
        gender: userProfile?.gender || null,
        preferred_style: userProfile?.preferred_style || null,
        body_image: userProfile?.body_image || null,
        face_image: faceImageDataUri, // Update face image with new base64 data URI
      };

      console.log("Profile data prepared");
      console.log("Face image present:", !!profileData.face_image);
      console.log("Face image type:", typeof profileData.face_image);

      const requestBodyString = JSON.stringify(profileData);
      console.log("Request body string length:", requestBodyString.length);

      // Verify JSON stringification worked
      const parsed = JSON.parse(requestBodyString);
      if (!parsed.face_image) {
        throw new Error(
          "JSON stringification failed - face_image field is missing"
        );
      }
      console.log("JSON stringification verified");

      const response = await fetch(
        "https://stylist-ai-be.onrender.com/api/user/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${user?.access_token}`,
          },
          body: requestBodyString,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(
          `Failed to upload profile picture: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log("=== API Response ===");
      console.log("Response status:", response.status);
      console.log("Response keys:", Object.keys(data));
      console.log("Profile updated successfully");

      // Update local state
      setUserProfile(data);
      setProfileImage(faceImageDataUri);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Display data based on login status
  const displayData =
    isLoggedIn && user
      ? {
          name: user.email.split("@")[0] || "User",
          email: user.email,
          avatar: profileImage || `https://i.pravatar.cc/300?u=${user.user_id}`,
          colorSeason: colorAnalysis?.personal_color_type || "Not analyzed",
          undertone: colorAnalysis?.undertone 
            ? colorAnalysis.undertone.charAt(0).toUpperCase() + colorAnalysis.undertone.slice(1)
            : "Unknown",
          contrast: colorAnalysis?.contrast
            ? colorAnalysis.contrast.charAt(0).toUpperCase() + colorAnalysis.contrast.slice(1)
            : colorAnalysis?.subtype
            ? colorAnalysis.subtype.charAt(0).toUpperCase() + colorAnalysis.subtype.slice(1)
            : "Unknown",
          age: userProfile?.age || null,
          gender: userProfile?.gender || null,
          height: userProfile?.height || null,
          weight: userProfile?.weight || null,
        }
      : {
          name: "Guest User",
          email: "guest@example.com",
          avatar: "https://i.pravatar.cc/300?img=0",
          colorSeason: "Not analyzed",
          undertone: "Unknown",
          contrast: "Unknown",
          age: null,
          gender: null,
          height: null,
          weight: null,
        };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          setProfileImage(null);
          setUserProfile(null);
          // Navigate to login screen after logout
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Text style={styles.avatarLabel}>Avatar</Text>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: displayData.avatar }} style={styles.avatar} />
              <TouchableOpacity
                style={styles.reuploadButton}
                onPress={handleImageUpload}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="pencil" size={16} color="#000000" />
                    <Text style={styles.reuploadText}>Re-upload Picture</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Analysis Info */}
          {isLoggedIn && (
            <View style={styles.analysisContainer}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Color Season</Text>
                <Text style={styles.analysisValue}>
                  {displayData.colorSeason}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Undertone</Text>
                <Text style={styles.analysisValue}>
                  {displayData.undertone}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Contrast</Text>
                <Text style={styles.analysisValue}>{displayData.contrast}</Text>
              </View>
            </View>
          )}

          {/* Retake Analysis Button */}
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert(
                  "Login Required",
                  "Please log in to access this feature",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Log In",
                      onPress: () => router.push("/login"),
                    },
                  ]
                );
                return;
              }
              router.push("/onboarding/camera-profile");
            }}
          >
            <Text style={styles.retakeButtonText}>Retake Analysis</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          {isLoggedIn && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#000000" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  shareButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSection: {
    marginBottom: 24,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  reuploadButton: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    gap: 8,
  },
  reuploadText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  analysisContainer: {
    width: "100%",
    marginBottom: 24,
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  analysisLabel: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
  analysisValue: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  retakeButton: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  retakeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
