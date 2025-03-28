'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { RefreshCw, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Candidate {
  address: string;
  votes: number;
  name: string;
  imageUrl: string;
}

interface ResultsDisplayProps {
  candidates: Candidate[];
  onRefresh: () => void;
  isLoading: boolean;
}

const COLORS = ['#FFB300', '#B0BEC5', '#8D6E63', '#90CAF9', '#80CBC4', '#EF9A9A'];

export function ResultsDisplay({ candidates, onRefresh, isLoading }: ResultsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  const pieData = candidates.map((candidate) => ({
    name: candidate.name,
    value: candidate.votes,
    percentage: ((candidate.votes / totalVotes) * 100).toFixed(1),
  }));

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-[#FFB300]'; // Vàng
      case 1:
        return 'text-[#B0BEC5]'; // Bạc
      case 2:
        return 'text-[#8D6E63]'; // Đồng
      default:
        return 'text-[#CFD8DC]'; // Xám
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-[#ECEFF1] rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className="text-[#0288D1]">{`${payload[0].payload.percentage}%`}</p>
          <p className="text-[#37474F]">{`${payload[0].value} phiếu`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-[#37474F]">Kết Quả Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-1/2 max-w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#37474F]" />
            <Input
              type="text"
              placeholder="Tìm ứng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border-[#CFD8DC] rounded-lg"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-[#4FC3F7] hover:bg-[#0288D1] text-white border-none rounded-lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {candidates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#37474F] mb-4">Biểu Đồ Tỷ Lệ Phiếu Bầu</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {candidates.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_100px] bg-[#F5F7FA] text-[#37474F] font-semibold text-sm p-3">
              <div>Hạng</div>
              <div>Ứng Viên</div>
              <div className="text-right">Số Phiếu</div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredCandidates.map((candidate, index) => (
                <div
                  key={candidate.address}
                  className="grid grid-cols-[80px_1fr_100px] p-3 border-t border-[#ECEFF1] hover:bg-[#FAFAFA]"
                >
                  <div
                    className={`flex items-center justify-center font-bold text-lg ${getRankColor(index)}`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="mb-2 w-full">
                      <img
                        src={candidate.imageUrl || '/placeholder.svg'}
                        alt={candidate.name}
                        width={150}
                        height={150}
                        className="rounded-md border border-[#CFD8DC] object-cover"
                      />
                    </div>
                    <div className="font-semibold text-[#37474F]">{candidate.name}</div>
                    <div className="text-sm text-[#37474F]">{candidate.address}</div>
                  </div>
                  <div className="text-right font-bold text-[#37474F]">
                    {candidate.votes}
                    <div className="text-sm font-normal text-[#0288D1]">
                      {totalVotes > 0
                        ? `${((candidate.votes / totalVotes) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              ))}

              {filteredCandidates.length === 0 && (
                <div className="p-4 text-center text-[#37474F]">
                  Không tìm thấy ứng viên phù hợp.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[#37474F]">
            {isLoading
              ? 'Đang tải dữ liệu...'
              : 'Chưa có dữ liệu ứng viên. Vui lòng tải phiên bầu cử.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
