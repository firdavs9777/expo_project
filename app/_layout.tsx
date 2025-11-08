import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Welcome/Language Selection */}
      <Stack.Screen name="index" />

      {/* Auth Screens */}
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/welcome" />

      {/* Onboarding Screens */}
      <Stack.Screen name="onboarding/preparation" />
      <Stack.Screen name="onboarding/camera-profile" />
      <Stack.Screen name="onboarding/results" />

      {/* Main App (Tabs) */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
