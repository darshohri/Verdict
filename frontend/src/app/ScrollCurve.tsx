"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/**
 * ScrollCurve — a thick, sweeping bezier stroke that draws itself
 * as the user scrolls through the results section.
 * Inspired by lusion.co's scroll-driven line effect.
 *
 * It renders a full-viewport-width SVG pinned behind the content,
 * with the stroke's `pathLength` driven by scroll progress.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth it out so it doesn't feel jittery
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 30,
    restDelta: 0.001,
  });

  // pathLength goes from 0 → 1 as user scrolls
  const pathLength = useTransform(smoothProgress, [0, 1], [0, 1]);
  // Slight opacity fade in at the start
  const opacity = useTransform(smoothProgress, [0, 0.05, 0.15], [0, 0.6, 1]);

  // The path: a big sweeping S-curve from top-left, curving to right, 
  // then swooping back left, then finishing bottom-right.
  // ViewBox is 1440x3000 to cover a tall scrollable results area.
  const curvePath =
    "M -100,0 C 200,300 1300,200 1100,600 C 900,1000 -100,900 100,1400 C 300,1900 1400,1700 1300,2200 C 1200,2700 200,2500 400,3000";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <svg
        viewBox="0 0 1440 3000"
        fill="none"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-full"
        style={{ minHeight: "100%" }}
      >
        {/* Glow layer — wider, more transparent */}
        <motion.path
          d={curvePath}
          stroke="rgba(255, 77, 21, 0.12)"
          strokeWidth={80}
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />
        {/* Mid glow */}
        <motion.path
          d={curvePath}
          stroke="rgba(255, 77, 21, 0.2)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />
        {/* Core stroke — the main visible line */}
        <motion.path
          d={curvePath}
          stroke="#FF4D15"
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />
      </svg>
    </div>
  );
}
