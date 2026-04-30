import { Tabs } from "expo-router";
import { View, Image, Text } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { AuthProvider } from "@/app/lib/authContext";

export default function StaffTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#3D87E9",
            tabBarInactiveTintColor: "transparent",
            tabBarStyle: {
              backgroundColor: "#1E1E1E",
              borderTopWidth: 0,
              height: 60 + insets.bottom,
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
            name="home"
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

          {/* Attendance */}
          <Tabs.Screen
            name="attendance"
            options={{
              title: "Attendance",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>
                    Attendance
                  </Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.gps}
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

          {/* Middle Floating Button - Appointments */}
          <Tabs.Screen
            name="appointments"
            options={{
              title: "",
              tabBarLabel: () => null,
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    position: "absolute",
                    top: -30,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "#1E1E1E",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#3D87E9",
                      shadowOpacity: focused ? 0.9 : 0.6,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 12,
                    }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 50,
                        backgroundColor: focused ? "#0066FF" : "#1E1E1E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <Image
                        source={icons.appointments}
                        style={{
                          width: 26,
                          height: 26,
                          tintColor: "#FFFFFF",
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </View>
              ),
            }}
          />

          {/* Training Modules */}
          <Tabs.Screen
            name="training"
            options={{
              title: "Training",
              tabBarLabel: ({ focused }) =>
                focused ? (
                  <Text style={{ color: "#3D87E9", fontSize: 11 }}>
                    Training
                  </Text>
                ) : null,
              tabBarIcon: ({ focused }) => (
                <Image
                  source={icons.modules}
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

          {/* Hidden Routes */}
          <Tabs.Screen name="leaderboards" options={{ href: null }} />
          <Tabs.Screen name="favorites" options={{ href: null }} />
        </Tabs>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
