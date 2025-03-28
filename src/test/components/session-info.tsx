import { Badge } from '../../components/ui/Badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface SessionInfoProps {
  session: {
    id: number;
    name: string;
    isActive: boolean;
    startTime: Date;
    endTime: Date;
    maxVoters: number;
    currentVoters: number;
  };
}

export default function SessionInfo({ session }: SessionInfoProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-4 mt-2 space-y-2 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{session.name}</h3>
        <Badge variant={session.isActive ? 'default' : 'secondary'}>
          {session.isActive ? (
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Đang Hoạt Động</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>Không Hoạt Động</span>
            </div>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Bắt đầu:</span> {formatDate(session.startTime)}
        </div>
        <div>
          <span className="text-gray-500">Kết thúc:</span> {formatDate(session.endTime)}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Cử tri:</span> {session.currentVoters} /{' '}
          {session.maxVoters}
        </div>
      </div>
    </div>
  );
}
