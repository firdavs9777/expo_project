import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)/profile");
    }
  }, [isLoggedIn, isLoading, router]);
  
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    // Navigate to preparation screen
    router.push("/onboarding/preparation");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Label */}
      <Text style={styles.topLabel}>Language Select</Text>

      {/* White Card */}
      <View style={styles.card}>
        {/* Brand Name */}
        <Text style={styles.brandName}>STYLERX</Text>

        {/* Instructional Text */}
        <Text style={styles.instructionText}>Choose your language.</Text>

        {/* Language Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => handleLanguageSelect("en")}
            activeOpacity={0.8}
          >
            <Text style={styles.languageButtonText}>ENGLISH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => handleLanguageSelect("ko")}
            activeOpacity={0.8}
          >
            <Text style={styles.languageButtonText}>한국어</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E5E5",
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  topLabel: {
    fontSize: 14,
    color: "#999999",
    alignSelf: "flex-start",
    marginBottom: 20,
    marginLeft: 10,
  },
  card: {
    width: width - 40,
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  brandName: {
    fontSize: 48,
    fontWeight: "400",
    color: "#000000",
    letterSpacing: 8,
    marginBottom: 30,
    fontFamily: "serif",
  },
  instructionText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 40,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  languageButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.5,
  },
});
