import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { AuthProvider } from "@/contexts/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#000000",
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#e0e0e0",
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarInactiveTintColor: "#666666",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          tabBarActiveLabelStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="outfit-swipe"
          options={{
            title: "For You",
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={24} 
                name={focused ? "rectangle.stack.fill" : "rectangle.stack"} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            title: "Wardrobe",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="tshirt" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="person" color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}
