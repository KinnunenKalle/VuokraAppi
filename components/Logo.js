import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Svg, Path } from "react-native-svg";

export default function Logo({ size = 64 }) {
  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        style={styles.icon}
      >
        {/* Talon ääriviivat */}
        <Path
          d="M32 10L12 26v24a2 2 0 002 2h36a2 2 0 002-2V26L32 10z"
          stroke="#60A5FA"
          strokeWidth="3"
          fill="none"
        />

        {/* Sydän keskellä taloa */}
        <Path
          d="M32 30
             c-2.5-3-8-2.5-8 2
             c0 3.5 3 6 8 10
             c5-4 8-6.5 8-10
             c0-4.5-5.5-5-8-2
             z"
          fill="#F87171"
        />
      </Svg>

      {/* VuokraAppi -teksti */}
      <Text style={styles.text}>VuokraAppi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "sans-serif",
    }),
  },
});
