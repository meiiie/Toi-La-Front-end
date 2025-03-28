'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { RefreshCw, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Voter {
  address: string;
  timestamp: Date;
}

interface VoterParticipationProps {
  voters: Voter[];
  sessionData: any;
  onRefresh: () => void;
}

export function VoterParticipation({ voters, sessionData, onRefresh }: VoterParticipationProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVoters = voters.filter((voter) =>
    voter.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatTime = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const participationRate = sessionData?.maxVoters
    ? Math.round((voters.length / sessionData.maxVoters) * 100)
    : 0;

  // Dữ liệu cho biểu đồ cột
  const chartData = [
    {
      name: 'Tỷ lệ tham gia',
      'Đã bỏ phiếu': voters.length,
      'Chưa bỏ phiếu': sessionData?.maxVoters ? sessionData.maxVoters - voters.length : 0,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-[#37474F]">Thống Kê Cử Tri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Thống kê */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-[#FAFAFA]">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-base text-[#37474F]">
                  Tổng số cử tri:{' '}
                  <span className="font-semibold">{sessionData?.maxVoters || 0}</span>
                </div>
                <div className="text-base text-[#37474F]">
                  Đã bỏ phiếu: <span className="font-semibold">{voters.length}</span>
                </div>
                <div className="col-span-2 text-base text-[#0288D1] font-semibold">
                  Tỷ lệ tham gia: {participationRate}%
                </div>
              </div>
            </div>

            {/* Biểu đồ cột */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Đã bỏ phiếu" fill="#4FC3F7" />
                  <Bar dataKey="Chưa bỏ phiếu" fill="#FFB300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Danh sách cử tri */}
          <div>
            <h3 className="text-base font-semibold text-[#37474F] mb-2">Danh Sách Cử Tri</h3>

            <div className="flex items-center justify-between mb-4">
              <div className="relative w-1/2 max-w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#37474F]" />
                <Input
                  type="text"
                  placeholder="Tìm địa chỉ cử tri..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-[#CFD8DC] rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="bg-[#4FC3F7] hover:bg-[#0288D1] text-white border-none rounded-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_150px] bg-[#F5F7FA] text-[#37474F] font-semibold text-sm p-3">
                <div>Địa Chỉ Cử Tri</div>
                <div>Thời Gian Bỏ Phiếu</div>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {filteredVoters.length > 0 ? (
                  filteredVoters.map((voter, index) => (
                    <div
                      key={`${voter.address}-${index}`}
                      className="grid grid-cols-[1fr_150px] p-3 border-t border-[#ECEFF1] hover:bg-[#FAFAFA]"
                    >
                      <div className="text-sm text-[#37474F]">{voter.address}</div>
                      <div className="text-sm text-[#37474F]">{formatTime(voter.timestamp)}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[#37474F]">
                    {searchTerm ? 'Không tìm thấy cử tri phù hợp.' : 'Chưa có dữ liệu cử tri.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
