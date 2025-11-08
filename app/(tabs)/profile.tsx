import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  // Handle menu item press - redirect to login if not logged in
  const handleMenuPress = (action: () => void) => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please log in to access this feature", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log In",
          onPress: () => router.push("/login"),
        },
      ]);
      return;
    }
    // User is logged in, execute the action
    action();
  };

  // Display data based on login status
  const displayData =
    isLoggedIn && user
      ? {
          name: user.email.split("@")[0] || "User", // Use part of email as name
          email: user.email,
          avatar: `https://i.pravatar.cc/300?u=${user.user_id}`, // Unique avatar per user
          colorSeason: "Autumn Warm", // TODO: Fetch from backend
          undertone: "Warm",
          contrast: "Medium",
        }
      : {
          name: "Guest User",
          email: "guest@example.com",
          avatar: "https://i.pravatar.cc/300?img=0",
          colorSeason: "Not analyzed",
          undertone: "Unknown",
          contrast: "Unknown",
        };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Logged Out", "You have been logged out successfully");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: displayData.avatar }} style={styles.avatar} />
            {!isLoggedIn && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestText}>Guest</Text>
              </View>
            )}
          </View>

          {/* Name & Email */}
          <Text style={styles.name}>{displayData.name}</Text>
          <Text style={styles.email}>{displayData.email}</Text>

          {/* Login Button if not logged in */}
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          )}

          {/* Color Analysis Info - only if logged in */}
          {isLoggedIn && (
            <View style={styles.analysisContainer}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Color Season</Text>
                <Text style={styles.analysisValue}>
                  {displayData.colorSeason}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Undertone</Text>
                <Text style={styles.analysisValue}>
                  {displayData.undertone}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Contrast</Text>
                <Text style={styles.analysisValue}>{displayData.contrast}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              handleMenuPress(() => router.push("/(tabs)/wardrobe"))
            }
          >
            <Text style={styles.menuIcon}>👗</Text>
            <Text style={styles.menuText}>My Wardrobe</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert(
                  "Login Required",
                  "Please log in to access this feature",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Log In",
                      onPress: () => router.push("/login"),
                    },
                  ]
                );
                return;
              }
              router.push("/liked-items");
            }}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={styles.menuText}>Liked Items</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress(() => console.log("Order History"))}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>Order History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              handleMenuPress(() => console.log("Brand Preferences"))
            }
          >
            <Text style={styles.menuIcon}>🏷️</Text>
            <Text style={styles.menuText}>Brand Preferences</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress(() => console.log("Settings"))}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/onboarding/camera-profile")}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>
              {isLoggedIn ? "Retake Analysis" : "Take Color Analysis"}
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button - only show if logged in */}
        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  shareIcon: {
    color: "#fff",
    fontSize: 20,
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 20,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
  },
  guestBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  analysisContainer: {
    width: "100%",
    marginTop: 10,
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  analysisLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  analysisValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  menuContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  menuArrow: {
    fontSize: 24,
    color: "#999",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  logoutText: {
    color: "#FF6B35",
    fontSize: 16,
    fontWeight: "bold",
  },
});
