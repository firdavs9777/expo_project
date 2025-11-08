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

const { height } = Dimensions.get("window");

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  // ✅ Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)/profile");
    }
  }, [isLoggedIn, isLoading, router]);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setTimeout(() => {
      router.push("/(tabs)/profile");
    }, 300);
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🎨</Text>
        </View>
      </View>

      {/* Welcome Text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>
          Select your preferred language.
        </Text>
      </View>

      {/* Language Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.languageButton, styles.primaryLanguageButton]}
          onPress={() => handleLanguageSelect("ko")}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryLanguageText}>한국어</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.languageButton, styles.secondaryLanguageButton]}
          onPress={() => handleLanguageSelect("en")}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryLanguageText}>English</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 30,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: height * 0.15,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 40,
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 60,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  buttonContainer: {
    flex: 1,
  },
  languageButton: {
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryLanguageButton: {
    backgroundColor: "#FF6B35",
  },
  secondaryLanguageButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  primaryLanguageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryLanguageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
