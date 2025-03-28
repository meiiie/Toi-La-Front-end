'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Search, RefreshCw } from 'lucide-react';
import { useVoting } from './voting-context';
import { formatTime } from './utilsVoting';

export default function VotingProgress() {
  const [searchTerm, setSearchTerm] = useState('');
  const { sessionInfo, voters, refreshVoters, timeRemaining, timePercentage, isLoading } =
    useVoting();

  const filteredVoters = voters.filter((voter) =>
    voter.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tiến Trình Bỏ Phiếu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessionInfo ? (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">Thời Gian Còn Lại</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {timeRemaining ? formatTime(timeRemaining) : '--:--:--'}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${timePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Cử Tri Đã Bỏ Phiếu</h3>
                <div className="text-sm text-slate-500">
                  {voters.length} / {sessionInfo.maxVoters}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm địa chỉ..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={refreshVoters} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredVoters.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filteredVoters.map((voter, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 hover:bg-slate-50"
                        >
                          <div className="text-sm text-slate-700">
                            {voter.address.substring(0, 10)}...
                            {voter.address.substring(voter.address.length - 4)}
                          </div>
                          <div className="text-xs text-slate-500">{voter.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      {isLoading ? 'Đang tải...' : 'Không có dữ liệu'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Vui lòng tải phiên bầu cử để xem tiến trình
          </div>
        )}
      </CardContent>
    </Card>
  );
}
