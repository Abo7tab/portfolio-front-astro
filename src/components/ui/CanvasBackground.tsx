import React from "react"
import { Canvas } from "@react-three/fiber"
import { ShaderPlane, EnergyRing } from "./background-paper-shaders"

export default function CanvasBackground() {
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
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <ShaderPlane position={[0, 0, -2]} color1="#00f0ff" color2="#000000" />
        <EnergyRing position={[0, 0, 0]} radius={1.5} />
      </Canvas>
    </div>
  )
}
