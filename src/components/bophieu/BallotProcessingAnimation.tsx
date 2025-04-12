// Component BallotProcessingAnimation - Tạo file mới BallotProcessingAnimation.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NFTBallotPreview from '../election-session-manager/NFTBallotPreview';
import VotedStamp from './VotedStamp';
import { Check, Shield, Loader2 } from 'lucide-react';

interface BallotProcessingAnimationProps {
  ballot: any;
  candidate: any;
  onProcessingComplete?: () => void;
  processingTime?: number; // Thời gian xử lý tính bằng milliseconds
}

const BallotProcessingAnimation: React.FC<BallotProcessingAnimationProps> = ({
  ballot,
  candidate,
  onProcessingComplete,
  processingTime = 5000, // Mặc định 5 giây
}) => {
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [isStampVisible, setIsStampVisible] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [statusMessages, setStatusMessages] = useState<string[]>([
    'Đang khởi tạo giao dịch...',
    'Đang gửi phiếu bầu lên blockchain...',
    'Đang xác nhận bởi mạng...',
    'Đang đóng dấu phiếu bầu...',
    'Hoàn tất xác nhận phiếu bầu!',
  ]);
  const [currentStatusIndex, setCurrentStatusIndex] = useState<number>(0);

  // Animation timeline
  useEffect(() => {
    // Stage 0: Initial state
    const stage1Timeout = setTimeout(() => {
      setAnimationStage(1); // Start processing
      setCurrentStatusIndex(1);
    }, 1000);

    // Stage 1: Show processing
    const stage2Timeout = setTimeout(() => {
      setAnimationStage(2); // Prepare for stamp
      setCurrentStatusIndex(2);
    }, processingTime * 0.4);

    // Stage 2: Show stamp animation
    const stampTimeout = setTimeout(() => {
      setIsStampVisible(true);
      setCurrentStatusIndex(3);
    }, processingTime * 0.6);

    // Stage 3: Complete
    const completeTimeout = setTimeout(() => {
      setAnimationStage(3); // Complete
      setCurrentStatusIndex(4);
      if (onProcessingComplete) {
        setTimeout(onProcessingComplete, 1500);
      }
    }, processingTime * 0.9);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / (processingTime / 100);
      });
    }, 100);

    return () => {
      clearTimeout(stage1Timeout);
      clearTimeout(stage2Timeout);
      clearTimeout(stampTimeout);
      clearTimeout(completeTimeout);
      clearInterval(progressInterval);
    };
  }, [processingTime, onProcessingComplete]);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột phiếu bầu với hiệu ứng đóng dấu */}
        <div className="relative">
          <motion.div
            initial={{ filter: 'blur(0px)' }}
            animate={{
              filter: isStampVisible ? 'blur(1px)' : 'blur(0px)',
              scale: isStampVisible ? 0.98 : 1,
            }}
            transition={{ duration: 0.5 }}
            className="rounded-xl overflow-hidden"
          >
            <NFTBallotPreview
              name={ballot?.metadata?.name || `Phiếu bầu cử #${ballot?.tokenId}`}
              description={
                ballot?.metadata?.description || 'Phiếu bầu cử chính thức cho phiên bầu cử'
              }
              imageUrl={
                ballot?.metadata?.image ||
                'https://placehold.co/300x300/e2e8f0/667085?text=Ballot+Image'
              }
              attributes={ballot?.metadata?.attributes || []}
              backgroundColor={ballot?.metadata?.background_color || 'f8f9fa'}
              isUsed={isStampVisible}
            />
          </motion.div>

          {/* Hiệu ứng đóng dấu animation */}
          <AnimatePresence>
            {isStampVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 2, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  stiffness: 100,
                  mass: 1,
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <VotedStamp size="medium" color={animationStage === 3 ? 'gradient' : 'red'} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cột thông tin xử lý */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className={animationStage === 3 ? 'hidden' : ''}
              >
                <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              </motion.div>
              {animationStage === 3 && (
                <Check className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              )}
              Tiến trình xác nhận giao dịch
            </h3>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {statusMessages[currentStatusIndex]}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.min(Math.round(processingProgress), 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(processingProgress, 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                />
              </div>
            </div>

            {/* Thông tin ứng viên */}
            <div className="bg-gray-50/80 dark:bg-gray-900/50 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Ứng viên đã chọn
              </h4>
              {candidate && (
                <div className="flex items-center bg-white/70 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center text-gray-900 dark:text-white">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mr-3">
                      {animationStage >= 2 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="h-4 w-4" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{candidate.hoTen}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {candidate.viTriUngCu?.tenViTriUngCu || 'Chưa phân loại'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin blockchain */}
            <div className="mt-4 bg-blue-50/70 dark:bg-blue-900/20 rounded-lg p-4 flex items-center">
              <Shield className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Giao dịch blockchain an toàn
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {animationStage >= 3
                    ? 'Giao dịch đã được xác nhận trên blockchain. Phiếu bầu của bạn được bảo mật và minh bạch.'
                    : 'Phiếu bầu của bạn đang được xác nhận bởi mạng blockchain. Vui lòng không tắt trình duyệt.'}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction steps */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Các bước xác nhận
            </h4>

            <div className="space-y-3">
              {statusMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    index <= currentStatusIndex
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full mr-2 flex items-center justify-center
                    ${
                      index < currentStatusIndex
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : index === currentStatusIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }
                  `}
                  >
                    {index < currentStatusIndex ? (
                      <Check className="h-3 w-3" />
                    ) : index === currentStatusIndex ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-3 w-3" />
                      </motion.div>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm">{message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BallotProcessingAnimation;
