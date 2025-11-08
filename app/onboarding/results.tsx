import { useRouter } from "expo-router";
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

  const colorPalette = [
    { color: "#C97959", name: "Warm Coral" },
    { color: "#D4A574", name: "Golden Sand" },
    { color: "#8B9A7B", name: "Sage Green" },
    { color: "#E07A6F", name: "Terracotta" },
    { color: "#F4D8A8", name: "Cream" },
    { color: "#B8875E", name: "Caramel" },
    { color: "#A84B4D", name: "Burgundy" },
    { color: "#E5C3A1", name: "Beige" },
    { color: "#4A6B6C", name: "Teal" },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Check out my personal color analysis results from BananaTalk! 🍌",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveResults = () => {
    // Save to profile and navigate to main app
    router.replace("/");
  };

  const handleRetakeAnalysis = () => {
    router.push("/onboarding/camera-profile");
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
          <Text style={styles.bannerTitle}>Autumn Warm</Text>
          <Text style={styles.bannerSubtitle}>(가을 웜톤)</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>95%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Undertone</Text>
            <Text style={styles.statValue}>Warm</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Contrast</Text>
            <Text style={styles.statValue}>Medium</Text>
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
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>What This Means</Text>
          <Text style={styles.descriptionText}>
            As an Autumn Warm, you look best in rich, earthy tones with golden
            undertones. These colors complement your natural warmth and bring
            out the best in your features.
          </Text>
          <Text style={styles.descriptionText}>
            Think warm oranges, golden yellows, deep greens, and rich browns.
            Avoid cool, icy tones that can make you look washed out.
          </Text>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Styling Tips</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>👗</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Best Colors to Wear</Text>
              <Text style={styles.tipText}>
                Terracotta, camel, olive green, rust, cream
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💄</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Makeup Recommendations</Text>
              <Text style={styles.tipText}>
                Warm coral lips, bronze eyeshadow, peachy blush
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💎</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Accessories</Text>
              <Text style={styles.tipText}>
                Gold jewelry, warm-toned metals, amber stones
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveResults}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Save Results</Text>
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
    width: (width - 84) / 3, // 3 columns with gaps
  },
  colorSwatch: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  recommendationsContainer: {
    paddingHorizontal: 30,
    marginBottom: 140,
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
