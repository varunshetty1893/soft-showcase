"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

interface ScrollFadeProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  viewportMargin?: string;
  once?: boolean;
}

export function ScrollFade({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 32,
  className = "",
  viewportMargin = "-50px",
  once = true,
  ...props
}: ScrollFadeProps) {
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once,
        margin: viewportMargin,
      }}
      transition={{
        duration,
        delay,
        ease: [0.21, 1, 0.36, 1], // Smooth custom ease-out cubic
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container that staggers its immediate motion children
 */
export function ScrollFadeStagger({
  children,
  className = "",
  staggerDelay = 0.1,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const scrollFadeItemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.21, 1, 0.36, 1],
    },
  },
};
