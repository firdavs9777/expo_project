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

const API_BASE_URL = "http://172.18.8.215:8000";
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

      // Create FormData
      const formData = new FormData();

      // Add the image file
      const filename = photoUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri: photoUri,
        name: filename,
        type: type,
      } as any);

      // Upload to your backend
      const response = await fetch(`${API_BASE_URL}/api/test/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
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

        // Upload to backend
        const uploadResult = await uploadImageToBackend(photo.uri);

        Alert.alert("Success!", "Photo uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Navigate to results with the upload info
              router.push({
                pathname: "/onboarding/results",
                params: {
                  photoUri: photo.uri,
                  uploadData: JSON.stringify(uploadResult),
                },
              });
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.", [
        {
          text: "Skip",
          onPress: () => router.push("/onboarding/results"),
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
          <Text style={styles.skipButtonText}>Skip for Now</Text>
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
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} disabled={uploading}>
              <Text style={styles.skipText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Position your face inside the guide
            </Text>
          </View>

          {/* Face Guide Overlay */}
          <View style={styles.cameraContainer}>
            <View style={styles.faceOutline}>
              <View style={styles.faceOvalContainer}>
                {/* Face oval guide */}
                <View style={styles.faceOval} />

                {/* Lighting indicator */}
                <View style={styles.lightingIndicator}>
                  <View
                    style={[
                      styles.lightingDot,
                      lightingGood && styles.lightingDotGood,
                    ]}
                  />
                  <Text style={styles.lightingText}>Good Lighting</Text>
                </View>
              </View>
            </View>

            {/* Capture Button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.8}
              disabled={!cameraReady || uploading}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#FF6B35" />
              ) : (
                <View
                  style={[
                    styles.captureButtonInner,
                    !cameraReady && styles.captureButtonDisabled,
                  ]}
                />
              )}
            </TouchableOpacity>

            {/* Uploading Indicator */}
            {uploading && (
              <View style={styles.uploadingContainer}>
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Tips for best results:</Text>
            <Text style={styles.instructionText}>
              • Face the camera directly
            </Text>
            <Text style={styles.instructionText}>• Ensure good lighting</Text>
            <Text style={styles.instructionText}>
              • Remove glasses if possible
            </Text>
            <Text style={styles.instructionText}>
              • Keep a neutral expression
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
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
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(42, 42, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  skipText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  titleContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  faceOutline: {
    width: width * 0.7,
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  faceOvalContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  faceOval: {
    width: 250,
    height: 350,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  lightingIndicator: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lightingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#666",
  },
  lightingDotGood: {
    backgroundColor: "#4CAF50",
  },
  lightingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FF6B35",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B35",
  },
  captureButtonDisabled: {
    backgroundColor: "#999",
  },
  uploadingContainer: {
    position: "absolute",
    bottom: 130,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  uploadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  instructionsTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: "#fff",
    marginBottom: 6,
    lineHeight: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 100,
    marginBottom: 10,
    paddingHorizontal: 30,
  },
  errorSubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  skipButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignSelf: "center",
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
