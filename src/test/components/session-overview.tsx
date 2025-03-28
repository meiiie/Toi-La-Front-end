import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2 } from 'lucide-react';

interface SessionOverviewProps {
  sessionId: string;
  setSessionId: (id: string) => void;
  sessionData: any;
  onLoadResults: () => Promise<void>;
  isLoading: boolean;
}

export function SessionOverview({
  sessionId,
  setSessionId,
  sessionData,
  onLoadResults,
  isLoading,
}: SessionOverviewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    if (isActive) {
      return <span className="inline-flex items-center">🟢 Đang diễn ra</span>;
    } else {
      return <span className="inline-flex items-center">🔴 Đã kết thúc</span>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-[#37474F]">Thông Tin Phiên Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Nhập ID phiên"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-1/2 max-w-[200px] border-[#CFD8DC] rounded-lg"
            />
            <Button
              onClick={onLoadResults}
              disabled={isLoading || !sessionId}
              className="bg-[#0288D1] hover:bg-[#01579B] text-white font-bold rounded-lg"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tải Kết Quả
            </Button>
          </div>

          <div className="pt-2 border-t border-[#ECEFF1]">
            {sessionData ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold text-[#37474F]">
                  {sessionData.name || `Phiên bầu cử #${sessionData.id}`}
                </div>
                <div className="text-base text-[#37474F]">
                  Trạng thái: {getStatusIcon(sessionData.isActive)}
                </div>
                <div className="text-sm text-[#37474F]">
                  Bắt đầu: {formatDate(sessionData.startTime)}
                </div>
                <div className="text-sm text-[#37474F]">
                  Kết thúc: {formatDate(sessionData.endTime)}
                </div>
                <div className="text-sm text-[#37474F]">
                  Tổng số cử tri: {sessionData.maxVoters}
                </div>
                <div className="text-sm text-[#37474F]">
                  Đã bỏ phiếu: {sessionData.votesCast || 0}
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#37474F]">
                Trạng thái: <span className="inline-flex items-center">⚪ Chưa tải phiên</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
