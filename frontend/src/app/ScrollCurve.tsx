"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

/**
 * ScrollCurve — draws a sweeping bezier as the user scrolls.
 * 
 * Fix: delays mount by 800ms so scroll position has settled after
 * the results animation, then uses clean scroll tracking.
 */
function ScrollCurveInner({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start 0.3", "end end"],
  });

  const [hasScrolled, setHasScrolled] = useState(false);

  // Prevent the curve from appearing until the user actually scrolls down.
  // This completely fixes the layout-glitch when switching tabs.
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50 && !hasScrolled) {
      setHasScrolled(true);
    } else if (latest <= 50 && hasScrolled) {
      setHasScrolled(false);
    }
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

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
    <motion.svg
      viewBox="0 0 1440 4200"
      fill="none"
      preserveAspectRatio="none"
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: hasScrolled ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeIn" }}
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
    </motion.svg>
  );
}

/**
 * Wrapper that delays mounting the inner component by 800ms
 * so the page layout has fully settled after the results animation.
 * This prevents any initial flash.
 */
export default function ScrollCurve({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;
  return <ScrollCurveInner containerRef={containerRef} />;
}
