import React, { useEffect, useState } from "react"
import { MeshGradient } from "@paper-design/shaders-react"

export default function CanvasBackground() {
  const speed = 1.0;

  const [colors, setColors] = useState(["#000000", "#031B28", "#000000", "#013A40"]);

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      let bgAccent = getComputedStyle(root).getPropertyValue('--bg-accent').trim();
      if (!bgAccent) {
         bgAccent = "#031B28";
      }
      
      setColors(["#000000", bgAccent, "#000000", bgAccent]);
    };

    // Initial setup
    updateColors();

    // Listen for inline style changes on html element (e.g. from backend/theme switcher)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

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
          colors={colors}
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
