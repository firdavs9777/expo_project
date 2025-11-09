import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function AnalysisProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNoFaceDetected, setIsNoFaceDetected] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const analysisSteps = [
    "Analyzing your color palette",
    "Checking your preferences",
    "Processing skin tone",
    "Determining your season",
    "Finalizing results",
  ];

  // Upload image to backend
  const uploadImageToBackend = async (photoUri: string) => {
    try {
      // Convert image to base64
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

            if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              let errorMessage = `Upload failed: ${apiResponse.status} - ${errorText}`;
              
              // Check if it's a "no face detected" error
              try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.detail && errorJson.detail.includes("No face detected take closer photo")) {
                  errorMessage = "NO_FACE_DETECTED";
                }
              } catch (e) {
                // If errorText is not JSON, check if it contains the message
                if (errorText.includes("No face detected")) {
                  errorMessage = "NO_FACE_DETECTED";
                }
              }
              
              throw new Error(errorMessage);
            }

            const result = await apiResponse.json();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (!photoUri) return;

    // Start upload
    uploadImageToBackend(photoUri)
      .then((result) => {
        setUploadResult(result);
        // Set progress to 100 when upload completes
        setProgress(100);
        setError(null);
        setIsNoFaceDetected(false);
      })
      .catch((error) => {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a "no face detected" error
        if (errorMessage === "NO_FACE_DETECTED" || errorMessage.includes("No face detected")) {
          // Clear progress interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setIsNoFaceDetected(true);
          setError("No face detected in the image. Please retake the photo with your face clearly visible.");
          setProgress(0);
        } else {
          // For other errors, navigate to results without data
          setError(errorMessage);
          setTimeout(() => {
            router.replace({
              pathname: "/analysis-results",
              params: {
                photoUri: photoUri,
              },
            });
          }, 2000);
        }
      });

    // Simulate progress while uploading
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          // Don't go to 100 until upload completes
          return prev;
        }
        return prev + Math.random() * 3 + 1; // Random increment between 1-4
      });
    }, 200);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [photoUri]);

  // Update current step based on progress
  useEffect(() => {
    const newStep = Math.floor((progress / 100) * analysisSteps.length);
    setCurrentStep(Math.min(newStep, analysisSteps.length - 1));
  }, [progress]);

  // Navigate to results when upload completes
  useEffect(() => {
    if (progress >= 100 && uploadResult) {
      setTimeout(() => {
        router.replace({
          pathname: "/analysis-results",
          params: {
            photoUri: photoUri,
            uploadData: JSON.stringify(uploadResult),
          },
        });
      }, 500);
    }
  }, [progress, uploadResult, photoUri]);

  const handleRetake = () => {
    router.replace("/onboarding/camera-profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Photo Display */}
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      )}

      {/* Error State - No Face Detected */}
      {isNoFaceDetected ? (
        <View style={styles.progressContainer}>
          <Text style={styles.errorTitle}>No Face Detected</Text>
          <Text style={styles.errorText}>
            {error || "Please ensure your face is clearly visible in the photo."}
          </Text>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            activeOpacity={0.8}
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Progress Section */
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Analyzing {Math.round(progress)}%...</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          {/* Current Step Text */}
          <Text style={styles.stepText}>
            {analysisSteps[currentStep] || analysisSteps[0]}
          </Text>
          {currentStep < analysisSteps.length - 1 && (
            <Text style={styles.nextStepText}>
              {analysisSteps[currentStep + 1]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  photo: {
    width: width,
    height: height * 0.65,
    resizeMode: "cover",
  },
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
    textAlign: "center",
  },
  nextStepText: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: "#666666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retakeButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  retakeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
