import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { CheckCircle2, XCircle, RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import { TicketSendProgress } from './VoterContext';

interface BallotDistributionProgressProps {
  isSendingBulkTickets: boolean;
  isPaused: boolean;
  progress: TicketSendProgress;
  onPauseToggle: () => void;
}

const BallotDistributionProgress: React.FC<BallotDistributionProgressProps> = ({
  isSendingBulkTickets,
  isPaused,
  progress,
  onPauseToggle,
}) => {
  if (!isSendingBulkTickets) {
    return null;
  }

  const progressPercentage =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300 mr-2">
            Đang cấp phiếu bầu: {progress.current}/{progress.total}
          </span>
          {isPaused ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              Tạm dừng
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Đang xử lý batch {progress.currentBatchSize} cử tri
            </Badge>
          )}
        </div>
        <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
          {progressPercentage}%
        </span>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="space-x-4">
          <span className="text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="inline-block h-3 w-3 mr-1" />
            Thành công: {progress.success}
          </span>
          <span className="text-rose-600 dark:text-rose-400">
            <XCircle className="inline-block h-3 w-3 mr-1" />
            Thất bại: {progress.failed}
          </span>
          {progress.retries > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              <RefreshCw className="inline-block h-3 w-3 mr-1" />
              Thử lại: {progress.retries}
            </span>
          )}
        </div>
        <div>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 ml-2" onClick={onPauseToggle}>
            {isPaused ? <PlayCircle className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BallotDistributionProgress;
