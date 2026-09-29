// components/common/ConnectedSSIcon.tsx
// Connected "SS" Monogram Icon for Soft Showcase
// Features the custom ligature where both "S" letterforms are connected seamlessly with a sleek design.

import React from "react";

interface ConnectedSSIconProps {
  size?: number | string;
  className?: string;
  withBackground?: boolean;
}

export function ConnectedSSIcon({
  size = 32,
  className = "",
  withBackground = true,
}: ConnectedSSIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="Soft Showcase SS Monogram"
    >
      <defs>
        {/* Background Gradient: Deep ocean teal */}
        <linearGradient id="ssCompBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#08252B" />
          <stop offset="35%" stopColor="#114750" />
          <stop offset="70%" stopColor="#155761" />
          <stop offset="100%" stopColor="#1E7583" />
        </linearGradient>

        {/* Connected SS Monogram Gradient: Mint to Crisp White to Emerald */}
        <linearGradient id="ssCompGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="25%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#99F6E4" />
        </linearGradient>

        {/* Ligature Connection Gradient */}
        <linearGradient id="ssCompBridgeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>

        {/* Depth shadow filter */}
        <filter id="ssCompShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#2DD4BF" floodOpacity="0.35" />
        </filter>
      </defs>

      {withBackground && (
        <>
          <rect width="512" height="512" rx="120" fill="url(#ssCompBgGrad)" />
          <rect
            x="12"
            y="12"
            width="488"
            height="488"
            rx="108"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="4"
          />
          <circle
            cx="256"
            cy="256"
            r="168"
            fill="none"
            stroke="rgba(45, 212, 191, 0.08)"
            strokeWidth="24"
          />
        </>
      )}

      {/* Connected "SS" Monogram with Ligature Design */}
      <g
        filter={withBackground ? "url(#ssCompShadow)" : undefined}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* First S (Left) */}
        <path
          d="M 226 176 C 226 138, 144 138, 144 195 C 144 248, 228 252, 228 315 C 228 372, 144 372, 144 330"
          stroke="url(#ssCompGrad)"
          strokeWidth="44"
        />

        {/* Connecting Ligature Bridge linking the two S letterforms */}
        <path
          d="M 224 315 C 246 315, 266 195, 288 195"
          stroke="url(#ssCompBridgeGrad)"
          strokeWidth="38"
        />

        {/* Central Ligature Crossbar uniting both S at their core waist */}
        <path
          d="M 188 254 L 324 254"
          stroke="url(#ssCompBridgeGrad)"
          strokeWidth="40"
        />

        {/* Second S (Right) */}
        <path
          d="M 370 176 C 370 138, 288 138, 288 195 C 288 248, 372 252, 372 315 C 372 372, 288 372, 288 330"
          stroke="url(#ssCompGrad)"
          strokeWidth="44"
        />
      </g>
    </svg>
  );
}
export default ConnectedSSIcon;
