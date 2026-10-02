"use client";

import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/**
 * ScrollCurve — a subtle, full-page sweeping bezier stroke that draws itself
 * as the user scrolls through the results section.
 * Inspired by lusion.co's scroll-driven line effect.
 * 
 * Rendered at the PAGE level (not inside the max-w container) so it spans
 * edge-to-edge across the full viewport width.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Tight spring so it follows scroll precisely (Lenis handles smoothing)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 50,
    restDelta: 0.0001,
  });

  const pathLength = useTransform(smoothProgress, [0, 1], [0, 1]);
  // Completely invisible until scrolling actually starts
  const opacity = useTransform(smoothProgress, [0, 0.005, 0.06], [0, 0, 1]);

  // Full-width sweeping path starting from the far left edge,
  // curving across the full viewport, and ending at the bottom.
  // ViewBox 0 0 1440 4000 — the SVG stretches to fill the container.
  const curvePath = [
    "M -80,0",               // Start off-screen left
    "C 100,250 400,400 720,500",   // Sweep to center
    "C 1040,600 1500,550 1540,900", // Sweep to far right
    "C 1580,1250 900,1300 600,1500", // Curve back left
    "C 300,1700 -80,1800 50,2100",   // Far left again
    "C 180,2400 800,2500 1100,2700", // Sweep right
    "C 1400,2900 1540,3200 1440,3600", // To far right
    "C 1340,4000 700,3900 400,4200"    // Extend to bottom
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
        style={{ pathLength, opacity }}
      />
      {/* Mid glow */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 120, 60, 0.06)"
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength, opacity }}
      />
      {/* Core line */}
      <motion.path
        d={curvePath}
        stroke="rgba(255, 77, 21, 0.13)"
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength, opacity }}
      />
    </svg>
  );
}
