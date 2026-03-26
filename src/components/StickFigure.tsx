import React from 'react';
import { motion } from 'motion/react';
import { JointPositions } from '../services/gemini';

interface StickFigureProps {
  joints: JointPositions;
  isAnimating?: boolean;
}

const StickFigure: React.FC<StickFigureProps> = ({ joints }) => {
  // Helper to scale coordinates to SVG viewbox (0-100 to 0-400)
  const s = (val: number) => val * 4;

  const {
    head, neck, lShoulder, lElbow, lWrist, rShoulder, rElbow, rWrist, spine,
    lEye, rEye, mouth, lFingers, rFingers
  } = joints;

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-w-md mx-auto drop-shadow-2xl">
      {/* Background/Floor */}
      <rect x="0" y="380" width="400" height="20" fill="#1a1a1a" opacity="0.1" />
      
      {/* Skeleton Lines */}
      <g stroke="#141414" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Spine */}
        <motion.line 
          animate={{ x1: s(neck.x), y1: s(neck.y), x2: s(spine.x), y2: s(spine.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        
        {/* Shoulders */}
        <motion.line 
          animate={{ x1: s(lShoulder.x), y1: s(lShoulder.y), x2: s(rShoulder.x), y2: s(rShoulder.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        
        {/* Left Arm */}
        <motion.line 
          animate={{ x1: s(lShoulder.x), y1: s(lShoulder.y), x2: s(lElbow.x), y2: s(lElbow.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        <motion.line 
          animate={{ x1: s(lElbow.x), y1: s(lElbow.y), x2: s(lWrist.x), y2: s(lWrist.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        
        {/* Right Arm */}
        <motion.line 
          animate={{ x1: s(rShoulder.x), y1: s(rShoulder.y), x2: s(rElbow.x), y2: s(rElbow.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        <motion.line 
          animate={{ x1: s(rElbow.x), y1: s(rElbow.y), x2: s(rWrist.x), y2: s(rWrist.y) }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />

        {/* Fingers */}
        {lFingers?.map((finger, i) => (
          <g key={`lf-group-${i}`}>
            <motion.line 
              animate={{ x1: s(lWrist.x), y1: s(lWrist.y), x2: s(finger.x), y2: s(finger.y) }}
              stroke="#141414"
              strokeWidth="4"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
            <motion.circle
              animate={{ cx: s(finger.x), cy: s(finger.y) }}
              r="3"
              fill="#9D8DF1"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </g>
        ))}
        {rFingers?.map((finger, i) => (
          <g key={`rf-group-${i}`}>
            <motion.line 
              animate={{ x1: s(rWrist.x), y1: s(rWrist.y), x2: s(finger.x), y2: s(finger.y) }}
              stroke="#141414"
              strokeWidth="4"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
            <motion.circle
              animate={{ cx: s(finger.x), cy: s(finger.y) }}
              r="3"
              fill="#9D8DF1"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </g>
        ))}
      </g>

      {/* Head */}
      <motion.circle 
        animate={{ cx: s(head.x), cy: s(head.y) }}
        r="25"
        fill="#141414"
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />

      {/* Facial Features */}
      {lEye && rEye && (
        <g fill="#E4E3E0">
          <motion.circle 
            animate={{ cx: s(lEye.x), cy: s(lEye.y) }}
            r="3"
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
          <motion.circle 
            animate={{ cx: s(rEye.x), cy: s(rEye.y) }}
            r="3"
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </g>
      )}

      {mouth && (
        <motion.ellipse
          animate={{ 
            cx: s(mouth.x), 
            cy: s(mouth.y),
            rx: s(mouth.width) / 2,
            ry: s(mouth.height) / 2
          }}
          fill="#E4E3E0"
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      )}

      {/* Joints (Dots) */}
      <g fill="#9D8DF1">
        {[neck, lShoulder, lElbow, lWrist, rShoulder, rElbow, rWrist, spine].map((joint, i) => (
          <motion.circle 
            key={i}
            animate={{ cx: s(joint.x), cy: s(joint.y) }}
            r="5"
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        ))}
      </g>
    </svg>
  );
};

export default StickFigure;
