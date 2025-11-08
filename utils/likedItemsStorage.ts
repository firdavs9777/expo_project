import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OutfitItem {
  ID: number;
  Description: string;
  Price: string;
  imageUrl: string;
  ColorHEX: string;
  ProductURL: string;
  ColorName: string;
  DetailDescription: string;
  Type: string;
  PersonalColorType: string;
  popularity: number;
}

export interface LikedItem extends OutfitItem {
  category: "Top" | "Bottom" | "Shoes";
  likedAt: string;
}

const LIKED_ITEMS_KEY = "liked_items";

export const saveLikedItem = async (item: OutfitItem, category: "Top" | "Bottom" | "Shoes") => {
  try {
    const likedItems = await getLikedItems();
    
    // Check if item already exists (by ID and category)
    const existingIndex = likedItems.findIndex(
      (liked) => liked.ID === item.ID && liked.category === category
    );
    
    if (existingIndex === -1) {
      // Add new liked item
      const likedItem: LikedItem = {
        ...item,
        category,
        likedAt: new Date().toISOString(),
      };
      likedItems.push(likedItem);
    }
    
    await AsyncStorage.setItem(LIKED_ITEMS_KEY, JSON.stringify(likedItems));
    return { success: true };
  } catch (error) {
    console.error("Error saving liked item:", error);
    return { success: false, error };
  }
};

export const getLikedItems = async (): Promise<LikedItem[]> => {
  try {
    const data = await AsyncStorage.getItem(LIKED_ITEMS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting liked items:", error);
    return [];
  }
};

export const getLikedItemsByCategory = async (
  category: "Top" | "Bottom" | "Shoes"
): Promise<LikedItem[]> => {
  try {
    const allItems = await getLikedItems();
    return allItems.filter((item) => item.category === category);
  } catch (error) {
    console.error("Error getting liked items by category:", error);
    return [];
  }
};

export const removeLikedItem = async (itemId: number, category: "Top" | "Bottom" | "Shoes") => {
  try {
    const likedItems = await getLikedItems();
    const filtered = likedItems.filter(
      (item) => !(item.ID === itemId && item.category === category)
    );
    await AsyncStorage.setItem(LIKED_ITEMS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error("Error removing liked item:", error);
    return { success: false, error };
  }
};

export const clearAllLikedItems = async () => {
  try {
    await AsyncStorage.removeItem(LIKED_ITEMS_KEY);
    return { success: true };
  } catch (error) {
    console.error("Error clearing liked items:", error);
    return { success: false, error };
  }
};

