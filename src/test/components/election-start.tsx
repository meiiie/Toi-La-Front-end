'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';

interface ElectionStartProps {
  electionInfo: any;
  sessions: any[];
  onStartElection: (duration: number, unit: string) => void;
  onStartSession: (sessionId: string, duration: number, unit: string) => void;
  onStartAllSessions: (duration: number, unit: string) => void;
  loading: boolean;
}

export default function ElectionStart({
  electionInfo,
  sessions,
  onStartElection,
  onStartSession,
  onStartAllSessions,
  loading,
}: ElectionStartProps) {
  const [electionDuration, setElectionDuration] = useState<string>('3');
  const [electionUnit, setElectionUnit] = useState<string>('days');
  const [sessionDuration, setSessionDuration] = useState<string>('1');
  const [sessionUnit, setSessionUnit] = useState<string>('days');

  const handleStartElection = () => {
    const duration = Number.parseInt(electionDuration);
    if (!isNaN(duration) && duration > 0) {
      onStartElection(duration, electionUnit);
    }
  };

  const handleStartSession = (sessionId: string) => {
    const duration = Number.parseInt(sessionDuration);
    if (!isNaN(duration) && duration > 0) {
      onStartSession(sessionId, duration, sessionUnit);
    }
  };

  const handleStartAllSessions = () => {
    const duration = Number.parseInt(sessionDuration);
    if (!isNaN(duration) && duration > 0) {
      onStartAllSessions(duration, sessionUnit);
    }
  };

  const isElectionActive = electionInfo?.isActive;
  const hasActiveSessions = sessions?.some((s) => s.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bắt Đầu Cuộc Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!electionInfo ? (
          <div className="text-center py-4 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Vui lòng chọn cuộc bầu cử trước</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Bắt đầu cuộc bầu cử</h3>

              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Thời gian"
                  value={electionDuration}
                  onChange={(e) => setElectionDuration(e.target.value)}
                  className="max-w-[120px]"
                  disabled={isElectionActive || loading}
                />

                <Select
                  value={electionUnit}
                  onValueChange={setElectionUnit}
                  disabled={isElectionActive || loading}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Phút</SelectItem>
                    <SelectItem value="hours">Giờ</SelectItem>
                    <SelectItem value="days">Ngày</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleStartElection}
                  disabled={isElectionActive || loading || !electionDuration}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Bắt Đầu Cuộc Bầu Cử
                </Button>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                {isElectionActive ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-success" />
                    <span>Cuộc bầu cử đã được bắt đầu</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Sẵn sàng bắt đầu</span>
                  </>
                )}
              </div>
            </div>

            {isElectionActive && sessions?.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Bắt đầu phiên bầu cử</h3>

                <div className="flex items-center space-x-2 mb-4">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Thời gian"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="max-w-[120px]"
                    disabled={loading}
                  />

                  <Select value={sessionUnit} onValueChange={setSessionUnit} disabled={loading}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Phút</SelectItem>
                      <SelectItem value="hours">Giờ</SelectItem>
                      <SelectItem value="days">Ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID Phiên</TableHead>
                        <TableHead>Trạng Thái</TableHead>
                        <TableHead className="text-right">Hành Động</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartSession(session.id)}
                              disabled={session.status === 'active' || loading}
                              className="bg-info/20 hover:bg-info/30 text-info-foreground"
                            >
                              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              Bắt Đầu
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  onClick={handleStartAllSessions}
                  disabled={hasActiveSessions || loading}
                  className="mt-4"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Bắt Đầu Tất Cả Phiên
                </Button>

                <div className="flex items-center text-sm text-gray-500">
                  {hasActiveSessions ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-success" />
                      <span>Có phiên đã được bắt đầu</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Chọn phiên để bắt đầu</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
