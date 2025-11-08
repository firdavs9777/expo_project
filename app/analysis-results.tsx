import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const API_BASE_URL = "https://stylist-ai-be.onrender.com";

export default function AnalysisResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoggedIn, user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Parse the upload data from camera screen
  let analysisData;
  try {
    analysisData = params.uploadData
      ? JSON.parse(params.uploadData as string)
      : null;
  } catch (error) {
    console.error("Error parsing upload data:", error);
  }

  // Use backend data if available, otherwise use default
  const result = analysisData || {
    confidence: 0.95,
    personal_color_type: "Autumn Warm",
    reasoning: "Default analysis - please take a photo for accurate results",
    season: "autumn",
    subtype: "warm",
    undertone: "warm",
    contrast: "medium",
  };

  const {
    confidence,
    personal_color_type,
    undertone,
    reasoning,
    season: seasonFromResult,
    contrast,
  } = result;

  // Extract season from personal_color_type if season is not directly available
  // e.g., "Autumn Warm" -> "autumn", "Winter Cool" -> "winter"
  const extractSeason = (colorType: string): string => {
    if (!colorType) return "autumn";
    const lower = colorType.toLowerCase();
    if (lower.includes("winter")) return "winter";
    if (lower.includes("spring")) return "spring";
    if (lower.includes("summer")) return "summer";
    if (lower.includes("autumn") || lower.includes("fall")) return "autumn";
    return "autumn"; // default fallback
  };

  const season = seasonFromResult || extractSeason(personal_color_type || "");

  // Debug logging
  console.log("Analysis Result:", JSON.stringify(result, null, 2));
  console.log("Extracted season:", season);
  console.log("Personal color type:", personal_color_type);

  // Color palettes based on season
  const colorPalettes: Record<string, { color: string; name: string }[]> = {
    winter: [
      { color: "#4B6C8C", name: "Deep Teal" },
      { color: "#2E3A59", name: "Midnight Navy" },
      { color: "#7D3F98", name: "Royal Purple" },
      { color: "#B30E3B", name: "Crimson Red" },
      { color: "#283747", name: "Charcoal" },
      { color: "#A8B4BF", name: "Cool Gray" },
      { color: "#264653", name: "Deep Cyan" },
      { color: "#6A5ACD", name: "Slate Blue" },
      { color: "#FFFFFF", name: "Snow White" },
    ],
    autumn: [
      { color: "#C97959", name: "Warm Coral" },
      { color: "#D4A574", name: "Golden Sand" },
      { color: "#8B9A7B", name: "Sage Green" },
      { color: "#E07A6F", name: "Terracotta" },
      { color: "#F4D8A8", name: "Cream" },
      { color: "#B8875E", name: "Caramel" },
      { color: "#A84B4D", name: "Burgundy" },
      { color: "#E5C3A1", name: "Beige" },
      { color: "#4A6B6C", name: "Teal" },
    ],
    spring: [
      { color: "#FFB6C1", name: "Light Pink" },
      { color: "#FFE4B5", name: "Moccasin" },
      { color: "#87CEEB", name: "Sky Blue" },
      { color: "#FFD700", name: "Gold" },
      { color: "#FFE4E1", name: "Misty Rose" },
      { color: "#F0E68C", name: "Khaki" },
      { color: "#FF7F50", name: "Coral" },
      { color: "#FFDAB9", name: "Peach" },
      { color: "#98FB98", name: "Pale Green" },
    ],
    summer: [
      { color: "#B0C4DE", name: "Light Steel Blue" },
      { color: "#DDA0DD", name: "Plum" },
      { color: "#F0E68C", name: "Soft Yellow" },
      { color: "#FFB6C1", name: "Light Pink" },
      { color: "#E6E6FA", name: "Lavender" },
      { color: "#B0E0E6", name: "Powder Blue" },
      { color: "#D8BFD8", name: "Thistle" },
      { color: "#F5DEB3", name: "Wheat" },
      { color: "#FAFAD2", name: "Light Goldenrod" },
    ],
  };

  const seasonKey = season?.toLowerCase() || "autumn";
  const colorPalette = colorPalettes[seasonKey] || colorPalettes.autumn;

  // Debug logging
  console.log("Season key:", seasonKey);
  console.log("Color palette length:", colorPalette?.length || 0);

  // Format confidence as percentage
  const confidencePercent = Math.round(
    typeof confidence === "number" ? confidence * 100 : parseFloat(confidence) || 95
  );

  // Format undertone
  const undertoneFormatted =
    undertone?.charAt(0).toUpperCase() + undertone?.slice(1) || "Warm";

  // Format contrast
  const contrastFormatted =
    contrast?.charAt(0).toUpperCase() + contrast?.slice(1) || "Medium";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My personal color type is ${personal_color_type}!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveResults = async () => {
    // Check if user is logged in
    if (!isLoggedIn || !user) {
      // Navigate to login page if not logged in
      router.push("/login");
      return;
    }

    try {
      setSaving(true);

      // Prepare color analysis data to save using the dedicated endpoint
      const colorAnalysisData = {
        personal_color_type: personal_color_type || "",
        confidence: confidencePercent / 100, // Convert back to decimal (0-1)
        undertone: undertone || "unknown",
        season: season || "unknown",
        subtype: result.subtype || "unknown",
        reasoning: reasoning || "",
      };

      console.log("Saving color analysis data:", JSON.stringify(colorAnalysisData, null, 2));

      // Save color analysis results using the dedicated endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/user/color/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${user.access_token}`,
          },
          body: JSON.stringify(colorAnalysisData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to save color analysis:", errorText);
        console.error("Response status:", response.status);
        Alert.alert(
          "Error",
          "Failed to save results. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }

      const savedData = await response.json();
      console.log("Color analysis saved successfully:", savedData);
      console.log("Saved color analysis keys:", Object.keys(savedData));

      // Success - navigate to profile
      Alert.alert("Success", "Your color analysis has been saved!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/profile"),
        },
      ]);
    } catch (error) {
      console.error("Error saving results:", error);
      Alert.alert(
        "Error",
        "An error occurred while saving. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRetakeAnalysis = () => {
    router.push("/onboarding/camera-profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RESULTS</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* White Card Container */}
        <View style={styles.card}>
          {/* Personal Color Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR PERSONAL COLOR</Text>
            <Text style={styles.personalColor}>{personal_color_type}</Text>
            <View style={styles.divider} />
          </View>

          {/* Analysis Details Section */}
          <View style={styles.analysisSection}>
            <View style={styles.analysisColumn}>
              <Text style={styles.analysisLabel}>CONFIDENCE</Text>
              <Text style={styles.analysisValue}>{confidencePercent}%</Text>
            </View>
            <View style={styles.analysisColumn}>
              <Text style={styles.analysisLabel}>UNDERTONE</Text>
              <Text style={styles.analysisValue}>{undertoneFormatted}</Text>
            </View>
            <View style={styles.analysisColumn}>
              <Text style={styles.analysisLabel}>CONTRAST</Text>
              <Text style={styles.analysisValue}>{contrastFormatted}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Color Palette Section */}
          <View style={styles.paletteSection}>
            <Text style={styles.sectionLabel}>YOUR PALETTE</Text>
            <View style={styles.colorGrid}>
              {colorPalette && colorPalette.length > 0 ? (
                colorPalette.slice(0, 9).map((item, index) => (
                  <View
                    key={index}
                    style={[styles.colorSquare, { backgroundColor: item.color }]}
                  />
                ))
              ) : (
                // Fallback: show autumn colors if palette is empty
                colorPalettes.autumn.slice(0, 9).map((item, index) => (
                  <View
                    key={index}
                    style={[styles.colorSquare, { backgroundColor: item.color }]}
                  />
                ))
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveResults}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>SAVE RESULTS</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetakeAnalysis}
              activeOpacity={0.8}
            >
              <Text style={styles.retakeButtonText}>RETAKE ANALYSIS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E5E5", // Light gray background
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
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#333333", // Dark gray
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333", // Dark gray
    letterSpacing: 0.5,
  },
  shareIcon: {
    color: "#333333", // Dark gray
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999999", // Light gray
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  personalColor: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 20,
  },
  analysisSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  analysisColumn: {
    flex: 1,
    alignItems: "flex-start",
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#999999", // Light gray
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  paletteSection: {
    marginBottom: 32,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  colorSquare: {
    width: (width - 88) / 3 - 6, // Account for padding and margins
    height: (width - 88) / 3 - 6, // Make it square
    borderRadius: 4,
    marginBottom: 12,
    minWidth: 80,
    minHeight: 80,
  },
  buttonsContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#666666",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  retakeButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },
  retakeButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
