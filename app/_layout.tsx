import { Tabs } from "expo-router";
import { CardProvider } from "./context/CardContext";
import { SessionProvider } from "@/hooks/useAuth";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TopHeader from "@/components/topHeader";

export default function RootLayout() {
  return (
    <SessionProvider>
      <CardProvider>
        <Tabs>
          <Tabs.Screen name="index" options={{
            title: "Home", tabBarLabel: "Home", header: ({ navigation, route, options }) => <TopHeader navigation={navigation} route={route} options={options} /> }} />
          <Tabs.Screen name="about" options={{ title: "About", tabBarLabel: "About", header: ({ navigation, route, options }) => <TopHeader navigation={navigation} route={route} options={options} /> }} />
          <Tabs.Screen name="collection" options={{ title: "Collection", tabBarLabel: "Collection", header: ({ navigation, route, options }) => <TopHeader navigation={navigation} route={route} options={options} /> }} />
          <Tabs.Screen name="login" options={{ title: "Login", tabBarLabel: "Login", href: null, headerShown: false, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="cards" options={{ title: "Cards", tabBarLabel: "Cards", header: ({ navigation, route, options }) => <TopHeader navigation={navigation} route={route} options={options} /> }} />
        </Tabs>
      </CardProvider>
    </SessionProvider>
  );
}