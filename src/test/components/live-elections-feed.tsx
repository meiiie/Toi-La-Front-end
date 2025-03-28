import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Users, Vote } from 'lucide-react';

interface Election {
  id: number;
  name: string;
  status: 'active' | 'closed' | 'pending' | 'starting';
  sessions: number;
  votes: number;
}

interface LiveElectionsFeedProps {
  elections: Election[];
}

export default function LiveElectionsFeed({ elections }: LiveElectionsFeedProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#4CAF50] hover:bg-[#388E3C]">Đang Diễn Ra</Badge>;
      case 'closed':
        return <Badge className="bg-[#F44336] hover:bg-[#D32F2F]">Đã Kết Thúc</Badge>;
      case 'pending':
        return <Badge className="bg-[#9E9E9E] hover:bg-[#757575]">Chờ Xử Lý</Badge>;
      case 'starting':
        return <Badge className="bg-[#FF9800] hover:bg-[#F57C00]">Sắp Bắt Đầu</Badge>;
      default:
        return <Badge className="bg-[#9E9E9E] hover:bg-[#757575]">Chờ Xử Lý</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden shadow-md border-[#E0E0E0] bg-white">
      <CardHeader className="bg-[#FAFAFA] border-b border-[#EEEEEE] pb-3">
        <CardTitle className="text-xl text-[#263238] flex items-center gap-2">
          <Vote className="w-5 h-5 text-[#0288D1]" />
          Cuộc Bầu Cử Trực Tuyến
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {elections.length === 0 ? (
          <div className="p-8 text-center text-[#78909C]">
            <div className="mb-2">Không có cuộc bầu cử nào</div>
            <div className="text-sm">Dữ liệu sẽ xuất hiện khi có cuộc bầu cử được tạo</div>
          </div>
        ) : (
          <div className="divide-y divide-[#EEEEEE]">
            {elections.map((election) => (
              <div key={election.id} className="p-5 hover:bg-[#F5F7FA] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs text-[#78909C] mb-1">ID: {election.id}</div>
                    <h3 className="text-lg font-bold text-[#263238] mb-2">{election.name}</h3>
                  </div>
                  {getStatusBadge(election.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-[#455A64]">
                    <Users className="w-4 h-4 text-[#0288D1]" />
                    <span className="text-sm">Phiên: {election.sessions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#455A64]">
                    <Vote className="w-4 h-4 text-[#0288D1]" />
                    <span className="text-sm">Phiếu bầu: {election.votes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
