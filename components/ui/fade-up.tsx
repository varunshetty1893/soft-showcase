// components/ui/fade-up.tsx
"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}

/**
 * Scroll-triggered FadeUp wrapper powered by motion/react.
 * Defaults to `once: false` so elements animate smoothly on every scroll into view.
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  duration = 0.55,
  y = 28,
  once = false,
  amount = 0.15,
}: FadeUpProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount, margin: "0px 0px -30px 0px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
