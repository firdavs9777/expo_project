import { Camera } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [lightingGood, setLightingGood] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCapture = () => {
    if (!lightingGood) {
      Alert.alert(
        "Lighting Issue",
        "Please ensure you have good lighting for the best results."
      );
      return;
    }
    // Navigate to next screen after capture
    router.push("/onboarding/results");
  };

  const handleSkip = () => {
    router.push("/onboarding/results");
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Position your face inside the guide</Text>
      </View>

      {/* Camera Preview Area */}
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
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Tips for best results:</Text>
        <Text style={styles.instructionText}>• Face the camera directly</Text>
        <Text style={styles.instructionText}>• Ensure good lighting</Text>
        <Text style={styles.instructionText}>• Remove glasses if possible</Text>
        <Text style={styles.instructionText}>• Keep a neutral expression</Text>
      </View>
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
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
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
  instructionsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  instructionsTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: "#999",
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
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
