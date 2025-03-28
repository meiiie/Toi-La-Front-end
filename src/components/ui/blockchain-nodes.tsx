'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  connections: number[];
}

interface BlockchainNodesProps {
  nodeCount?: number;
  className?: string;
  color?: string;
  lineColor?: string;
  animate?: boolean;
}

const BlockchainNodes: React.FC<BlockchainNodesProps> = ({
  nodeCount = 10,
  className = '',
  color = '#4F8BFF',
  lineColor = '#4F8BFF',
  animate = true,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Create nodes
    const newNodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        connections: [],
      });
    }

    // Create connections (each node connects to 1-3 other nodes)
    newNodes.forEach((node, index) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < connectionCount; i++) {
        let targetIndex;
        do {
          targetIndex = Math.floor(Math.random() * nodeCount);
        } while (targetIndex === index || node.connections.includes(targetIndex));

        node.connections.push(targetIndex);
      }
    });

    setNodes(newNodes);
  }, [nodeCount, dimensions]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <svg width="100%" height="100%" className="opacity-20">
        {/* Draw connections first so they appear behind nodes */}
        {nodes.map((node) =>
          node.connections.map((targetId, i) => (
            <motion.line
              key={`${node.id}-${targetId}-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nodes[targetId]?.x}%`}
              y2={`${nodes[targetId]?.y}%`}
              stroke={lineColor}
              strokeWidth="0.5"
              strokeDasharray="5,5"
              initial={animate ? { opacity: 0 } : { opacity: 0.6 }}
              animate={
                animate
                  ? {
                      opacity: [0, 0.6, 0.3, 0.6],
                      strokeDashoffset: [0, -20],
                    }
                  : {}
              }
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          )),
        )}

        {/* Draw nodes on top of connections */}
        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.size}
            fill={color}
            initial={animate ? { opacity: 0, scale: 0 } : { opacity: 0.8 }}
            animate={
              animate
                ? {
                    opacity: [0, 0.8, 0.4, 0.8],
                    scale: [0, 1, 0.8, 1],
                  }
                : {}
            }
            transition={{
              duration: 4,
              delay: node.id * 0.2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default BlockchainNodes;
