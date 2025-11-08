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
      router.replace("/"); // Replace with your main app route
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Text */}
      <Text style={styles.headerText}>Welcome</Text>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Logo */}
        <Text style={styles.logo}>StyleX</Text>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>Choose your language.</Text>

        {/* Language Selection Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => {
              // Handle English selection
              setAgreedToTerms(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.languageButtonText}>ENGLISH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => {
              // Handle Korean selection
              setAgreedToTerms(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.languageButtonText}>한국어</Text>
          </TouchableOpacity>
        </View>

        {/* Terms Section */}
        <View style={styles.termsContainer}>
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
            <Text style={styles.checkboxText}>
              I agree to the <Text style={styles.link}>Privacy Policy</Text> &{" "}
              <Text style={styles.link}>Terms of Service</Text>
            </Text>
          </TouchableOpacity>

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
            <Text style={styles.checkboxText}>
              I agree to receive promotional notifications (Optional)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !agreedToTerms && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!agreedToTerms}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerText: {
    position: "absolute",
    top: 60,
    left: 30,
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: "400",
    color: "#000000",
    letterSpacing: 8,
    marginBottom: 24,
    fontFamily: "serif",
  },
  instructionText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 32,
    fontWeight: "400",
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },
  languageButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 1,
  },
  termsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxText: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 20,
    flex: 1,
  },
  link: {
    color: "#000000",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  continueButton: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#e0e0e0",
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
