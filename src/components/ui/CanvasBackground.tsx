import React from "react"
import { MeshGradient, DotOrbit } from "@paper-design/shaders-react"

export default function CanvasBackground() {
  const intensity = 1.5;
  const speed = 1.0;

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
      <MeshGradient
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0
        }}
        colors={["#000000", "#0a0a0a", "#1a1a1a", "#ffffff"]}
        speed={speed * 0.5}
        wireframe={true}
        backgroundColor="#000000"
      />
      <div 
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          opacity: 0.6
        }}
      >
        <DotOrbit
          style={{ width: "100%", height: "100%" }}
          dotColor="#333333"
          orbitColor="#1a1a1a"
          speed={speed * 1.5}
          intensity={intensity * 0.8}
        />
      </div>

      {/* Lighting overlay effects mimicking the demo */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "33%",
            width: "8rem",
            height: "8rem",
            backgroundColor: "rgba(31, 41, 55, 0.05)",
            borderRadius: "9999px",
            filter: "blur(64px)",
            animation: `pulse ${3 / speed}s infinite`
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "33%",
            right: "25%",
            width: "6rem",
            height: "6rem",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderRadius: "9999px",
            filter: "blur(40px)",
            animation: `pulse ${2 / speed}s infinite`,
            animationDelay: "1s"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "33%",
            width: "5rem",
            height: "5rem",
            backgroundColor: "rgba(17, 24, 39, 0.03)",
            borderRadius: "9999px",
            filter: "blur(24px)",
            animation: `pulse ${4 / speed}s infinite`,
            animationDelay: "0.5s"
          }}
        />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  )
}
