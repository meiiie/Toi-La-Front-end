'use client';

import { useState } from 'react';
import { Search, RefreshCw, UserCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface VotingActivity {
  voterAddress: string;
  session: number;
  timestamp: string;
}

interface VotingActivityFeedProps {
  activities: VotingActivity[];
}

export default function VotingActivityFeed({ activities }: VotingActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredActivities = activities.filter((activity) =>
    activity.voterAddress.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Giả lập thời gian làm mới
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Card className="shadow-md border-[#E0E0E0] bg-white">
      <CardHeader className="bg-[#FAFAFA] border-b border-[#EEEEEE] pb-3">
        <CardTitle className="text-xl text-[#263238] flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#0288D1]" />
          Hoạt Động Bỏ Phiếu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#78909C]" />
            <Input
              placeholder="Tìm địa chỉ cử tri..."
              className="pl-9 rounded-lg border-[#CFD8DC] focus:border-[#0288D1] focus:ring-[#0288D1]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="bg-[#0288D1] hover:bg-[#01579B] text-white border-none"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Làm mới</span>
          </Button>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-[#78909C]">
            <div className="mb-2">Không có hoạt động bỏ phiếu nào</div>
            <div className="text-sm">Dữ liệu sẽ xuất hiện khi có cử tri bỏ phiếu</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#EEEEEE]">
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FA] text-[#455A64]">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Địa Chỉ Cử Tri</th>
                    <th className="text-left p-3 text-sm font-medium">Phiên</th>
                    <th className="text-left p-3 text-sm font-medium">Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#EEEEEE] hover:bg-[#F5F7FA] transition-colors"
                    >
                      <td className="p-3 text-sm font-medium text-[#7B1FA2]">
                        {formatAddress(activity.voterAddress)}
                      </td>
                      <td className="p-3 text-sm text-[#455A64]">{activity.session}</td>
                      <td className="p-3 text-sm text-[#455A64] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#78909C]" />
                        {activity.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
