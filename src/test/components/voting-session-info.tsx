'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useVoting } from './voting-context';
import { formatDate } from './utils';

export default function VotingSessionInfo() {
  const [sessionId, setSessionId] = useState('2');
  const { sessionInfo, loadSession, isLoading } = useVoting();

  const handleLoadSession = () => {
    loadSession(sessionId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông Tin Phiên Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Nhập ID phiên bầu cử"
            className="max-w-[200px]"
          />
          <Button onClick={handleLoadSession} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Tải Phiên'}
          </Button>
        </div>

        {sessionInfo && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-slate-800">{sessionInfo.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full ${sessionInfo.active ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className="text-sm text-slate-700">
                {sessionInfo.active ? 'Đang hoạt động' : 'Đã kết thúc'}
              </span>
            </div>
            <div className="text-sm text-slate-700">
              <p>Bắt đầu: {formatDate(new Date(sessionInfo.startTime))}</p>
              <p>Kết thúc: {formatDate(new Date(sessionInfo.endTime))}</p>
              <p>
                Cử tri: {sessionInfo.voterCount} / {sessionInfo.maxVoters}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
