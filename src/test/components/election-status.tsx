'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { CheckCircle, Clock, AlertCircle, Bell } from 'lucide-react';
import { formatDate } from './utils';

interface ElectionStatusProps {
  electionInfo: any;
  sessions: any[];
  latestNotification?: {
    message: string;
    timestamp: Date;
    target: 'election' | 'session';
    sessionId?: string;
  };
}

export default function ElectionStatus({
  electionInfo,
  sessions,
  latestNotification,
}: ElectionStatusProps) {
  if (!electionInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trạng Thái Cuộc Bầu Cử</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Chưa có thông tin cuộc bầu cử</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng chọn cuộc bầu cử để xem trạng thái</p>
        </CardContent>
      </Card>
    );
  }

  const activeSessionsCount = sessions?.filter((s) => s.status === 'active').length || 0;
  const totalSessions = sessions?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng Thái Cuộc Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Tổng Quan Cuộc Bầu Cử</h3>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {electionInfo.isActive ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
              <span className="text-base">
                Trạng thái: {electionInfo.isActive ? 'Đang hoạt động' : 'Chưa bắt đầu'}
              </span>
            </div>

            {electionInfo.isActive && (
              <>
                <div className="text-sm text-gray-600 pl-7">
                  Thời gian bắt đầu: {formatDate(electionInfo.startTime)}
                </div>
                <div className="text-sm text-gray-600 pl-7">
                  Thời gian kết thúc: {formatDate(electionInfo.endTime)}
                </div>
              </>
            )}

            <div className="text-sm text-gray-600 pl-7">
              Phiên đang hoạt động: {activeSessionsCount} / {totalSessions}
            </div>
          </div>
        </div>

        {sessions?.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Phiên Bầu Cử</h3>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Thời Gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {session.status === 'active' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span>
                            {session.status === 'active' ? 'Đang hoạt động' : 'Chưa bắt đầu'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.status === 'active' ? (
                          <div className="text-sm">
                            <div>Bắt đầu: {formatDate(session.startTime)}</div>
                            <div>Kết thúc: {formatDate(session.endTime)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Chưa bắt đầu</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {latestNotification && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Thông Báo Mới Nhất</h3>

            <div className="rounded-md bg-orange-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">{latestNotification.message}</p>
                  <p className="mt-1 text-xs text-orange-500">
                    {latestNotification.target === 'session'
                      ? `Phiên #${latestNotification.sessionId} - ${formatDate(latestNotification.timestamp)}`
                      : formatDate(latestNotification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
