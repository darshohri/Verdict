"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

/**
 * ScrollCurve — a subtle, full-page sweeping bezier stroke that draws itself
 * as the user scrolls through the results section.
 * 
 * Key fix: captures the initial scroll position on mount and uses it as
 * a baseline, so the line always starts at 0 regardless of where the 
 * container is when results first load.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [isReady, setIsReady] = useState(false);
  const baselineRef = useRef<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Capture the initial scroll value as baseline, then mark ready after
  // the user has actually scrolled past it
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (baselineRef.current === null) {
      // First read — capture baseline (the initial value on mount)
      baselineRef.current = latest;
      return;
    }
    // Only become "ready" once the user has scrolled beyond the baseline
    if (!isReady && latest > baselineRef.current + 0.005) {
      setIsReady(true);
    }
  });

  // Remap: subtract baseline so line starts from 0
  const adjustedProgress = useTransform(scrollYProgress, (v) => {
    if (baselineRef.current === null) return 0;
    const baseline = baselineRef.current;
    const range = 1 - baseline;
    if (range <= 0) return 0;
    return Math.max(0, (v - baseline) / range);
  });

  const pathLength = adjustedProgress;
  const opacity = isReady ? 1 : 0;

  // Full-width sweeping path from far left, across the page, to the bottom
  const curvePath = [
    "M -80,0",
    "C 100,150 400,250 720,320",
    "C 1040,390 1500,360 1540,550",
    "C 1580,740 900,800 600,950",
    "C 300,1100 -80,1150 50,1350",
    "C 180,1550 800,1600 1100,1750",
    "C 1400,1900 1540,2050 1440,2300",
    "C 1340,2550 700,2500 400,2700",
    "C 100,2900 -50,3100 200,3350",
    "C 450,3600 1000,3700 1300,3850",
    "C 1500,3950 1540,4050 1440,4200",
  ].join(" ");

  return (
    <svg
      viewBox="0 0 1440 4200"
      fill="none"
      preserveAspectRatio="none"
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity, transition: "opacity 0.6s ease-in" }}
    >
      {/* Soft outer glow */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 120, 60, 0.035)"
        strokeWidth={100}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength }}
      />
      {/* Mid glow */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 120, 60, 0.06)"
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength }}
      />
      {/* Core line */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 77, 21, 0.13)"
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength }}
      />
    </svg>
  );
}
