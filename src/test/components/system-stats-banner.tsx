import { CheckCircle, XCircle, Wallet, AlertTriangle } from 'lucide-react';

interface SystemStatsBannerProps {
  totalElections: number;
  totalSessions: number;
  totalVotes: number;
  isConnected: boolean;
  isMetaMaskConnected: boolean;
}

export default function SystemStatsBanner({
  totalElections,
  totalSessions,
  totalVotes,
  isConnected,
  isMetaMaskConnected,
}: SystemStatsBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#01579B] to-[#0288D1] rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Blockchain Voting Network</h2>

        <div className="flex flex-wrap gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${isConnected ? 'bg-[#4CAF50]/20 text-[#E8F5E9]' : 'bg-[#F44336]/20 text-[#FFEBEE]'}`}
          >
            {isConnected ? (
              <CheckCircle className="w-4 h-4 text-[#A5D6A7]" />
            ) : (
              <XCircle className="w-4 h-4 text-[#EF9A9A]" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Đã kết nối blockchain' : 'Chưa kết nối blockchain'}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${isMetaMaskConnected ? 'bg-[#4CAF50]/20 text-[#E8F5E9]' : 'bg-[#FF9800]/20 text-[#FFF3E0]'}`}
          >
            {isMetaMaskConnected ? (
              <CheckCircle className="w-4 h-4 text-[#A5D6A7]" />
            ) : (
              <Wallet className="w-4 h-4 text-[#FFB74D]" />
            )}
            <span className="text-sm font-medium">
              {isMetaMaskConnected ? 'Đã kết nối ví' : 'Chưa kết nối ví'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-center">
          <div className="text-[#B3E5FC] text-sm font-medium mb-2">Tổng Cuộc Bầu Cử</div>
          <div className="text-3xl font-bold text-white">{totalElections}</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-center">
          <div className="text-[#B3E5FC] text-sm font-medium mb-2">Tổng Phiên Bầu</div>
          <div className="text-3xl font-bold text-white">{totalSessions}</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-center">
          <div className="text-[#B3E5FC] text-sm font-medium mb-2">Tổng Phiếu Đã Bỏ</div>
          <div className="text-3xl font-bold text-white">{totalVotes}</div>
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 bg-[#F44336]/10 border border-[#F44336]/20 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFCDD2] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#FFCDD2]">
            Không thể kết nối đến blockchain. Vui lòng kiểm tra kết nối mạng của bạn hoặc thử kết
            nối ví MetaMask để truy cập dữ liệu blockchain.
          </div>
        </div>
      )}
    </div>
  );
}
