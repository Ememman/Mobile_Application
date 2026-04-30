import { Tabs } from "expo-router";
import { View, Image, Text } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#3D87E9", // active blue
            tabBarInactiveTintColor: "transparent", // hide labels when inactive
            tabBarStyle: {
              backgroundColor: "#1E1E1E",
              borderTopWidth: 0,
              height: 60 + insets.bottom, // more space for floating button
              paddingBottom: 6,
              paddingTop: 6,
              borderTopLeftRadius: 50,
              borderTopRightRadius: 50,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              elevation: 10,
            },
            headerShown: false,
          }}>
          {/* Home */}
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>Home</Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.home}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? "#3D87E9" : "#9DB2CE",
                    marginTop: 6,
                  }}
                  resizeMode="contain"
                />
              ),
            }}
          />

          {/* Services */}
          <Tabs.Screen
            name="services"
            options={{
              title: "Services",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>
                    Services
                  </Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.services}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? "#3D87E9" : "#9DB2CE",
                    marginTop: 6,
                  }}
                  resizeMode="contain"
                />
              ),
            }}
          />

          {/* Middle Floating Button */}
          <Tabs.Screen
            name="appointments"
            options={{
              title: "",
              tabBarLabel: () => null, // always hidden
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    position: "absolute",
                    top: -30,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {/* Outer Circle with Glow */}
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "#1E1E1E",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#3D87E9", // blue glow
                      shadowOpacity: focused ? 0.9 : 0.6,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 12,
                    }}>
                    {/* Inner Circle */}
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 50,
                        backgroundColor: focused ? "#0066FF" : "#1E1E1E", // active blue fill
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <Image
                        source={icons.appointments}
                        style={{
                          width: 26,
                          height: 26,
                          tintColor: "#FFFFFF", // always white
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </View>
              ),
            }}
          />

          {/* Products */}
          <Tabs.Screen
            name="products"
            options={{
              title: "Products",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>
                    Products
                  </Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.products}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? "#3D87E9" : "#9DB2CE",
                    marginTop: 6,
                  }}
                  resizeMode="contain"
                />
              ),
            }}
          />

          {/* Profile */}
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>
                    Profile
                  </Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.profile}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? "#3D87E9" : "#9DB2CE",
                    marginTop: 6,
                  }}
                  resizeMode="contain"
                />
              ),
            }}
          />

          {/* Hidden Routes (no tab buttons) */}
          <Tabs.Screen name="Booking" options={{ href: null }} />
          <Tabs.Screen name="cart" options={{ href: null }} />
          <Tabs.Screen name="favorites" options={{ href: null }} />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
