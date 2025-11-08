import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/welcome" />
      <Stack.Screen name="onboarding/preparation" />
      <Stack.Screen name="onboarding/camera-profile" />
      <Stack.Screen name="onboarding/results" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
