import { Tabs } from "expo-router";
import { CardProvider } from "../context/CardContext";
import { SessionProvider } from "@/hooks/useAuth";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TopHeader from "@/components/topHeader";
import { Platform } from "react-native";
import { TAB_ROUTES } from "@/constants/tabRoutes";
export default function RootLayout() {
  return (
    <SessionProvider>
      <CardProvider>
        <Tabs
          screenOptions={{
            header: ({ navigation, route, options }) => (
              <TopHeader navigation={navigation} route={route} options={options} />
            ),
            tabBarStyle: Platform.select({
              web: { display: 'none' },
              default: { display: 'flex' }, // Shows on iOS and Android
            }),
          }}

        >
          {TAB_ROUTES.map((route) => (
            <Tabs.Screen
              key={route.name}
              name={route.name}
              options={{ title: route.label }}
            />
          ))}

          <Tabs.Screen
            name="login"
            options={{
              headerShown: false,
              href: null,
              tabBarStyle: { display: 'none' }
            }}
          />
        </Tabs>
      </CardProvider>
    </SessionProvider>
  );
}