import { Tabs } from "expo-router";
import { CardProvider } from "./context/CardContext";
import { SessionProvider } from "@/hooks/useAuth";

export default function RootLayout() {
  return (
    <SessionProvider>
      <CardProvider>
        <Tabs>
          <Tabs.Screen name="index" options={{ title: "Home", tabBarLabel: "Home" }} />
          <Tabs.Screen name="about" options={{ title: "About", tabBarLabel: "About" }} />
          <Tabs.Screen name="collection" options={{ title: "Collection", tabBarLabel: "Collection" }} />
        </Tabs>
      </CardProvider>
    </SessionProvider>
  );
}