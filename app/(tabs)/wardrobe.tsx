import { StyleSheet, Text, View } from "react-native";

export default function WardrobeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wardrobe</Text>
      <Text style={styles.subtitle}>Your saved items will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
