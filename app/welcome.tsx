import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeTermsScreen() {
  const router = useRouter();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPromotions, setAgreedToPromotions] = useState(false);

  const handleContinue = () => {
    if (agreedToTerms) {
      // Navigate to main app
      router.replace("/(tabs)"); // Replace with your main app route
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Decorative dot */}
        <View style={styles.decorativeDot} />

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>ColorMe!</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          To get started, please review and agree to our policies. Your data
          helps us provide personalized color analysis and outfit suggestions,
          and we are committed to handling it securely.
        </Text>

        {/* Checkbox Section */}
        <View style={styles.checkboxContainer}>
          {/* Required Agreement */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.link}>Privacy Policy</Text> &{" "}
                <Text style={styles.link}>Terms of Service</Text> (Required)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Optional Agreement */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToPromotions(!agreedToPromotions)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                agreedToPromotions && styles.checkboxChecked,
              ]}
            >
              {agreedToPromotions && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                I agree to receive promotional notifications (Optional)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !agreedToTerms && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!agreedToTerms}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Agree and Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 120,
  },
  decorativeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B35",
    alignSelf: "flex-end",
    marginBottom: 40,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: "#333",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 40,
  },
  checkboxContainer: {
    gap: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  link: {
    color: "#FF6B35",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: "#ddd",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
