import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      // Success! Navigate to main app
      router.replace("/(tabs)/profile");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Label */}
        <Text style={styles.topLabel}>Sign In/Up</Text>

        {/* White Card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>LOG IN</Text>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <View style={styles.underline} />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => console.log("Forgot password")}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>FORGOT YOUR PASSWORD?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/signup")}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E5E5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: 1,
  },
  inputWrapper: {
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  underline: {
    height: 1,
    backgroundColor: "#000000",
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-start",
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 14,
    color: "#666666",
  },
  signUpLink: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },
  termsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  termsText: {
    fontSize: 11,
    color: "#999999",
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: "#000000",
    textDecorationLine: "underline",
  },
});
