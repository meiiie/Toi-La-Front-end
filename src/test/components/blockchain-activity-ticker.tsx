'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Activity } from 'lucide-react';
import { useState } from 'react';

interface BlockchainActivity {
  timestamp: string;
  message: string;
}

interface BlockchainActivityTickerProps {
  activities: BlockchainActivity[];
}

export default function BlockchainActivityTicker({ activities }: BlockchainActivityTickerProps) {
  const [animationPaused, setAnimationPaused] = useState(false);

  // Tạo chuỗi hoạt động lặp lại để tạo hiệu ứng ticker liên tục
  const repeatedActivities = [...activities, ...activities];

  return (
    <Card className="shadow-md border-[#E0E0E0] bg-white">
      <CardHeader className="bg-[#FAFAFA] border-b border-[#EEEEEE] pb-3">
        <CardTitle className="text-xl text-[#263238] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#0288D1]" />
          Hoạt Động Blockchain
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-[#78909C]">
            <div className="mb-2">Không có hoạt động blockchain nào</div>
            <div className="text-sm">Dữ liệu sẽ xuất hiện khi có hoạt động trên blockchain</div>
          </div>
        ) : (
          <>
            <div className="border border-[#EEEEEE] rounded-lg p-4 bg-[#FAFAFA] mb-4">
              <h3 className="text-sm font-medium text-[#455A64] mb-2">Hoạt động mới nhất:</h3>
              <div className="flex items-center gap-2 text-[#263238]">
                <span className="bg-[#E3F2FD] text-[#0288D1] px-2 py-1 rounded text-xs font-medium">
                  {activities[0]?.timestamp}
                </span>
                <span>{activities[0]?.message}</span>
              </div>
            </div>

            <div
              className="border border-[#EEEEEE] rounded-lg h-[60px] overflow-hidden relative"
              onMouseEnter={() => setAnimationPaused(true)}
              onMouseLeave={() => setAnimationPaused(false)}
            >
              <div
                className={`absolute whitespace-nowrap ${animationPaused ? 'animate-none' : 'animate-marquee'} flex items-center h-full`}
              >
                {repeatedActivities.map((activity, index) => (
                  <span key={index} className="inline-block px-4 text-sm text-[#455A64]">
                    <span className="text-[#0288D1] font-medium">[{activity.timestamp}]</span> -{' '}
                    {activity.message}
                    <span className="mx-4 text-[#CFD8DC]">•</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
              {activities.map((activity, index) => (
                <div key={index} className="text-sm border-l-2 border-[#0288D1] pl-3 py-1">
                  <div className="text-xs text-[#78909C]">{activity.timestamp}</div>
                  <div className="text-[#455A64]">{activity.message}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
