import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
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

export default function AnalysisResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
    confidence: 0.75,
    personal_color_type: "Autumn Warm",
    reasoning: "Default analysis - please take a photo for accurate results",
    season: "autumn",
    subtype: "warm",
    undertone: "warm",
  };

  const { confidence, personal_color_type, undertone, reasoning, season } =
    result;

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

  const colorPalette =
    colorPalettes[season.toLowerCase()] || colorPalettes.autumn;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My personal color type is ${personal_color_type} from BananaTalk! 🍌`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveResults = () => {
    // Save to profile and navigate to main app
    router.replace("/(tabs)");
  };

  const handleRetakeAnalysis = () => {
    router.push("/cameraProfile");
  };

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
        <Text style={styles.headerTitle}>Color Analysis Results</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Results Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerSubtext}>Your personal color is</Text>
          <Text style={styles.bannerTitle}>{personal_color_type}</Text>
          <Text style={styles.bannerSubtitle}>
            ({undertone === "cool" ? "쿨톤" : "웜톤"})
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>
              {Math.round(confidence * 100)}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Undertone</Text>
            <Text style={styles.statValue}>
              {undertone.charAt(0).toUpperCase() + undertone.slice(1)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Season</Text>
            <Text style={styles.statValue}>
              {season.charAt(0).toUpperCase() + season.slice(1)}
            </Text>
          </View>
        </View>

        {/* Color Palette */}
        <View style={styles.paletteContainer}>
          <Text style={styles.sectionTitle}>Your Best Colors</Text>
          <View style={styles.colorGrid}>
            {colorPalette.map((item, index) => (
              <View key={index} style={styles.colorItem}>
                <View
                  style={[styles.colorSwatch, { backgroundColor: item.color }]}
                />
                <Text style={styles.colorName}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Analysis Summary */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Analysis Summary</Text>
          <Text style={styles.descriptionText}>{reasoning}</Text>

          {confidence < 0.5 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Low Confidence</Text>
              <Text style={styles.warningText}>
                The analysis confidence is below 50%. For better results, retake
                the photo in natural daylight without makeup or filters.
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Styling Tips</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>👗</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Best Colors to Wear</Text>
              <Text style={styles.tipText}>
                {season === "winter" &&
                  "Deep, jewel-toned colors like navy, burgundy, and emerald"}
                {season === "autumn" &&
                  "Warm, earthy tones like terracotta, olive, and rust"}
                {season === "spring" &&
                  "Bright, clear colors like coral, peach, and warm pink"}
                {season === "summer" &&
                  "Soft, muted colors like lavender, powder blue, and mauve"}
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💄</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Makeup Recommendations</Text>
              <Text style={styles.tipText}>
                {undertone === "cool"
                  ? "Cool-toned pinks, berries, and blue-based reds"
                  : "Warm-toned corals, peaches, and orange-based reds"}
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💎</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Accessories</Text>
              <Text style={styles.tipText}>
                {undertone === "cool"
                  ? "Silver jewelry, platinum, white gold"
                  : "Gold jewelry, brass, copper accents"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveResults}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Continue to App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRetakeAnalysis}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Retake Analysis</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  shareIcon: {
    color: "#fff",
    fontSize: 24,
  },
  bannerContainer: {
    paddingHorizontal: 30,
    paddingVertical: 30,
    alignItems: "center",
  },
  bannerSubtext: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 18,
    color: "#999",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  paletteContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorItem: {
    width: (width - 84) / 3,
    alignItems: "center",
  },
  colorSwatch: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorName: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  descriptionContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 22,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#fff",
    lineHeight: 20,
  },
  recommendationsContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  tipEmoji: {
    fontSize: 32,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: "#999",
    lineHeight: 20,
  },
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
