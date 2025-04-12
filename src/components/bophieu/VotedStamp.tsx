import { motion } from 'framer-motion';

interface VotedStampProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'red' | 'green' | 'blue' | 'gradient';
  text?: string;
}

const VotedStamp: React.FC<VotedStampProps> = ({
  size = 'medium',
  color = 'gradient',
  text = 'ĐÃ BỎ PHIẾU',
}) => {
  // Kích thước dựa trên prop size
  const dimensions = {
    small: {
      width: 150,
      height: 80,
      fontSize: 'text-lg',
      borderWidth: 'border-4',
      padding: 'px-3 py-1',
    },
    medium: {
      width: 220,
      height: 120,
      fontSize: 'text-2xl',
      borderWidth: 'border-6',
      padding: 'px-4 py-2',
    },
    large: {
      width: 280,
      height: 150,
      fontSize: 'text-3xl',
      borderWidth: 'border-8',
      padding: 'px-6 py-3',
    },
  };

  // Màu sắc dựa trên prop color
  const colorStyles = {
    red: {
      bgFill: '#EF4444',
      textColor: 'text-red-600 dark:text-red-500',
      border: 'border-red-600 dark:border-red-500',
      fillOpacity: '0.25',
    },
    green: {
      bgFill: '#10B981',
      textColor: 'text-green-600 dark:text-green-500',
      border: 'border-green-600 dark:border-green-500',
      fillOpacity: '0.2',
    },
    blue: {
      bgFill: '#3B82F6',
      textColor: 'text-blue-600 dark:text-blue-500',
      border: 'border-blue-600 dark:border-blue-500',
      fillOpacity: '0.2',
    },
    gradient: {
      bgFill: 'url(#stamp-gradient)',
      textColor: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-red-600',
      border: 'border-purple-600 dark:border-red-500',
      fillOpacity: '0.2',
    },
  };

  const { width, height, fontSize, borderWidth, padding } = dimensions[size];
  const { bgFill, textColor, border, fillOpacity } = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -25, scale: 1.5 }}
      animate={{ opacity: 1, rotate: -25, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        duration: 0.6,
      }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
    >
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="opacity-90"
        >
          <defs>
            <filter id="blur-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <linearGradient id="stamp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={bgFill}
            fillOpacity={fillOpacity}
            filter="url(#blur-filter)"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg]">
          <div
            className={`font-bold ${fontSize} ${textColor} ${borderWidth} ${border} ${padding} rounded-lg shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm`}
          >
            {text}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VotedStamp;
