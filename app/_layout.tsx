"use client";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import SalonSplashScreen from "../components/SplashScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "TenaliRamakrishna-Regular": require("../assets/fonts/TenaliRamakrishna-Regular.ttf"),
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashComplete = () => {
    setShowCustomSplash(false);
  };

  if (!fontsLoaded) return null;

  if (showCustomSplash) {
    return (
      <SalonSplashScreen
        logoSource={require("../assets/images/SandreaLeeSalonLogoCapstone.png")}
        onAnimationComplete={handleSplashComplete}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaProvider>
  );
}
