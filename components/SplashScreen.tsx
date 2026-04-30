"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SplashScreenProps {
  logoSource: any;
  onAnimationComplete?: () => void;
}

const SalonSplashScreen: React.FC<SplashScreenProps> = ({
  logoSource,
  onAnimationComplete,
}) => {
  const logoScale = useRef(new Animated.Value(0.24)).current;
  const logoTranslateX = useRef(new Animated.Value(0)).current;
  const textSlideX = useRef(new Animated.Value(screenWidth)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const [, setCurrentStage] = useState(0);

  useEffect(() => {
    const animationSequence = () => {
      const logoAppear = Animated.spring(logoOpacity, {
        toValue: 1,
        stiffness: 400,
        damping: 30,
        mass: 1,
        useNativeDriver: true,
      });

      const logoGrowToMedium = Animated.spring(logoScale, {
        toValue: 0.73,
        stiffness: 400,
        damping: 30,
        mass: 1,
        useNativeDriver: true,
      });

      const logoGrowToFinal = Animated.spring(logoScale, {
        toValue: 1,
        stiffness: 400,
        damping: 30,
        mass: 1,
        useNativeDriver: true,
      });

      // FINAL STAGE: Logo shrinks + slides LEFT, Text slides from RIGHT
      // BOTH STAY IN CENTER AREA
      const finalPositioning = Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 0.40, // MAS MALAKI pa ulit
          stiffness: 400,
          damping: 30,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(logoTranslateX, {
          toValue: -100, // Iusog pa LEFT para balanced
          stiffness: 400,
          damping: 30,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideX, {
          toValue: 70, // Adjust para balanced yung spacing
          stiffness: 400,
          damping: 30,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(textOpacity, {
          toValue: 1,
          stiffness: 400,
          damping: 30,
          mass: 1,
          useNativeDriver: true,
        }),
      ]);

      setCurrentStage(1);
      logoAppear.start(() => {
        setTimeout(() => {
          setCurrentStage(2);
          logoGrowToMedium.start(() => {
            setTimeout(() => {
              setCurrentStage(3);
              logoGrowToFinal.start(() => {
                setTimeout(() => {
                  setCurrentStage(4);
                  finalPositioning.start(() => {
                    if (onAnimationComplete) {
                      setTimeout(onAnimationComplete, 1500);
                    }
                  });
                }, 1);
              });
            }, 1);
          });
        }, 1);
      });
    };

    animationSequence();
  }, [
    logoScale,
    logoTranslateX,
    textSlideX,
    textOpacity,
    logoOpacity,
    onAnimationComplete,
  ]);

  return (
    <>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <View style={styles.centerWrapper}>
          {/* LOGO - stays in center, slides left slightly */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { translateX: logoTranslateX },
                ],
              },
            ]}>
            <Image
              source={logoSource}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* TEXT - slides from right to center, SLIGHTLY LOWER */}
          <Animated.View
            style={[
              styles.textWrapper,
              {
                transform: [
                  { translateX: textSlideX },
                  { translateY: 8 }, // IBABA ng konti yung text
                ],
                opacity: textOpacity,
              },
            ]}>
            <Text style={styles.salonText}>SALON</Text>
          </Animated.View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1A35",
    justifyContent: "center",
    alignItems: "center",
    width: screenWidth,
    height: screenHeight,
  },
  centerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: screenWidth,
    height: screenHeight,
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 412,
    height: 412,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  textWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  salonText: {
    color: "#7DB3E8",
    fontSize: 46, // LAKIHAN PA ulit
    fontWeight: "600",
    fontFamily: "TenaliRamakrishna-Regular",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default SalonSplashScreen;
