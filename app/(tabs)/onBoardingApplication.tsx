import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

interface ChecklistItem {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
}

export default function OnboardingPreparationScreen() {
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      icon: "💡",
      title: "Good Lighting is Key",
      description:
        "Position yourself in a well-lit area. Avoid harsh shadows on your face.",
      checked: false,
    },
    {
      icon: "😊",
      title: "Show Your Natural Tone",
      description:
        "Remove makeup to reveal your natural skin tone for best results.",
      checked: false,
    },
    {
      icon: "📐",
      title: "Find the Right Angle",
      description:
        "Take your photo straight on. Align your face within the oval guide.",
      checked: false,
    },
  ]);

  const [warnings] = useState([
    { icon: "🌙", text: "Glass Glare" },
    { icon: "☀️", text: "Heavy Makeup" },
    { icon: "🔴", text: "Direct Sunlight" },
    { icon: "💡", text: "Shadows on Face" },
  ]);

  const handleCheckItem = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index].checked = !newChecklist[index].checked;
    setChecklist(newChecklist);
  };

  const allChecked = checklist.every((item) => item.checked);

  const handleStartAnalysis = () => {
    router.push("/(tabs)/cameraProfile");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Prepare for Your</Text>
          <Text style={styles.title}>Personal Color Analysis</Text>
          <Text style={styles.subtitle}>
            Follow these tips to get the most accurate results.
          </Text>
        </View>

        {/* Checklist */}
        <View style={styles.checklistContainer}>
          {checklist.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.checklistItem}
              onPress={() => handleCheckItem(index)}
              activeOpacity={0.7}
            >
              <View style={styles.checklistIcon}>
                <Text style={styles.checklistEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.checklistContent}>
                <Text style={styles.checklistTitle}>{item.title}</Text>
                <Text style={styles.checklistDescription}>
                  {item.description}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  item.checked && styles.checkboxChecked,
                ]}
              >
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Warnings Section */}
        <View style={styles.warningsContainer}>
          <Text style={styles.warningsTitle}>Things to avoid:</Text>
          <View style={styles.warningsGrid}>
            {warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningIcon}>{warning.icon}</Text>
                <Text style={styles.warningText}>{warning.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !allChecked && styles.startButtonDisabled,
          ]}
          onPress={handleStartAnalysis}
          disabled={!allChecked}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start My Color Analysis</Text>
        </TouchableOpacity>
        {!allChecked && (
          <Text style={styles.checkAllText}>Check all items to continue</Text>
        )}
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
  titleContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: "#999",
    marginTop: 12,
    lineHeight: 22,
  },
  checklistContainer: {
    paddingHorizontal: 30,
    gap: 16,
    marginBottom: 40,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  checklistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  checklistEmoji: {
    fontSize: 24,
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  checklistDescription: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#666",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningsContainer: {
    paddingHorizontal: 30,
    marginBottom: 120,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  warningsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF5252",
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    fontSize: 13,
    color: "#FF5252",
    fontWeight: "500",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  startButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    backgroundColor: "#3a3a3a",
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  checkAllText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 10,
  },
});
