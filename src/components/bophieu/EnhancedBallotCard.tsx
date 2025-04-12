import React from 'react';
import { motion } from 'framer-motion';
import NFTBallotPreview from '../election-session-manager/NFTBallotPreview';
import VotedStamp from './VotedStamp';

interface EnhancedBallotCardProps {
  ballot: {
    tokenId: number;
    tokenURI: string;
    processedURI: string;
    metadata: any;
    isUsed: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  showDetails?: boolean;
}

const EnhancedBallotCard: React.FC<EnhancedBallotCardProps> = ({
  ballot,
  isSelected,
  onSelect,
  showDetails = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-xl overflow-hidden transition-all duration-300
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/20' : 'shadow hover:shadow-md'}
        ${ballot.isUsed ? 'opacity-85' : 'hover:shadow-lg'}
      `}
      onClick={() => !ballot.isUsed && onSelect()}
    >
      {/* Glass overlay for used ballots */}
      {ballot.isUsed && (
        <div className="absolute inset-0 bg-gray-500/5 dark:bg-gray-900/10 backdrop-blur-[1px] z-10 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100/10 to-gray-300/10 dark:from-gray-800/10 dark:to-gray-900/10"></div>
        </div>
      )}

      {/* Voted stamp (when ballot is used) */}
      {ballot.isUsed && <VotedStamp size={showDetails ? 'medium' : 'small'} color="gradient" />}

      {/* Ballot Preview */}
      <div
        className={`${ballot.isUsed ? '' : 'hover:scale-[1.01] transition-transform duration-300'}`}
      >
        <NFTBallotPreview
          name={ballot.metadata?.name || `Phiếu bầu cử #${ballot.tokenId}`}
          description={ballot.metadata?.description || 'Phiếu bầu cử chính thức cho phiên bầu cử'}
          imageUrl={
            ballot.metadata?.image || 'https://placehold.co/300x300/e2e8f0/667085?text=Ballot+Image'
          }
          attributes={ballot.metadata?.attributes || []}
          backgroundColor={ballot.metadata?.background_color || 'f8f9fa'}
          isUsed={ballot.isUsed}
        />
      </div>

      {/* Selected indicator */}
      {isSelected && !ballot.isUsed && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center z-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Used badge */}
      {ballot.isUsed && (
        <div className="absolute top-2 left-2 bg-red-500/90 text-white text-xs font-medium px-2 py-1 rounded shadow z-20">
          Đã sử dụng
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedBallotCard;
