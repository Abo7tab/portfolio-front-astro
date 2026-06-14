import React, { useEffect, useState } from "react"
import { MeshGradient } from "@paper-design/shaders-react"

export default function CanvasBackground() {
  const speed = 1.0;
  const [colors, setColors] = useState(["#000000", "#06b6d4", "#000000", "#035968"]);

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      let accent = getComputedStyle(root).getPropertyValue('--accent').trim();
      if (!accent) {
         accent = "#06b6d4";
      }
      setColors(["#000000", accent, "#000000", accent]);
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
      <MeshGradient
        colors={colors}
        speed={speed * 0.5}
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      />
    </div>
  )
}
