import { Button } from '../../components/ui/Button';

interface HeaderProps {
  account: string;
  isConnected: boolean;
  isNetworkOnline: boolean;
  onConnect: () => void;
}

export function Header({ account, isConnected, isNetworkOnline, onConnect }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[#ECEFF1] py-4 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0288D1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 mr-2"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h1 className="text-xl font-bold text-[#37474F]">Quản Lý Bầu Cử Blockchain</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${isNetworkOnline ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}
            ></div>
            <span className="text-sm text-[#37474F]">POA Geth</span>
          </div>

          {isConnected ? (
            <div className="px-3 py-1.5 border border-[#CFD8DC] rounded-md text-sm text-[#37474F]">
              {account.substring(0, 6)}...{account.substring(38)}
            </div>
          ) : (
            <Button
              onClick={onConnect}
              className="bg-[#0288D1] hover:bg-[#01579B] text-white font-medium"
            >
              Kết nối MetaMask
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
