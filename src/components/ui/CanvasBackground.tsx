import React from "react"
import { MeshGradient } from "@paper-design/shaders-react"

export default function CanvasBackground() {
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
        colors={["#000000", "#050505", "#0a0a0a", "#121212"]}
        speed={speed * 0.5}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      />
    </div>
  )
}
