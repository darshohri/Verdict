"use client";

import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/**
 * ScrollCurve — a subtle, sweeping bezier stroke that draws itself
 * as the user scrolls through the results section.
 * Inspired by lusion.co's scroll-driven line effect.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Much stiffer spring so it tracks scroll tightly
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.0001,
  });

  // pathLength goes from 0 → 1 as user scrolls
  const pathLength = useTransform(smoothProgress, [0, 1], [0, 1]);
  // Completely invisible until user scrolls, then gentle fade in
  const opacity = useTransform(smoothProgress, [0, 0.01, 0.08], [0, 0, 1]);

  // Sweeping S-curve path
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
        {/* Soft outer glow — very subtle */}
        <motion.path
          d={curvePath}
          stroke="rgba(255, 120, 60, 0.04)"
          strokeWidth={90}
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />
        {/* Mid glow — light warmth */}
        <motion.path
          d={curvePath}
          stroke="rgba(255, 120, 60, 0.06)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />
        {/* Core stroke — light and subtle, not overpowering text */}
        <motion.path
          d={curvePath}
          stroke="rgba(255, 77, 21, 0.12)"
          strokeWidth={10}
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
