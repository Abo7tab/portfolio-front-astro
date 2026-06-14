import React from "react"
import { MeshGradient } from "@paper-design/shaders-react"

export default function CanvasBackground() {
  const speed = 1.0;

  // Dedicated Background Palette: Separate from the site's primary colors.
  // You can change these colors manually here without affecting the main site theme.
  const backgroundPalette = [
    "#000000", // Black
    "#031B28", // Very dark blue/cyan mix
    "#000000", // Black
    "#013A40"  // Deep dark teal
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        backgroundColor: "#000000",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          animation: "breatheBlack 8s ease-in-out infinite"
        }}
      >
        <MeshGradient
          colors={backgroundPalette}
          speed={speed * 0.5}
          style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        />
      </div>

      <style>{`
        @keyframes breatheBlack {
          0%, 100% { opacity: 0.9; }
          45%, 55% { opacity: 0.05; }
        }
      `}</style>
    </div>
  )
}
