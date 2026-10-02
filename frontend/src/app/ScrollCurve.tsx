"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ScrollCurve — a subtle, full-page sweeping bezier stroke that draws itself
 * as the user scrolls through the results section.
 * Inspired by lusion.co's scroll-driven line effect.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // "start start" = tracking starts when container top hits viewport top
    // "end end" = tracking ends when container bottom hits viewport bottom
    // This ensures full 0→1 mapping across the entire container scroll
    offset: ["start start", "end end"],
  });

  // Direct transform — no spring. Lenis already smooths the scroll,
  // and removing the spring eliminates the initial flash (spring settling).
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  // Completely invisible at 0 scroll, fades in after user starts scrolling
  const opacity = useTransform(scrollYProgress, [0, 0.01, 0.06], [0, 0, 1]);

  // Full-width sweeping path starting from the far left edge,
  // curving across the full viewport, and ending at the very bottom.
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
      style={{ zIndex: 0 }}
    >
      {/* Soft outer glow */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 120, 60, 0.035)"
        strokeWidth={100}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        style={{ pathLength, opacity }}
      />
      {/* Mid glow */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 120, 60, 0.06)"
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        style={{ pathLength, opacity }}
      />
      {/* Core line */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 77, 21, 0.13)"
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        style={{ pathLength, opacity }}
      />
    </svg>
  );
}
