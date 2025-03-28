'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HexagonBackgroundProps {
  className?: string;
  density?: number;
  opacity?: number;
  animate?: boolean;
  color?: string;
}

const HexagonBackground: React.FC<HexagonBackgroundProps> = ({
  className = '',
  density = 20,
  opacity = 0.1,
  animate = true,
  color = '#4F8BFF',
}) => {
  const [hexagons, setHexagons] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      rotation: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    const newHexagons = Array.from({ length: density }).map((_, index) => ({
      id: index,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 80 + 40,
      rotation: Math.random() * 360,
      delay: Math.random() * 5,
    }));
    setHexagons(newHexagons);
  }, [density]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {hexagons.map((hexagon) => (
        <motion.div
          key={hexagon.id}
          className="absolute"
          style={{
            left: `${hexagon.x}%`,
            top: `${hexagon.y}%`,
            opacity: opacity,
          }}
          initial={animate ? { opacity: 0, scale: 0.8 } : {}}
          animate={
            animate
              ? {
                  opacity: opacity,
                  scale: [0.8, 1.1, 1],
                  rotate: [hexagon.rotation, hexagon.rotation + 10, hexagon.rotation],
                }
              : {}
          }
          transition={{
            duration: 3,
            delay: hexagon.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          <svg
            width={hexagon.size}
            height={hexagon.size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
              stroke={color}
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export default HexagonBackground;
