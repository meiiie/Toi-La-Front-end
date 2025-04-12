import React from 'react';
import { Button } from '../../components/ui/Button';
import { Loader, RefreshCw, Ticket, PauseCircle, PlayCircle } from 'lucide-react';

interface VoterActionBarProps {
  selectedVotersCount: number;
  isRefreshingList: boolean;
  isSendingBulkTickets: boolean;
  isPaused: boolean;
  sessionActive: boolean;
  sessionKeyAvailable: boolean;
  onRefresh: () => void;
  onSendBallots: () => void;
  onClearSelection: () => void;
}

const VoterActionBar: React.FC<VoterActionBarProps> = ({
  selectedVotersCount,
  isRefreshingList,
  isSendingBulkTickets,
  isPaused,
  sessionActive,
  sessionKeyAvailable,
  onRefresh,
  onSendBallots,
  onClearSelection,
}) => {
  return (
    <div className="flex justify-between items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="h-9"
        disabled={isRefreshingList}
      >
        {isRefreshingList ? (
          <Loader className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1" />
        )}
        <span>Làm mới</span>
      </Button>

      <Button
        size="sm"
        disabled={
          selectedVotersCount === 0 ||
          isSendingBulkTickets ||
          !sessionActive ||
          !sessionKeyAvailable
        }
        onClick={onSendBallots}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-9"
      >
        {isSendingBulkTickets ? (
          isPaused ? (
            <PlayCircle className="h-4 w-4 mr-1" />
          ) : (
            <Loader className="h-4 w-4 mr-1 animate-spin" />
          )
        ) : (
          <Ticket className="h-4 w-4 mr-1" />
        )}
        <span>
          {isSendingBulkTickets
            ? isPaused
              ? 'Tiếp tục cấp phiếu'
              : 'Đang cấp phiếu...'
            : `Cấp Phiếu (${selectedVotersCount})`}
        </span>
      </Button>
    </div>
  );
};

export default VoterActionBar;
