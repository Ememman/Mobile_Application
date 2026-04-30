import React from "react";
import { Text, Image } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

export function GradientText({
  children,
  style,
}: {
  children: string;
  style?: any;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>
          {children}
        </Text>
      }>
      <LinearGradient
        colors={["#76C4FF", "#0449D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        {/* Invisible text just to size the gradient */}
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export function GradientIcon({
  source,
  size = 24,
}: {
  source: any;
  size?: number;
}) {
  return (
    <MaskedView
      maskElement={
        <Image
          source={source}
          style={{ width: size, height: size, tintColor: "black" }}
          resizeMode="contain"
        />
      }>
      <LinearGradient
        colors={["#76C4FF", "#0449D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
}
