import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile on mount
  useEffect(() => {
    if (isLoggedIn && user?.access_token) {
      fetchUserProfile();
    }
  }, [isLoggedIn, user]);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");

      const response = await fetch(
        "https://stylist-ai-be.onrender.com/api/user/profile",
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

        if (data.face_image) {
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
          colorSeason: "Autumn Warm", // TODO: Fetch from backend
          undertone: "Warm",
          contrast: "Medium",
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
          Alert.alert("Logged Out", "You have been logged out successfully");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: displayData.avatar }} style={styles.avatar} />

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleImageUpload}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>

            {!isLoggedIn && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestText}>Guest</Text>
              </View>
            )}
          </View>

          {/* Name & Email */}
          <Text style={styles.name}>{displayData.name}</Text>
          <Text style={styles.email}>{displayData.email}</Text>

          {/* Login Button if not logged in */}
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          )}

          {/* Color Analysis Info - only if logged in */}
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

              {/* Additional profile info if available */}
              {displayData.age && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Age</Text>
                    <Text style={styles.analysisValue}>{displayData.age}</Text>
                  </View>
                </>
              )}

              {displayData.gender && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Gender</Text>
                    <Text style={styles.analysisValue}>
                      {displayData.gender}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              handleMenuPress(() => router.push("/(tabs)/wardrobe"))
            }
          >
            <Text style={styles.menuIcon}>👗</Text>
            <Text style={styles.menuText}>My Wardrobe</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
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
              router.push("/liked-items");
            }}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>Liked Items</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress(() => console.log("Order History"))}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>Order History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              handleMenuPress(() => console.log("Brand Preferences"))
            }
          >
            <Text style={styles.menuIcon}>🏷️</Text>
            <Text style={styles.menuText}>Brand Preferences</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress(() => console.log("Settings"))}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
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
              router.push("/analysis-history");
            }}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>
              {isLoggedIn ? "Retake Analysis" : "Take Color Analysis"}
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button - only show if logged in */}
        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  shareIcon: {
    color: "#fff",
    fontSize: 20,
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 20,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  guestBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  analysisContainer: {
    width: "100%",
    marginTop: 10,
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  analysisLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  analysisValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  menuContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  menuArrow: {
    fontSize: 24,
    color: "#999",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  logoutText: {
    color: "#FF6B35",
    fontSize: 16,
    fontWeight: "bold",
  },
});
