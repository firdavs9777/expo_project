import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [lightingGood, setLightingGood] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (permission?.status === "undetermined") {
      requestPermission();
    }
  }, [permission]);

  const uploadImageToBackend = async (photoUri: string) => {
    try {
      setUploading(true);

      // Convert image to base64
      console.log("Converting image to base64...");
      const response = await fetch(photoUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            // Extract base64 string (remove data URL prefix if present)
            const base64String = base64data.includes(",")
              ? base64data.split(",")[1]
              : base64data;

            console.log("Base64 length:", base64String.length);

            // Prepare request body
            const requestBody = {
              image: base64String,
            };

            // Upload to backend for color analysis (hybrid ensemble - OpenAI as judge)
            const apiResponse = await fetch(
              `${API_BASE_URL}/api/analyze/color/ensemble/hybrid?judge_model=openai`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
              }
            );

            console.log("Response status:", apiResponse.status);

            if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              console.error("Server error response:", errorText);
              throw new Error(
                `Upload failed: ${apiResponse.status} - ${errorText}`
              );
            }

            const result = await apiResponse.json();
            console.log("Upload successful:", result);

            resolve(result);
          } catch (error) {
            console.error("Upload error:", error);
            reject(error);
          } finally {
            setUploading(false);
          }
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          setUploading(false);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      throw error;
    }
  };

  const handleCapture = async () => {
    if (!cameraReady) {
      Alert.alert(
        "Camera Not Ready",
        "Please wait for the camera to initialize."
      );
      return;
    }

    try {
      if (cameraRef.current) {
        // Take the picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        console.log("Photo taken:", photo.uri);

        // Navigate to analysis progress screen with photo
        router.push({
          pathname: "/onboarding/analysis-progress",
          params: {
            photoUri: photo.uri,
          },
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to analyze photo. Please try again.", [
        {
          text: "Skip",
          onPress: () => router.push("/analysis-results"),
        },
        {
          text: "Retry",
          onPress: () => handleCapture(),
        },
      ]);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/results");
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera access in your device settings to take a profile
          photo.
        </Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera View - Full Screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onCameraReady={() => setCameraReady(true)}
      >
        {/* Overlay UI on top of camera */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              disabled={uploading}
            >
              <View style={styles.backButtonInner}>
                <Text style={styles.backButtonText}>←</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSkip} 
              disabled={uploading}
              style={styles.skipButtonHeader}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Capture Your Profile</Text>
            <Text style={styles.subtitle}>Position your face in the frame</Text>
          </View>

          {/* Face Guide Overlay */}
          <View style={styles.cameraContainer}>
            {/* Corner guides */}
            <View style={styles.guideContainer}>
              <View style={styles.faceGuideFrame}>
                {/* Top corners */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                
                {/* Face oval guide */}
                <View style={styles.faceOvalContainer}>
                  <View style={styles.faceOval} />
                  <View style={styles.faceOvalInner} />
                </View>
                
                {/* Bottom corners */}
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {/* Lighting indicator */}
            <View style={styles.lightingIndicator}>
              <View
                style={[
                  styles.lightingDot,
                  lightingGood && styles.lightingDotGood,
                ]}
              />
              <Text style={styles.lightingText}>
                {lightingGood ? "Good Lighting" : "Adjust Lighting"}
              </Text>
            </View>

            {/* Uploading Indicator */}
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.uploadingText}>Analyzing your colors...</Text>
              </View>
            )}
          </View>

          {/* Capture Button - Between camera and tips */}
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.7}
              disabled={!cameraReady || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <View
                  style={[
                    styles.captureButtonInner,
                    !cameraReady && styles.captureButtonDisabled,
                  ]}
                />
              )}
            </TouchableOpacity>
            {!uploading && (
              <Text style={styles.captureHint}>
                {cameraReady ? "Tap to capture" : "Preparing camera..."}
              </Text>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsIcon}>💡</Text>
              <Text style={styles.instructionsTitle}>Tips for best results</Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionBullet} />
                <Text style={styles.instructionText}>Face the camera directly</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionBullet} />
                <Text style={styles.instructionText}>Ensure good lighting</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionBullet} />
                <Text style={styles.instructionText}>Remove glasses if possible</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionBullet} />
                <Text style={styles.instructionText}>Keep a neutral expression</Text>
              </View>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  skipButtonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  titleSection: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontWeight: "400",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingVertical: 20,
  },
  guideContainer: {
    width: width * 0.75,
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuideFrame: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  faceOvalContainer: {
    position: "absolute",
    width: 260,
    height: 360,
    justifyContent: "center",
    alignItems: "center",
  },
  faceOval: {
    width: 260,
    height: 360,
    borderRadius: 130,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  faceOvalInner: {
    position: "absolute",
    width: 240,
    height: 340,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "transparent",
  },
  lightingIndicator: {
    position: "absolute",
    top: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  lightingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4444",
  },
  lightingDotGood: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  lightingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  captureButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#000000",
  },
  captureButtonDisabled: {
    backgroundColor: "#666666",
  },
  captureHint: {
    marginTop: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  uploadingContainer: {
    position: "absolute",
    bottom: 160,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  instructionsContainer: {
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 50,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  instructionsIcon: {
    fontSize: 18,
  },
  instructionsTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  instructionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 20,
    flex: 1,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    fontWeight: "500",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 100,
    marginBottom: 12,
    paddingHorizontal: 30,
  },
  errorSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  skipButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
