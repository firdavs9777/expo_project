import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface Tip {
  number: string;
  title: string;
  description: string;
}

export default function OnboardingPreparationScreen() {
  const router = useRouter();

  const tips: Tip[] = [
    {
      number: "01",
      title: "Good Lighting",
      description:
        "Find a spot with soft, natural daylight. Avoid harsh shadows or direct sun.",
    },
    {
      number: "02",
      title: "Bare Face",
      description:
        "Remove all makeup to show your natural skin tone. Tie your hair back.",
    },
    {
      number: "03",
      title: "Positioning",
      description:
        "Hold your phone straight at eye level, ensuring your face is fully in the frame.",
    },
  ];

  const handleBeginAnalysis = () => {
    router.push("/onboarding/camera-profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* White Modal Card */}
      <View style={styles.modal}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Before You Start</Text>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>
          For an accurate analysis, please follow these tips.
        </Text>

        {/* Tips List */}
        <View style={styles.tipsContainer}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipNumber}>{tip.number}</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Begin Analysis Button */}
        <TouchableOpacity
          style={styles.beginButton}
          onPress={handleBeginAnalysis}
          activeOpacity={0.8}
        >
          <Text style={styles.beginButtonText}>Begin Analysis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modal: {
    width: width - 40,
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 30,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 20,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 30,
    lineHeight: 20,
  },
  tipsContainer: {
    marginBottom: 40,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  tipNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    marginRight: 16,
    minWidth: 30,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 6,
  },
  tipDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  beginButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  beginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
