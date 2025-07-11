import React from "react";
import { Svg, Path, Rect } from "react-native-svg";

export default function Logo({ size = 64 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 10L12 26v24a2 2 0 002 2h36a2 2 0 002-2V26L32 10z"
        stroke="#f8fafc"
        strokeWidth="3"
        fill="#3b82f6"
      />
      <Path
        d="M32 38s-4-3.2-4-6a4 4 0 018 0c0 2.8-4 6-4 6z"
        fill="#fef3c7"
        stroke="#fbbf24"
        strokeWidth="1.5"
      />
      <Rect x="48" y="18" width="4" height="20" rx="2" fill="#0ea5e9" />
    </Svg>
  );
}
