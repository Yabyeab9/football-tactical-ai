import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface TacticalPitchProps {
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({ children, overlay }) => {
  return (
    <div className="relative aspect-[105/68] w-full overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl ring-1 ring-white/10">
      {/* Pitch Lines */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full opacity-20"
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="9.15" fill="none" stroke="white" strokeWidth="0.5" />
        
        {/* Penalty Areas */}
        <rect x="0" y="21.1" width="17" height="57.8" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="83" y="21.1" width="17" height="57.8" fill="none" stroke="white" strokeWidth="0.5" />
        
        {/* Six Yard Boxes */}
        <rect x="0" y="36.8" width="5.8" height="26.4" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="94.2" y="36.8" width="5.8" height="26.4" fill="none" stroke="white" strokeWidth="0.5" />
      </svg>

      {/* Dynamic Content (Heatmaps, Nodes, Edges) */}
      <div className="absolute inset-0 h-full w-full">
        {children}
      </div>

      {/* Glossy Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
      
      {overlay && (
        <div className="absolute bottom-4 left-4 right-4 lg:bottom-8 lg:left-8 lg:right-8">
          {overlay}
        </div>
      )}
    </div>
  );
};

interface PitchNodeProps {
  x: number;
  y: number;
  label?: string;
  size?: number;
  color?: string;
}

export const PitchNode: React.FC<PitchNodeProps> = ({ x, y, label, size = 12, color = 'var(--primary)' }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    style={{ left: `${x}%`, top: `${y}%` }}
    className="absolute -translate-x-1/2 -translate-y-1/2"
  >
    <div
      style={{ width: size, height: size, backgroundColor: color }}
      className="rounded-full shadow-[0_0_15px_rgba(0,163,255,0.5)] ring-2 ring-white/20"
    />
    {label && (
      <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white/80">
        {label}
      </div>
    )}
  </motion.div>
);

interface PitchEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight?: number;
  color?: string;
}

export const PitchEdge: React.FC<PitchEdgeProps> = ({ x1, y1, x2, y2, weight = 1, color = 'var(--primary)' }) => (
  <svg className="absolute inset-0 h-full w-full pointer-events-none">
    <motion.line
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.4 }}
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
    />
  </svg>
);
