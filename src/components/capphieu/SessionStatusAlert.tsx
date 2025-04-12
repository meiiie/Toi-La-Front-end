import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { AlertCircle } from 'lucide-react';
import type { PhienBauCu } from '../../store/types';

interface SessionStatusAlertProps {
  selectedSession: PhienBauCu | null;
  sessionActive: boolean;
  sessionKeyAvailable: boolean;
}

const SessionStatusAlert: React.FC<SessionStatusAlertProps> = ({
  selectedSession,
  sessionActive,
  sessionKeyAvailable,
}) => {
  if (!selectedSession) {
    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Chưa chọn phiên bầu cử</AlertTitle>
        <AlertDescription>
          Vui lòng chọn một phiên bầu cử từ tab "Phiên Bầu Cử" để xem danh sách cử tri.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sessionActive) {
    return (
      <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Phiên bầu cử chưa bắt đầu</AlertTitle>
        <AlertDescription>
          Bạn cần bắt đầu phiên bầu cử trên blockchain trước khi có thể cấp phiếu bầu cho cử tri.
          {!sessionKeyAvailable && ' Cần lấy khóa phiên trước khi bắt đầu phiên bầu cử.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SessionStatusAlert;
