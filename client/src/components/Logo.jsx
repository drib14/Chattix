import React from 'react';

export default function Logo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.45))' }}
    >
      {/* Outer Glow Path */}
      <circle cx="50" cy="50" r="45" fill="url(#bgGrad)" opacity="0.15" />
      
      {/* Back Speech Bubble */}
      <path
        d="M65 35C65 26.7157 56.0457 20 45 20C33.9543 20 25 26.7157 25 35C25 39.4293 27.6044 43.3768 31.8158 45.9619L29 55L38.4552 50.8499C40.5255 51.5898 42.7162 52 45 52C56.0457 52 65 45.2843 65 35Z"
        fill="url(#bubblePurple)"
        opacity="0.85"
      />

      {/* Front Speech Bubble */}
      <path
        d="M75 52C75 44.268 67.3878 38 58 38C48.6122 38 41 44.268 41 52C41 56.1272 43.1979 59.8057 46.7516 62.2152L44.3846 70.6364L52.3734 66.804C54.1205 67.5855 56.0219 68 58 68C67.3878 68 75 61.732 75 52Z"
        fill="url(#bubbleCyan)"
        opacity="0.9"
      />

      {/* Lightning Spark (representing AI capability) */}
      <path
        d="M48 35L36 50H47L43 65L59 47H48L52 35Z"
        fill="#FFFFFF"
        style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.95))' }}
      />

      {/* Definitions for Gradients */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="bubblePurple" x1="25" y1="20" x2="65" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="bubbleCyan" x1="41" y1="38" x2="75" y2="68" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
