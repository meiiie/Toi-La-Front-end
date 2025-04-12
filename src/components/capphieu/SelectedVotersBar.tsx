import React from 'react';
import { Button } from '../../components/ui/Button';
import { Ticket } from 'lucide-react';

interface SelectedVotersBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSendBallots: () => void;
  isSendingBulkTickets: boolean;
  sessionActive: boolean;
  sessionKeyAvailable: boolean;
}

const SelectedVotersBar: React.FC<SelectedVotersBarProps> = ({
  selectedCount,
  onClearSelection,
  onSendBallots,
  isSendingBulkTickets,
  sessionActive,
  sessionKeyAvailable,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/20">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Đã chọn {selectedCount} cử tri
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClearSelection} className="h-8">
            <span>Bỏ chọn</span>
          </Button>
          <Button
            size="sm"
            disabled={isSendingBulkTickets || !sessionActive || !sessionKeyAvailable}
            onClick={onSendBallots}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Ticket className="h-3.5 w-3.5 mr-1" />
            <span>Cấp phiếu</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedVotersBar;
